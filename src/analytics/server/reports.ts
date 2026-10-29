import { sql, type SQL } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

import type { AnalyticsSetting } from '../../payload-types'

import { labelOf, LEAD_TYPES, REGIONS, SUBJECTS } from '../../lib/constants'
import { DEFAULT_PLAN_STEPS, LANDING_SECTIONS, SETTINGS_SLUG } from '../shared'
import { CHANNEL_LABELS, channelCaseSQL } from './channels'
import { hasCollection, queryRows } from './db'
import { IN_APP_BROWSERS } from './userAgent'

// Казахстан с 2024 года живёт в едином поясе UTC+5.
const TZ = sql.raw(`'Asia/Almaty'`)

// ID сравниваем побайтно: группировка и DISTINCT по строкам в локальной сортировке (en_US/ru_RU)
// в разы медленнее, а для случайных ID она не нужна.
const VID = sql.raw(`visitor_id COLLATE "C"`)
const SID = sql.raw(`session_id COLLATE "C"`)

export const PERIODS = [
  { key: 'today', label: 'Сегодня', days: 1 },
  { key: '7d', label: '7 дней', days: 7 },
  { key: '30d', label: '30 дней', days: 30 },
  { key: 'all', label: 'Всё время', days: 0 },
] as const
export type PeriodKey = (typeof PERIODS)[number]['key']

export const parsePeriod = (value: unknown): PeriodKey =>
  PERIODS.some((p) => p.key === value) ? (value as PeriodKey) : '7d'

type Filters = {
  period: PeriodKey
  from: SQL | null // начало периода, timestamptz
  landing: string | null
  excluded: string[]
}

type Ctx = Filters & {
  payload: Payload
  hasLeads: boolean
  hasLandings: boolean
  countSchoolParticipants: boolean
  planSteps: number[]
}

export type Row = { key: string; label: string; visitors: number; leads: number; paid: number }

export type Report = {
  period: PeriodKey
  landing: string | null
  landings: { slug: string; title: string }[]
  hasLeads: boolean
  leadsError: boolean
  totals: {
    visitors: number
    visits: number
    leads: number
    registrations: number
    schoolLeads: number
    paidInPeriod: number
    paidOfLeads: number
  }
  plan: { steps: number[]; paid: number }
  series: { key: string; label: string; visitors: number; visits: number; leads: number }[]
  bucket: 'hour' | 'day'
  sources: Row[]
  campaigns: (Row & { source: string; medium: string; campaign: string })[]
  devices: Row[]
  browsers: (Row & { inApp: boolean })[]
  systems: Row[]
  sections: { key: string; label: string; sessions: number; share: number }[]
  funnel: { key: string; label: string; value: number }[]
  leadsBy: Record<
    'type' | 'subject' | 'region' | 'howHeard',
    { key: string; label: string; leads: number; paid: number }[]
  >
}

const num = (v: unknown) => Number(v) || 0

function periodStart(period: PeriodKey): SQL | null {
  const days = PERIODS.find((p) => p.key === period)?.days || 0
  if (!days) return null
  return sql`((date_trunc('day', now() AT TIME ZONE ${TZ}) - ${sql.raw(`interval '${days - 1} days'`)}) AT TIME ZONE ${TZ})`
}

function eventsWhere(f: Filters): SQL {
  const parts: SQL[] = [sql`true`]
  if (f.from) parts.push(sql`created_at >= ${f.from}`)
  if (f.landing) parts.push(sql`landing = ${f.landing}`)
  if (f.excluded.length) parts.push(sql`visitor_id NOT IN ${f.excluded}`)
  return sql.join(parts, sql` AND `)
}

function leadsLandingWhere(c: Ctx): SQL {
  if (!c.landing || !c.hasLandings) return sql`true`
  return sql`landing_id IN (SELECT id FROM landings WHERE slug = ${c.landing})`
}

function leadsWhere(c: Ctx): SQL {
  const parts: SQL[] = [leadsLandingWhere(c)]
  if (c.from) parts.push(sql`created_at >= ${c.from}`)
  return sql.join(parts, sql` AND `)
}

const NOT_DOWNLOAD = sql`type::text <> 'regulations'`

async function loadSettings(payload: Payload) {
  let s: Partial<AnalyticsSetting> = {}
  try {
    s = await payload.findGlobal({ slug: SETTINGS_SLUG, depth: 0 })
  } catch (err) {
    payload.logger.error({ err }, 'analytics: не удалось прочитать analytics-settings')
  }
  const steps = [s.planStep1, s.planStep2, s.planStep3]
    .map((v, i) => (typeof v === 'number' && v > 0 ? v : DEFAULT_PLAN_STEPS[i]))
    .sort((a, b) => a - b)
  const excluded = (s.excludedVisitorIds || '')
    .split(/[\s,;]+/)
    .map((v) => v.trim())
    .filter((v) => /^[a-z0-9]{8,40}$/i.test(v))
  return { steps, excluded, countSchoolParticipants: s.countSchoolParticipants !== false }
}

type Result<T> = { data: T; failed: boolean }

// Коллекцию заявок ведёт другой модуль: если запрос к ней упал (нет таблицы, другое имя колонки),
// отчёт всё равно строится — без заявок и с предупреждением.
async function withLeads<T>(c: Ctx, run: (c: Ctx) => Promise<T>): Promise<Result<T>> {
  try {
    return { data: await run(c), failed: false }
  } catch (err) {
    if (!c.hasLeads) throw err
    c.payload.logger.error({ err }, 'analytics: запрос к заявкам не выполнился')
    return { data: await run({ ...c, hasLeads: false }), failed: true }
  }
}

async function landingOptions(c: Ctx): Promise<{ slug: string; title: string }[]> {
  if (c.hasLandings) {
    try {
      const r = await queryRows<{ slug: string; title: string | null }>(
        c.payload,
        sql`SELECT slug, internal_title AS title FROM landings WHERE slug IS NOT NULL ORDER BY id DESC`,
      )
      return r.map((x) => ({ slug: x.slug, title: x.title || x.slug }))
    } catch (err) {
      c.payload.logger.error({ err }, 'analytics: список лендингов')
    }
  }
  const r = await queryRows<{ slug: string }>(
    c.payload,
    sql`SELECT DISTINCT landing AS slug FROM analytics_events WHERE landing IS NOT NULL LIMIT 50`,
  )
  return r.map((x) => ({ slug: x.slug, title: x.slug }))
}

async function eventTotals(c: Ctx) {
  const [row] = await queryRows(
    c.payload,
    sql`WITH s AS (
          SELECT ${SID} AS sid, min(${VID}) AS vid FROM analytics_events
          WHERE ${eventsWhere(c)} GROUP BY 1
        )
        SELECT count(DISTINCT vid)::int AS visitors, count(*)::int AS visits FROM s`,
  )
  return { visitors: num(row?.visitors), visits: num(row?.visits) }
}

const NO_LEAD_TOTALS = {
  registrations: 0,
  schoolLeads: 0,
  leads: 0,
  paidOfLeads: 0,
  paidInPeriod: 0,
  planPaid: 0,
}

async function leadTotals(c: Ctx): Promise<typeof NO_LEAD_TOTALS> {
  if (!c.hasLeads) return NO_LEAD_TOTALS
  const weight = c.countSchoolParticipants
    ? sql`CASE WHEN type::text = 'school' THEN greatest(coalesce(participants_count, 1), 1) ELSE 1 END`
    : sql`1`
  const paidFrom = c.from ? sql`coalesce(payment_paid_at, updated_at) >= ${c.from}` : sql`true`
  const [byType, [paid]] = await Promise.all([
    queryRows<{ type: string; n: number; paid: number }>(
      c.payload,
      sql`SELECT type::text AS type, count(*)::int AS n, count(*) FILTER (WHERE payment_paid)::int AS paid
          FROM leads WHERE ${leadsWhere(c)} GROUP BY 1`,
    ),
    queryRows(
      c.payload,
      sql`SELECT count(*) FILTER (WHERE ${paidFrom})::int AS paid_period,
                 coalesce(sum(${weight}), 0)::int AS plan_paid
          FROM leads WHERE payment_paid AND ${NOT_DOWNLOAD} AND ${leadsLandingWhere(c)}`,
    ),
  ])
  const count = (t: string) => byType.find((r) => r.type === t)
  const registrations = num(count('registration')?.n) + num(count('waitlist')?.n)
  const schoolLeads = num(count('school')?.n)
  return {
    registrations,
    schoolLeads,
    leads: registrations + schoolLeads,
    paidOfLeads: byType
      .filter((r) => r.type !== 'regulations')
      .reduce((s, r) => s + num(r.paid), 0),
    paidInPeriod: num(paid?.paid_period),
    planPaid: num(paid?.plan_paid),
  }
}

async function series(c: Ctx) {
  const bucket = c.period === 'today' ? 'hour' : 'day'
  const b = sql.raw(`'${bucket}'`)
  const step = sql.raw(`interval '1 ${bucket}'`)
  const start = c.from
    ? sql`(${c.from}) AT TIME ZONE ${TZ}`
    : sql`greatest(coalesce((SELECT min(created_at) FROM analytics_events), now()), now() - interval '365 days') AT TIME ZONE ${TZ}`
  const leads = c.hasLeads
    ? sql`SELECT date_trunc(${b}, created_at AT TIME ZONE ${TZ}) AS t, count(*)::int AS leads
          FROM leads WHERE ${leadsWhere(c)} AND ${NOT_DOWNLOAD} GROUP BY 1`
    : sql`SELECT now()::timestamp AS t, 0 AS leads WHERE false`
  const rows = await queryRows<{ k: string; visitors: number; visits: number; leads: number }>(
    c.payload,
    sql`WITH g AS (
          SELECT generate_series(date_trunc(${b}, ${start}), date_trunc(${b}, now() AT TIME ZONE ${TZ}), ${step}) AS t
        ),
        s AS (
          SELECT ${SID} AS sid, min(${VID}) AS vid, min(created_at) AS started
          FROM analytics_events WHERE ${eventsWhere(c)} GROUP BY 1
        ),
        e AS (
          SELECT date_trunc(${b}, started AT TIME ZONE ${TZ}) AS t,
                 count(DISTINCT vid)::int AS visitors, count(*)::int AS visits
          FROM s GROUP BY 1
        ),
        l AS (${leads})
        SELECT to_char(g.t, 'YYYY-MM-DD"T"HH24') AS k,
               coalesce(e.visitors, 0)::int AS visitors, coalesce(e.visits, 0)::int AS visits,
               coalesce(l.leads, 0)::int AS leads
        FROM g LEFT JOIN e ON e.t = g.t LEFT JOIN l ON l.t = g.t ORDER BY g.t`,
  )
  const months = [
    'янв',
    'фев',
    'мар',
    'апр',
    'мая',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ]
  return {
    bucket: bucket as 'hour' | 'day',
    series: rows.map((r) => {
      const [date, hour] = r.k.split('T')
      const [, m, d] = date.split('-')
      return {
        key: r.k,
        label: bucket === 'hour' ? `${hour}:00` : `${Number(d)} ${months[Number(m) - 1]}`,
        visitors: num(r.visitors),
        visits: num(r.visits),
        leads: num(r.leads),
      }
    }),
  }
}

// Посетители по источнику, устройству, браузеру и ОС — одним проходом.
async function audience(c: Ctx) {
  return queryRows<{
    channel: string | null
    device: string | null
    browser: string | null
    os: string | null
    g: number
    visitors: number
  }>(
    c.payload,
    sql`WITH v AS (
          SELECT ${VID} AS vid, channel, device, browser, os FROM analytics_events
          WHERE ${eventsWhere(c)} GROUP BY 1, 2, 3, 4, 5
        )
        SELECT channel, device, browser, os, GROUPING(channel, device, browser, os)::int AS g,
               count(DISTINCT vid)::int AS visitors
        FROM v GROUP BY GROUPING SETS ((channel), (device), (browser), (os))`,
  )
}

// Заявки с источником: берём его у первого события того же посетителя (там учтён и встроенный
// браузер), а если трекер не сработал — классифицируем UTM/referrer из самой заявки.
type LeadAttributionRow = {
  channel: string
  device: string | null
  browser: string | null
  us: string | null
  um: string | null
  uc: string | null
  leads: number
  paid: number
}

async function leadAttribution(c: Ctx): Promise<LeadAttributionRow[]> {
  if (!c.hasLeads) return []
  const channel = channelCaseSQL(sql`l.us`, sql`l.ref`)
  return queryRows<{
    channel: string
    device: string | null
    browser: string | null
    us: string | null
    um: string | null
    uc: string | null
    leads: number
    paid: number
  }>(
    c.payload,
    sql`WITH l AS (
          SELECT payment_paid AS paid, attribution_visitor_id AS vid, attribution_utm_source AS us,
                 attribution_utm_medium AS um, attribution_utm_campaign AS uc,
                 attribution_referrer AS ref, attribution_device AS dev
          FROM leads WHERE ${leadsWhere(c)} AND ${NOT_DOWNLOAD}
        ),
        vf AS (
          SELECT DISTINCT ON (visitor_id) visitor_id, channel, device, browser,
                 utm_source, utm_medium, utm_campaign
          FROM analytics_events WHERE visitor_id IN (SELECT vid FROM l WHERE vid IS NOT NULL)
          ORDER BY visitor_id, created_at
        )
        SELECT coalesce(vf.channel, ${channel}) AS channel,
               coalesce(vf.device, l.dev) AS device, vf.browser,
               coalesce(nullif(lower(l.us), ''), vf.utm_source) AS us,
               coalesce(nullif(lower(l.um), ''), vf.utm_medium) AS um,
               coalesce(nullif(l.uc, ''), vf.utm_campaign) AS uc,
               count(*)::int AS leads, count(*) FILTER (WHERE l.paid)::int AS paid
        FROM l LEFT JOIN vf ON vf.visitor_id = l.vid
        GROUP BY 1, 2, 3, 4, 5, 6`,
  )
}

async function campaignVisitors(c: Ctx) {
  return queryRows<{ us: string | null; um: string | null; uc: string | null; visitors: number }>(
    c.payload,
    sql`WITH v AS (
          SELECT utm_source AS us, utm_medium AS um, utm_campaign AS uc, ${VID} AS vid
          FROM analytics_events
          WHERE ${eventsWhere(c)} AND (utm_source IS NOT NULL OR utm_campaign IS NOT NULL)
          GROUP BY 1, 2, 3, 4
        )
        SELECT us, um, uc, count(*)::int AS visitors FROM v GROUP BY 1, 2, 3`,
  )
}

async function sectionReach(c: Ctx) {
  return queryRows<{ section: string; sessions: number }>(
    c.payload,
    sql`WITH s AS (
          SELECT props->>'section' AS section, ${SID} AS sid FROM analytics_events
          WHERE ${eventsWhere(c)} AND event = 'section_view' AND props->>'section' IS NOT NULL
          GROUP BY 1, 2
        )
        SELECT section, count(*)::int AS sessions FROM s GROUP BY 1`,
  )
}

// Воронка по посетителям: «дошёл до шага» = сделал этот шаг или любой следующий.
async function funnel(c: Ctx) {
  const leads = c.hasLeads
    ? sql`SELECT attribution_visitor_id COLLATE "C" AS vid, bool_or(payment_paid) AS paid
          FROM leads
          WHERE ${leadsWhere(c)} AND type::text IN ('registration', 'waitlist')
            AND attribution_visitor_id IS NOT NULL
          GROUP BY 1`
    : sql`SELECT NULL::varchar COLLATE "C" AS vid, false AS paid WHERE false`
  const [row] = await queryRows(
    c.payload,
    sql`WITH ev AS (
          SELECT ${VID} AS vid,
            bool_or(event = 'section_view' AND props->>'section' = 'pricing') AS price,
            bool_or(event = 'cta_click') AS cta,
            bool_or(event = 'form_start' AND props->>'form' = 'registration') AS started,
            bool_or(event = 'form_submit' AND props->>'form' = 'registration') AS sent
          FROM analytics_events WHERE ${eventsWhere(c)}
          GROUP BY 1
        ),
        ld AS (${leads}),
        j AS (
          SELECT ev.*, ld.vid IS NOT NULL AS has_lead, coalesce(ld.paid, false) AS paid
          FROM ev LEFT JOIN ld ON ld.vid = ev.vid
        )
        SELECT count(*)::int AS s1,
          count(*) FILTER (WHERE price OR cta OR started OR sent OR has_lead)::int AS s2,
          count(*) FILTER (WHERE cta OR started OR sent OR has_lead)::int AS s3,
          count(*) FILTER (WHERE started OR sent OR has_lead)::int AS s4,
          count(*) FILTER (WHERE sent OR has_lead)::int AS s5,
          count(*) FILTER (WHERE paid)::int AS s6
        FROM j`,
  )
  return [
    { key: 'visit', label: 'Зашли на лендинг' },
    { key: 'pricing', label: 'Увидели «Стоимость»' },
    { key: 'cta', label: 'Нажали «Зарегистрироваться»' },
    { key: 'start', label: 'Начали заполнять форму' },
    { key: 'submit', label: 'Отправили заявку' },
    { key: 'paid', label: 'Оплатили' },
  ].map((s, i) => ({ ...s, value: num(row?.[`s${i + 1}`]) }))
}

async function leadsBreakdown(c: Ctx): Promise<Report['leadsBy']> {
  const out: Report['leadsBy'] = { type: [], subject: [], region: [], howHeard: [] }
  if (!c.hasLeads) return out
  const rows = await queryRows<{ dim: string; val: string | null; n: number; paid: number }>(
    c.payload,
    sql`SELECT 'type' AS dim, type::text AS val, count(*)::int AS n,
               count(*) FILTER (WHERE payment_paid)::int AS paid
        FROM leads WHERE ${leadsWhere(c)} GROUP BY 2
        UNION ALL
        SELECT 'subject', subject::text, count(*)::int, count(*) FILTER (WHERE payment_paid)::int
        FROM leads WHERE ${leadsWhere(c)} AND ${NOT_DOWNLOAD} AND type::text <> 'school' GROUP BY 2
        UNION ALL
        SELECT 'region', region::text, count(*)::int, count(*) FILTER (WHERE payment_paid)::int
        FROM leads WHERE ${leadsWhere(c)} AND ${NOT_DOWNLOAD} AND type::text <> 'school' GROUP BY 2
        UNION ALL
        SELECT 'howHeard', how_heard::text, count(*)::int, count(*) FILTER (WHERE payment_paid)::int
        FROM leads WHERE ${leadsWhere(c)} AND ${NOT_DOWNLOAD} AND type::text <> 'school' GROUP BY 2`,
  )
  const labels = {
    type: (v: string) => (v === 'regulations' ? 'Скачали положение' : labelOf(LEAD_TYPES, v)),
    subject: (v: string) => labelOf(SUBJECTS, v),
    region: (v: string) => labelOf(REGIONS, v),
    howHeard: (v: string) => v,
  }
  for (const r of rows) {
    const dim = r.dim as keyof Report['leadsBy']
    out[dim].push({
      key: r.val ?? '',
      label: r.val ? labels[dim](r.val) : 'Не указано',
      leads: num(r.n),
      paid: num(r.paid),
    })
  }
  for (const list of Object.values(out)) list.sort((a, b) => b.leads - a.leads)
  return out
}

function mergeRows(
  visitors: Map<string, number>,
  leads: Map<string, { leads: number; paid: number }>,
  label: (key: string) => string,
): Row[] {
  const keys = new Set([...visitors.keys(), ...leads.keys()])
  return [...keys]
    .map((key) => ({
      key,
      label: label(key),
      visitors: visitors.get(key) || 0,
      leads: leads.get(key)?.leads || 0,
      paid: leads.get(key)?.paid || 0,
    }))
    .sort((a, b) => b.visitors - a.visitors || b.leads - a.leads)
}

function addTo(
  map: Map<string, { leads: number; paid: number }>,
  key: string,
  leads: number,
  paid: number,
) {
  const cur = map.get(key) || { leads: 0, paid: 0 }
  cur.leads += leads
  cur.paid += paid
  map.set(key, cur)
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Телефоны',
  tablet: 'Планшеты',
  desktop: 'Компьютеры',
}

async function context(payload: Payload, period: PeriodKey, landing: string | null): Promise<Ctx> {
  const settings = await loadSettings(payload)
  return {
    payload,
    period,
    from: periodStart(period),
    landing,
    excluded: settings.excluded,
    hasLeads: hasCollection(payload, 'leads'),
    hasLandings: hasCollection(payload, 'landings'),
    countSchoolParticipants: settings.countSchoolParticipants,
    planSteps: settings.steps,
  }
}

export async function buildReport(
  payload: Payload,
  opts: { period: PeriodKey; landing: string | null },
): Promise<Report> {
  const c = await context(payload, opts.period, opts.landing)

  const [landings, totals, s, aud, camp, sections, lt, la, lb, fn] = await Promise.all([
    landingOptions(c),
    eventTotals(c),
    withLeads(c, series),
    audience(c),
    campaignVisitors(c),
    sectionReach(c),
    withLeads(c, leadTotals),
    withLeads(c, leadAttribution),
    withLeads(c, leadsBreakdown),
    withLeads(c, funnel),
  ])

  // посетители по разрезам
  const visitorsBy = (g: 'channel' | 'device' | 'browser' | 'os') => {
    const m = new Map<string, number>()
    for (const r of aud) {
      const isSet =
        (g === 'channel' && r.g === 0b0111) ||
        (g === 'device' && r.g === 0b1011) ||
        (g === 'browser' && r.g === 0b1101) ||
        (g === 'os' && r.g === 0b1110)
      if (isSet) m.set(r[g] || 'unknown', num(r.visitors))
    }
    return m
  }
  const leadsBy = (pick: (r: LeadAttributionRow) => string | null) => {
    const m = new Map<string, { leads: number; paid: number }>()
    for (const r of la.data) addTo(m, pick(r) || 'unknown', num(r.leads), num(r.paid))
    return m
  }

  const campLeads = new Map<string, { leads: number; paid: number }>()
  for (const r of la.data) {
    if (r.us || r.uc)
      addTo(
        campLeads,
        JSON.stringify([r.us || '', r.um || '', r.uc || '']),
        num(r.leads),
        num(r.paid),
      )
  }
  const campVisitors = new Map(
    camp.map((r) => [JSON.stringify([r.us || '', r.um || '', r.uc || '']), num(r.visitors)]),
  )

  const known = new Set<string>(LANDING_SECTIONS.map((x) => x.id))
  const sectionRows = [
    ...LANDING_SECTIONS.map((x) => ({ key: x.id as string, label: x.label as string })),
    ...sections
      .filter((r) => !known.has(r.section))
      .map((r) => ({ key: r.section, label: r.section })),
  ].map((x) => {
    const sessions = num(sections.find((r) => r.section === x.key)?.sessions)
    return { ...x, sessions, share: totals.visits ? sessions / totals.visits : 0 }
  })

  return {
    period: c.period,
    landing: c.landing,
    landings,
    hasLeads: c.hasLeads,
    leadsError: [s, lt, la, lb, fn].some((r) => r.failed),
    totals: {
      ...totals,
      leads: lt.data.leads,
      registrations: lt.data.registrations,
      schoolLeads: lt.data.schoolLeads,
      paidInPeriod: lt.data.paidInPeriod,
      paidOfLeads: lt.data.paidOfLeads,
    },
    plan: { steps: c.planSteps, paid: lt.data.planPaid },
    series: s.data.series,
    bucket: s.data.bucket,
    sources: mergeRows(
      visitorsBy('channel'),
      leadsBy((r) => r.channel),
      (k) => CHANNEL_LABELS[k] || k,
    ),
    campaigns: mergeRows(campVisitors, campLeads, (k) => k)
      .map((r) => {
        const [source, medium, campaign] = JSON.parse(r.key) as string[]
        return { ...r, source, medium, campaign, label: campaign || '(без кампании)' }
      })
      .slice(0, 50),
    devices: mergeRows(
      visitorsBy('device'),
      leadsBy((r) => r.device),
      (k) => DEVICE_LABELS[k] || 'Не определено',
    ),
    browsers: mergeRows(
      visitorsBy('browser'),
      leadsBy((r) => r.browser),
      (k) => (k === 'unknown' ? 'Не определено' : k),
    ).map((r) => ({ ...r, inApp: IN_APP_BROWSERS.includes(r.key) })),
    systems: mergeRows(visitorsBy('os'), new Map(), (k) => (k === 'unknown' ? 'Не определено' : k)),
    sections: sectionRows,
    funnel: fn.data,
    leadsBy: lb.data,
  }
}

export type Summary = {
  today: { visitors: number; leads: number }
  week: { visitors: number; visits: number; leads: number; paid: number }
  plan: { steps: number[]; paid: number }
  hasLeads: boolean
}

// Сводка для главной админки — несколько лёгких запросов.
export async function buildSummary(payload: Payload): Promise<Summary> {
  const today = await context(payload, 'today', null)
  const week: Ctx = { ...today, period: '7d', from: periodStart('7d') }
  const [t, w, tl, wl] = await Promise.all([
    eventTotals(today),
    eventTotals(week),
    withLeads(today, leadTotals),
    withLeads(week, leadTotals),
  ])
  return {
    today: { visitors: t.visitors, leads: tl.data.leads },
    week: {
      visitors: w.visitors,
      visits: w.visits,
      leads: wl.data.leads,
      paid: wl.data.paidInPeriod,
    },
    plan: { steps: today.planSteps, paid: wl.data.planPaid },
    hasLeads: today.hasLeads && !wl.failed,
  }
}

/**
 * Демо-данные аналитики за последние N дней — ТОЛЬКО для разработки.
 *
 *   DATABASE_URL=postgres://…/qmmq_analytics pnpm payload run src/analytics/dev/seed-events.ts [reset] [days=30] [visitors=2500]
 *
 * reset — сначала удалить прошлые демо-данные (посетители с ID на «seed», их заявки).
 * Если коллекция leads подключена, создаются и заявки (часть — оплаченные).
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { REGIONS, SUBJECTS } from '../../lib/constants'
import { EVENTS_TABLE, LANDING_SECTIONS } from '../shared'
import { classifyChannel } from '../server/channels'
import { drizzleOf, hasCollection } from '../server/db'
import { parseUserAgent } from '../server/userAgent'

if (process.env.NODE_ENV === 'production') {
  console.error('seed-events: не запускать в production')
  process.exit(1)
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? 'true']
  }),
)
const DAYS = Number(args.days) || 30
const VISITORS = Number(args.visitors) || 2500
const LANDING = args.landing || 'contest-2026'

// Детерминированный генератор — одинаковые данные при повторном запуске.
let seed = 20261029
const rnd = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const chance = (p: number) => rnd() < p
function pick<T>(items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of items) if ((r -= w) <= 0) return v
  return items[items.length - 1][0]
}
const id = (prefix = 'seed') =>
  prefix +
  Math.floor(rnd() * 36 ** 8)
    .toString(36)
    .padStart(8, '0') +
  Math.floor(rnd() * 36 ** 4).toString(36)

const UA = {
  igIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.3.12.91 (iPhone14,5; iOS 17_5; ru_RU; ru; scale=3.00; 1170x2532; 618543262)',
  igAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.71 Mobile Safari/537.36 Instagram 340.0.0.22.109 Android (33/13; 450dpi; 1080x2177; samsung; SM-A536B; a53x; s5e8825; ru_RU; 620230000)',
  fbAndroid:
    'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/466.0.0.47.109;]',
  fbIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/465.0.0.38.101;FBBV/600000000;FBDV/iPhone13,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBLC/ru_RU]',
  ttAndroid:
    'Mozilla/5.0 (Linux; Android 11; M2010J19SG Build/RKQ1.201004.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/103.0.5060.129 Mobile Safari/537.36 trill_2023404050 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/34.4.5 ByteLocale/ru Region/KZ BytedanceWebview/d8a21c6',
  waAndroid:
    'Mozilla/5.0 (Linux; Android 13; SM-A515F Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.165 Mobile Safari/537.36 WhatsApp/2.24.12.78',
  tgAndroid:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Telegram-Android/10.5.0 (Samsung SM-A505F; Android 11; SDK 30; AVERAGE)',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  samsungAndroid:
    'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-A346E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  chromeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  edgeWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  yandexWin:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 YaBrowser/24.6.0.0 Safari/537.36',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
}
type UaKey = keyof typeof UA

type Source = {
  weight: number
  utm?: { source: string; medium: string; campaign: string; content?: string[] }
  referrer?: string
  ua: (readonly [UaKey, number])[]
  // насколько аудитория источника склонна регистрироваться (1 — средне)
  intent: number
  // с какого дня от начала периода источник работает (реклама стартовала позже)
  startShare?: number
}

const MOBILE_WEB: (readonly [UaKey, number])[] = [
  ['chromeAndroid', 5],
  ['samsungAndroid', 2],
  ['safariIos', 4],
]
const DESKTOP: (readonly [UaKey, number])[] = [
  ['chromeWin', 5],
  ['edgeWin', 1],
  ['yandexWin', 1],
  ['safariMac', 1],
]

const SOURCES: Source[] = [
  // реклама в Instagram (Meta Ads)
  ...['oct_launch', 'teachers_lookalike', 'retarget_pricing'].map((campaign, i) => ({
    weight: [16, 9, 4][i],
    utm: {
      source: 'instagram',
      medium: 'paid',
      campaign,
      content: ['video_jury', 'carousel_prizes', 'static_price'],
    },
    ua: [
      ['igIos', 5],
      ['igAndroid', 6],
    ] as (readonly [UaKey, number])[],
    intent: [0.8, 0.9, 1.8][i],
    startShare: [0.35, 0.45, 0.6][i],
  })),
  // Instagram без меток: био, сторис, директ
  {
    weight: 15,
    referrer: 'https://l.instagram.com/',
    ua: [
      ['igIos', 5],
      ['igAndroid', 6],
    ],
    intent: 1.1,
  },
  // рассылка по чатам учителей
  {
    weight: 10,
    utm: { source: 'whatsapp', medium: 'message', campaign: 'school_chats' },
    ua: [...MOBILE_WEB, ['waAndroid', 3]],
    intent: 1.5,
  },
  {
    weight: 6,
    referrer: 'android-app://com.whatsapp/',
    ua: [
      ['chromeAndroid', 5],
      ['samsungAndroid', 2],
    ],
    intent: 1.3,
  },
  { weight: 11, ua: [...MOBILE_WEB, ...DESKTOP, ['waAndroid', 2]], intent: 1.2 },
  {
    weight: 6,
    utm: {
      source: 'fb',
      medium: 'paid',
      campaign: 'oct_launch',
      content: ['video_jury', 'static_price'],
    },
    ua: [
      ['fbAndroid', 3],
      ['fbIos', 2],
    ],
    intent: 0.7,
    startShare: 0.35,
  },
  {
    weight: 6,
    utm: { source: 'tiktok', medium: 'paid', campaign: 'tt_teachers' },
    ua: [['ttAndroid', 1]],
    intent: 0.45,
    startShare: 0.55,
  },
  { weight: 5, referrer: 'https://www.google.com/', ua: [...MOBILE_WEB, ...DESKTOP], intent: 1.6 },
  {
    weight: 2,
    referrer: 'https://t.me/',
    ua: [
      ['tgAndroid', 3],
      ['safariIos', 1],
    ],
    intent: 1.2,
  },
  { weight: 1.5, referrer: 'https://yandex.kz/', ua: DESKTOP, intent: 1.3 },
  { weight: 1, referrer: 'https://www.nis.edu.kz/ru/news/', ua: DESKTOP, intent: 1.4 },
]

const HOURS = [
  1, 0.5, 0.3, 0.2, 0.2, 0.3, 0.8, 1.5, 2.2, 2.6, 2.8, 2.7, 2.9, 3, 2.8, 2.7, 2.8, 3.2, 3.8, 4.4,
  4.8, 4.5, 3.4, 2,
]
const HOW_HEARD = [
  'Instagram',
  'WhatsApp',
  'От коллег',
  'Методическое объединение',
  'Facebook',
  'Другое',
]
const CTA = [
  ['sticky', 40],
  ['hero', 25],
  ['pricing', 15],
  ['header', 10],
  ['stories', 5],
  ['final', 5],
] as const

type Row = Record<string, unknown>
type LeadPlan = {
  visitorId: string
  sessionId: string
  at: Date
  type: 'registration' | 'school' | 'regulations'
  locale: 'ru' | 'kk'
  source: Source
  device: string
}

function dayWeight(dayIndex: number) {
  // рост к дедлайну + будни активнее
  const ramp = 0.45 + (dayIndex / DAYS) * 1.1
  const date = new Date(Date.now() - (DAYS - 1 - dayIndex) * 86400000)
  const dow = date.getDay()
  const weekly = dow === 0 ? 0.7 : dow === 6 ? 0.8 : 1
  return ramp * weekly * (0.85 + rnd() * 0.3)
}

function timeOn(dayIndex: number): Date {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (DAYS - 1 - dayIndex))
  const hour = pick(HOURS.map((w, h) => [h, w] as const))
  const t = new Date(start.getTime() + hour * 3600000 + Math.floor(rnd() * 3600000))
  return t.getTime() > Date.now() ? new Date(Date.now() - Math.floor(rnd() * 3600000)) : t
}

function generate() {
  const rows: Row[] = []
  const leads: LeadPlan[] = []
  const dayWeights = Array.from({ length: DAYS }, (_, i) => dayWeight(i))

  for (let v = 0; v < VISITORS; v++) {
    const source = pick(SOURCES.map((s) => [s, s.weight] as const))
    const minDay = Math.floor((source.startShare || 0) * DAYS)
    const day = pick(dayWeights.map((w, i) => [i, i >= minDay ? w : 0] as const))
    const uaKey = pick(source.ua)
    const userAgent = UA[uaKey]
    const ua = parseUserAgent(userAgent)
    const visitorId = id()
    const locale = chance(0.27) ? 'kk' : 'ru'
    const utm = source.utm
    const first = {
      utmSource: utm?.source ?? null,
      utmMedium: utm?.medium ?? null,
      utmCampaign: utm?.campaign ?? null,
      utmContent: utm?.content ? pick(utm.content.map((c) => [c, 1] as const)) : null,
      utmTerm: null,
      referrer: source.referrer ?? null,
      landingPath: locale === 'kk' ? '/kz' : '/',
    }
    const channel = classifyChannel({
      utmSource: first.utmSource,
      referrer: first.referrer,
      userAgent,
    })
    const base = {
      visitorId,
      landing: LANDING,
      locale,
      ...first,
      channel,
      device: ua.device,
      browser: ua.browser,
      os: ua.os,
    }

    const sessions = pick([
      [1, 70],
      [2, 22],
      [3, 8],
    ] as const)
    let registered = false
    for (let s = 0; s < sessions; s++) {
      const sDay = Math.min(DAYS - 1, day + (s === 0 ? 0 : Math.floor(rnd() * 6)))
      let at = timeOn(sDay)
      const sessionId = id('s')
      const push = (event: string, props: Row | null = null) => {
        at = new Date(Math.min(Date.now(), at.getTime() + 2000 + Math.floor(rnd() * 25000)))
        rows.push({
          ...base,
          event,
          sessionId,
          props,
          path: locale === 'kk' ? '/kz' : '/',
          createdAt: at,
          updatedAt: at,
        })
      }

      push('page_view')
      // глубина просмотра: на компьютере и в повторный визит смотрят дальше
      const engagement =
        (ua.device === 'desktop' ? 1.25 : 1) * (s > 0 ? 1.3 : 1) * (0.6 + rnd() * 0.8)
      let reached = 0
      for (let i = 0; i < LANDING_SECTIONS.length; i++) {
        const p = i === 0 ? 0.97 : Math.min(0.97, 0.8 + 0.12 * (engagement - 1))
        if (!chance(p)) break
        reached = i
        push('section_view', { section: LANDING_SECTIONS[i].id })
      }
      const sawPricing = reached >= 4
      if (chance(0.015)) push('lang_switch', { to: locale === 'ru' ? 'kk' : 'ru' })

      const intent = source.intent * (s > 0 ? 1.6 : 1) * (ua.device === 'desktop' ? 1.2 : 1)
      const clicked = chance(Math.min(0.6, 0.1 * intent * (sawPricing ? 1.6 : 0.8)))
      if (clicked) push('cta_click', { location: pick(CTA) })
      const started =
        !registered && chance(Math.min(0.8, (clicked ? 0.42 : sawPricing ? 0.05 : 0.01) * intent))
      if (started) {
        push('form_start', { form: 'registration' })
        if (chance(0.25))
          push('form_error', {
            form: 'registration',
            field: pick([
              ['phone', 3],
              ['email', 2],
              ['region', 1],
            ] as const),
          })
        if (chance(0.5)) {
          registered = true
          push('form_submit', { form: 'registration' })
          leads.push({
            visitorId,
            sessionId,
            at,
            type: 'registration',
            locale,
            source,
            device: ua.device,
          })
        }
      }
      if (chance(0.012 * intent)) {
        push('form_open', { form: 'school' })
        if (chance(0.45)) {
          push('form_start', { form: 'school' })
          if (chance(0.6)) {
            push('form_submit', { form: 'school' })
            leads.push({
              visitorId,
              sessionId,
              at,
              type: 'school',
              locale,
              source,
              device: ua.device,
            })
          }
        }
      }
      if (chance(0.03)) {
        push('form_open', { form: 'regulations' })
        if (chance(0.6)) {
          push('form_submit', { form: 'regulations' })
          push('regulations_download')
          leads.push({
            visitorId,
            sessionId,
            at,
            type: 'regulations',
            locale,
            source,
            device: ua.device,
          })
        }
      }
      if (chance(0.025))
        push('whatsapp_click', {
          location: pick([
            ['contacts', 2],
            ['float', 3],
          ] as const),
        })
    }
  }
  return { rows, leads }
}

async function reset(payload: Payload) {
  const db = drizzleOf(payload)
  const { sql } = await import('@payloadcms/db-postgres/drizzle')
  await db.execute(sql`DELETE FROM analytics_events WHERE visitor_id LIKE 'seed%'`)
  if (hasCollection(payload, 'leads')) {
    await payload.delete({
      collection: 'leads' as never,
      where: { 'attribution.visitorId': { like: 'seed' } },
      overrideAccess: true,
    })
  }
}

async function createLeads(payload: Payload, plans: LeadPlan[]) {
  const { sql } = await import('@payloadcms/db-postgres/drizzle')
  let created = 0
  for (const plan of plans) {
    const utm = plan.source.utm
    const ageDays = (Date.now() - plan.at.getTime()) / 86400000
    // оплачивают через несколько дней после звонка менеджера
    const paid =
      plan.type !== 'regulations' && ageDays > 2 && chance(plan.type === 'school' ? 0.35 : 0.5)
    const paidAt = paid
      ? new Date(Math.min(Date.now(), plan.at.getTime() + (1 + rnd() * 4) * 86400000))
      : null
    const subject = pick(SUBJECTS.map((s, i) => [s.value, [6, 2.5, 2][i]] as const))
    const region = pick(
      REGIONS.map(
        (r) => [r.value, ['almaty', 'astana', 'shymkent'].includes(r.value) ? 6 : 1] as const,
      ),
    )
    const n = created + 1
    const data: Record<string, unknown> = {
      type: plan.type,
      locale: plan.locale,
      phone: `+7701${String(1000000 + n).slice(1)}`,
      email: `teacher${n}@example.kz`,
      consent: true,
      consentAt: plan.at.toISOString(),
      attribution: {
        visitorId: plan.visitorId,
        sessionId: plan.sessionId,
        utmSource: utm?.source,
        utmMedium: utm?.medium,
        utmCampaign: utm?.campaign,
        referrer: plan.source.referrer,
        landingPath: plan.locale === 'kk' ? '/kz' : '/',
        device: plan.device,
      },
      payment: { paid, paidAt: paidAt?.toISOString() ?? null },
    }
    if (plan.type === 'school') {
      Object.assign(data, {
        organization: `Школа-лицей №${10 + Math.floor(rnd() * 150)}`,
        contactPerson: 'Демо Контакт',
        participantsCount: 5 + Math.floor(rnd() * 11),
        subjects: [subject],
      })
    } else {
      Object.assign(data, {
        fullName: `Демо Участник ${n}`,
        subject,
        region,
        city: 'Демо',
        school: `Школа №${1 + Math.floor(rnd() * 200)}`,
        experience: pick([
          ['lt5', 3],
          ['5to15', 4],
          ['gt15', 3],
        ] as const),
        howHeard: pick(HOW_HEARD.map((h, i) => [h, [5, 3, 3, 2, 1, 1][i]] as const)),
      })
    }
    try {
      const doc = (await payload.create({
        collection: 'leads' as never,
        data: data as never,
        overrideAccess: true,
        context: { analyticsSeed: true },
      })) as { id: number }
      await drizzleOf(payload).execute(
        sql`UPDATE leads SET created_at = ${plan.at.toISOString()}, updated_at = ${(paidAt || plan.at).toISOString()} WHERE id = ${doc.id}`,
      )
      created++
    } catch (err) {
      console.error('seed-events: заявка не создана —', (err as Error).message)
      break
    }
  }
  return created
}

const payload = await getPayload({ config })
try {
  if (args.reset) await reset(payload)
  const { rows, leads } = generate()
  const table = (payload.db as unknown as { tables: Record<string, never> }).tables[EVENTS_TABLE]
  for (let i = 0; i < rows.length; i += 1000) {
    await drizzleOf(payload)
      .insert(table)
      .values(rows.slice(i, i + 1000) as never)
  }
  console.log(`seed-events: ${rows.length} событий от ${VISITORS} посетителей за ${DAYS} дней`)
  if (hasCollection(payload, 'leads')) {
    const created = await createLeads(payload, leads)
    console.log(`seed-events: ${created} заявок`)
  } else {
    console.log(`seed-events: коллекции leads нет — ${leads.length} заявок пропущено`)
  }
} finally {
  await payload.destroy()
}
process.exit(0)

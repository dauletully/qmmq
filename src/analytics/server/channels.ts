import { sql, type SQL } from '@payloadcms/db-postgres/drizzle'

// Источник визита: сначала utm_source, затем домен referrer, затем встроенный браузер.
// Регулярные выражения пишутся так, чтобы одинаково работали в JS и в PostgreSQL (`~*`).
type ChannelRule = {
  id: string
  label: string
  utm?: string
  ref?: string
  ua?: RegExp
}

const CHANNEL_RULES: ChannelRule[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    utm: '^(ig|insta|instagram)([^a-z]|$)',
    ref: '(^|\\.)instagram\\.com$|^com\\.instagram\\.',
    ua: /Instagram/,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    utm: '^(wa|whatsapp)([^a-z]|$)',
    ref: '(^|\\.)(whatsapp\\.(com|net)|wa\\.me)$|^com\\.whatsapp',
    ua: /WhatsApp/,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    utm: '^(fb|facebook|meta|messenger|msg|an)([^a-z]|$)',
    ref: '(^|\\.)(facebook\\.com|fb\\.com|fb\\.me|messenger\\.com)$|^com\\.facebook\\.',
    ua: /FBAN|FBAV|FB_IAB|FBIOS/,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    utm: '^(tt|tiktok)([^a-z]|$)',
    ref: '(^|\\.)tiktok\\.com$|^com\\.(zhiliaoapp\\.musically|ss\\.android\\.ugc)',
    ua: /musical_ly|BytedanceWebview|TikTok/,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    utm: '^(tg|telegram)([^a-z]|$)',
    ref: '(^|\\.)(t\\.me|telegram\\.(org|me))$|^org\\.telegram\\.',
    ua: /Telegram/,
  },
  {
    id: 'email',
    label: 'E-mail',
    utm: '^(email|e-mail|mail|newsletter|sendpulse|unisender)([^a-z]|$)',
    ref: '^(mail\\.google\\.com|e\\.mail\\.ru|mail\\.yandex\\.[a-z]+|com\\.google\\.android\\.gm)$',
  },
  {
    id: 'google',
    label: 'Google',
    utm: '^google',
    ref: '(^|\\.)google\\.[a-z.]+$|^com\\.google\\.android\\.googlequicksearchbox$',
  },
  {
    id: 'yandex',
    label: 'Яндекс',
    utm: '^(yandex|ya)([^a-z]|$)',
    ref: '(^|\\.)(yandex\\.[a-z.]+|ya\\.ru)$|^ru\\.yandex\\.',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    utm: '^(yt|youtube)([^a-z]|$)',
    ref: '(^|\\.)(youtube\\.com|youtu\\.be)$',
  },
  { id: 'site', label: 'Сайт qmmq.kz', utm: '^qmmq', ref: '(^|\\.)qmmq\\.kz$' },
]

const FALLBACK = {
  utm: { id: 'other', label: 'Другие метки' },
  referral: { id: 'referral', label: 'Другие сайты' },
  direct: { id: 'direct', label: 'Прямые и без источника' },
}

export const CHANNEL_LABELS: Record<string, string> = Object.fromEntries([
  ...CHANNEL_RULES.map((r) => [r.id, r.label]),
  ...Object.values(FALLBACK).map((r) => [r.id, r.label]),
])

export const channelLabel = (id: string | null | undefined): string =>
  (id && CHANNEL_LABELS[id]) || id || '—'

export function referrerHost(referrer: string | null | undefined): string {
  if (!referrer) return ''
  try {
    return new URL(referrer).host.toLowerCase()
  } catch {
    return ''
  }
}

export function classifyChannel(args: {
  utmSource?: string | null
  referrer?: string | null
  userAgent?: string
}): string {
  const utm = (args.utmSource || '').trim().toLowerCase()
  if (utm) {
    const rule = CHANNEL_RULES.find((r) => r.utm && new RegExp(r.utm, 'i').test(utm))
    return rule ? rule.id : FALLBACK.utm.id
  }
  const host = referrerHost(args.referrer)
  if (host) {
    const rule = CHANNEL_RULES.find((r) => r.ref && new RegExp(r.ref, 'i').test(host))
    return rule ? rule.id : FALLBACK.referral.id
  }
  const ua = args.userAgent || ''
  const inApp = CHANNEL_RULES.find((r) => r.ua && r.ua.test(ua))
  return inApp ? inApp.id : FALLBACK.direct.id
}

// Та же классификация в SQL — для заявок, у которых нет событий трекера (браузер не передал visitorId).
export function channelCaseSQL(utmColumn: SQL, referrerColumn: SQL): SQL {
  const utm = sql`lower(trim(coalesce(${utmColumn}, '')))`
  const host = sql`lower(coalesce(substring(${referrerColumn} from '^[a-zA-Z][a-zA-Z0-9+.-]*://([^/:?#]+)'), ''))`
  const parts: SQL[] = [sql`CASE`]
  for (const r of CHANNEL_RULES) {
    if (r.utm) parts.push(sql`WHEN ${utm} ~* ${r.utm} THEN ${r.id}`)
  }
  parts.push(sql`WHEN ${utm} <> '' THEN ${FALLBACK.utm.id}`)
  for (const r of CHANNEL_RULES) {
    if (r.ref) parts.push(sql`WHEN ${host} ~* ${r.ref} THEN ${r.id}`)
  }
  parts.push(sql`WHEN ${host} <> '' THEN ${FALLBACK.referral.id}`)
  parts.push(sql`ELSE ${FALLBACK.direct.id} END`)
  return sql.join(parts, sql` `)
}

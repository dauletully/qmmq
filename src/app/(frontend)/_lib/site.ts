import type { Locale } from '@/lib/constants'

// Служебный slug: «активный лендинг из site-settings». Не проходит validateSlug, поэтому
// не пересекается с адресами лендингов. Прокси переписывает на него запросы к LANDING_HOST.
export const ACTIVE_SLUG = '_active'

function siteUrl(): URL {
  try {
    return new URL(process.env.SITE_URL || 'http://localhost:3000')
  } catch {
    return new URL('http://localhost:3000')
  }
}

export function siteOrigin(): string {
  return siteUrl().origin
}

// Адрес хоста лендинга с протоколом и портом SITE_URL (локально — http://contest.localhost:3000).
export function landingOrigin(): string {
  const host = process.env.LANDING_HOST?.trim()
  if (!host) return siteOrigin()
  const u = siteUrl()
  const port = u.port && !host.includes(':') ? `:${u.port}` : ''
  return `${u.protocol}//${host}${port}`
}

// База путей страницы: на хосте лендинга — корень, при доступе по пути — /<slug>.
export function basePath(routeSlug: string): string {
  return routeSlug === ACTIVE_SLUG ? '' : `/${routeSlug}`
}

export function localePrefix(locale: Locale): string {
  return locale === 'kk' ? '/kz' : ''
}

// Путь страницы внутри сайта: '/', '/kz', '/contest-2026', '/contest-2026/kz/spasibo'.
export function pagePath(base: string, locale: Locale, rest = ''): string {
  return `${base}${localePrefix(locale)}${rest}` || '/'
}

// Абсолютный канонический адрес: активный лендинг — на LANDING_HOST, остальные — на SITE_URL.
export function canonicalUrl(
  view: { isActive: boolean; slug: string },
  locale: Locale,
  rest = '',
): string {
  if (view.isActive) return `${landingOrigin()}${pagePath('', locale, rest)}`
  return `${siteOrigin()}${pagePath(`/${view.slug}`, locale, rest)}`
}

export function absolute(url: string | null | undefined, origin: string): string | null {
  if (!url) return null
  if (/^https?:\/\//.test(url)) return url
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
}

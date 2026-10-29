import type { Metadata } from 'next'

import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/lib/constants'

import type { LandingView } from './data'
import { ACTIVE_SLUG, absolute, canonicalUrl, landingOrigin, siteOrigin } from './site'

function originOf(view: LandingView): string {
  return view.isActive ? landingOrigin() : siteOrigin()
}

// Обложка для соцсетей: из админки (размер og 1200×630) или сгенерированная /og.
export function ogImageUrl(view: LandingView, locale: Locale): string {
  const origin = originOf(view)
  if (view.seo.ogImage) return absolute(view.seo.ogImage.src, origin)!
  const path = view.isActive ? '/og' : `/${view.slug}/og`
  return `${origin}${path}${locale === 'kk' ? '?lang=kk' : ''}`
}

export function landingMetadata(
  view: LandingView | null,
  locale: Locale,
  routeSlug: string,
  opts: { rest?: string; title?: string; noindex?: boolean } = {},
): Metadata {
  const t = getDict(locale)
  if (!view) return { title: t.notFound.title, robots: { index: false } }
  const baseTitle = view.seo.title || view.event.title || view.hero.heading
  const title = opts.title ? `${opts.title} — ${baseTitle}` : baseTitle
  const description = view.seo.description || view.hero.heading
  const rest = opts.rest ?? ''
  const canonical = canonicalUrl(view, locale, rest)
  const image = ogImageUrl(view, locale)
  const other: Locale = locale === 'kk' ? 'ru' : 'kk'
  // Доступ по пути (/contest-2026) к активному лендингу — дубль страницы на LANDING_HOST.
  const duplicate = routeSlug !== ACTIVE_SLUG && view.isActive && Boolean(process.env.LANDING_HOST)
  return {
    title,
    description,
    metadataBase: new URL(originOf(view)),
    alternates: {
      canonical,
      languages: {
        'ru-KZ': canonicalUrl(view, 'ru', rest),
        'kk-KZ': canonicalUrl(view, 'kk', rest),
        'x-default': canonicalUrl(view, 'ru', rest),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: view.association.name || undefined,
      locale: t.ogLocale,
      alternateLocale: [getDict(other).ogLocale],
      images: [{ url: image, width: 1200, height: 630, alt: baseTitle }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    robots:
      opts.noindex || duplicate ? { index: false, follow: true } : { index: true, follow: true },
  }
}

export function eventJsonLd(view: LandingView, locale: Locale, closed: boolean): string {
  const canonical = canonicalUrl(view, locale)
  const ev = view.event
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title || view.hero.heading,
    description: view.seo.description || undefined,
    startDate: ev.startDate,
    endDate: ev.endDate || undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: locale === 'kk' ? 'kk' : 'ru',
    url: canonical,
    image: [ogImageUrl(view, locale)],
    location: {
      '@type': 'Place',
      name: ev.venue || ev.city || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: ev.city || undefined,
        streetAddress: ev.venueAddress || undefined,
        addressCountry: 'KZ',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: view.association.name || undefined,
      url: originOf(view),
    },
    offers: {
      '@type': 'Offer',
      price: ev.price,
      priceCurrency: 'KZT',
      availability: closed ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      validThrough: ev.deadline || undefined,
      url: canonical,
    },
  }
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

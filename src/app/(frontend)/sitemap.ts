import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import type { SiteLocale } from '@/lib/constants'

import { getActiveSlug } from './_lib/data'
import { landingOrigin, siteOrigin } from './_lib/site'
import { getSitemapEntries, sitePath } from './_lib/site-data'

// Собирается при запросе (адреса берутся из переменных окружения на сервере, не при сборке).
// На хосте лендинга (LANDING_HOST) — только страницы лендинга; на основном домене — страницы сайта
// (и лендинг по пути /<slug>, если LANDING_HOST не задан).
export const dynamic = 'force-dynamic'

const HREFLANG: Record<SiteLocale, string> = { ru: 'ru-KZ', kk: 'kk-KZ', en: 'en' }

async function landingEntries(onLandingHost: boolean): Promise<MetadataRoute.Sitemap> {
  let ru: string
  let kz: string
  if (onLandingHost) {
    ru = `${landingOrigin()}/`
    kz = `${landingOrigin()}/kz`
  } else {
    const slug = await getActiveSlug().catch(() => null)
    if (!slug) return []
    ru = `${siteOrigin()}/${slug}`
    kz = `${siteOrigin()}/${slug}/kz`
  }
  const languages = { 'ru-KZ': ru, 'kk-KZ': kz }
  return [
    { url: ru, changeFrequency: 'weekly', priority: 1, alternates: { languages } },
    { url: kz, changeFrequency: 'weekly', priority: 0.9, alternates: { languages } },
  ]
}

async function siteEntries(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin()
  const entries = await getSitemapEntries().catch(() => [])
  return entries.flatMap((e) => {
    const languages = Object.fromEntries(
      e.locales.map((l) => [HREFLANG[l], `${origin}${sitePath(l, e.path)}`]),
    )
    return e.locales.map((l) => ({
      url: `${origin}${sitePath(l, e.path)}`,
      lastModified: e.lastModified ? new Date(e.lastModified) : undefined,
      changeFrequency: e.changeFrequency,
      priority: l === 'ru' ? e.priority : Math.round(e.priority * 0.9 * 100) / 100,
      alternates: { languages },
    }))
  })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host')?.split(':')[0]
  const landingHost = process.env.LANDING_HOST?.split(':')[0]
  if (landingHost && host === landingHost) return landingEntries(true)
  const site = await siteEntries()
  // Без LANDING_HOST лендинг живёт по пути на основном домене — добавляем его в карту сайта.
  const landing = landingHost ? [] : await landingEntries(false)
  return [...site, ...landing]
}

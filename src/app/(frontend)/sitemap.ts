import type { MetadataRoute } from 'next'

import { getActiveSlug } from './_lib/data'
import { landingOrigin, siteOrigin } from './_lib/site'

// Собирается при запросе (адреса берутся из переменных окружения на сервере, не при сборке).
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let ru: string
  let kz: string
  if (process.env.LANDING_HOST) {
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

import type { NextRequest } from 'next/server'

import type { Locale } from '@/lib/constants'

import { siteOrigin } from '../../_lib/site'
import { getNewsFeed, getSiteSettings, sitePath } from '../../_lib/site-data'

// RSS новостей сайта: /news/rss.xml (русский), /news/rss.xml?lang=kk (казахский).
// Данные кешируются хелперами (тег site-news), сам ответ — на 10 минут.

export const dynamic = 'force-dynamic'

const esc = (v: string) =>
  v.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)

const TITLES: Record<Locale, string> = {
  ru: 'Новости — Казахстанская ассоциация учителей математики',
  kk: 'Жаңалықтар — Қазақстан математика мұғалімдері қауымдастығы',
}

function imageType(src: string): string {
  const ext = src.split('?')[0]!.split('.').pop()?.toLowerCase()
  if (ext === 'webp') return 'image/webp'
  if (ext === 'png') return 'image/png'
  if (ext === 'svg') return 'image/svg+xml'
  return 'image/jpeg'
}

export async function GET(req: NextRequest) {
  const locale: Locale = req.nextUrl.searchParams.get('lang') === 'kk' ? 'kk' : 'ru'
  const origin = siteOrigin()
  const [items, settings] = await Promise.all([getNewsFeed(locale, 30), getSiteSettings(locale)])
  const channelLink = `${origin}${sitePath(locale, '/news')}`
  const selfLink = `${origin}/news/rss.xml${locale === 'kk' ? '?lang=kk' : ''}`
  const lastBuild = items[0]?.publishedAt ? new Date(items[0].publishedAt) : new Date()

  const entries = items
    .map((n) => {
      const link = `${origin}${sitePath(locale, `/news/${n.slug}`)}`
      const cover = n.cover
        ? `<enclosure url="${esc(/^https?:/.test(n.cover.src) ? n.cover.src : origin + n.cover.src)}" type="${imageType(n.cover.src)}" length="0"/>`
        : ''
      const categories = n.tags.map((t) => `<category>${esc(t)}</category>`).join('')
      return (
        `<item><title>${esc(n.title)}</title><link>${esc(link)}</link>` +
        `<guid isPermaLink="true">${esc(link)}</guid>` +
        `<pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate>` +
        (n.excerpt ? `<description>${esc(n.excerpt)}</description>` : '') +
        categories +
        cover +
        `</item>`
      )
    })
    .join('')

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>` +
    `<title>${esc(settings.association.name ? `${TITLES[locale].split(' — ')[0]} — ${settings.association.name}` : TITLES[locale])}</title>` +
    `<link>${esc(channelLink)}</link>` +
    `<description>${esc(TITLES[locale])}</description>` +
    `<language>${locale === 'kk' ? 'kk-KZ' : 'ru-KZ'}</language>` +
    `<atom:link href="${esc(selfLink)}" rel="self" type="application/rss+xml"/>` +
    `<lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>` +
    entries +
    `</channel></rss>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  })
}

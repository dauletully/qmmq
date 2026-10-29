import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

import { formatMonthYear } from '@/i18n/format'

import { getLandingView } from '../../../_lib/data'

// Обложка для соцсетей 1200×630, когда в админке не загружена своя (seo.ogImage).
// Шрифт — TTF из public/fonts (satori не читает woff2).

let fonts: Promise<Array<{ name: string; data: Buffer; weight: 500 | 700 }>> | null = null
function loadFonts() {
  fonts ??= Promise.all(
    (
      [
        ['GolosText-Medium.ttf', 500],
        ['GolosText-Bold.ttf', 700],
      ] as const
    ).map(async ([file, weight]) => ({
      name: 'Golos Text',
      data: await readFile(path.join(process.cwd(), 'public', 'fonts', file)),
      weight,
    })),
  )
  return fonts
}

const BRAND = '#0b2a5b'
const ACCENT = '#c9a227'
const MUTED = '#b9c5da'
const LINE = 'rgba(255,255,255,0.18)'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = req.nextUrl.searchParams.get('lang') === 'kk' ? 'kk' : 'ru'
  const view = await getLandingView(slug, locale)
  if (!view) return new Response('Not found', { status: 404 })

  const heading = view.hero.heading
  // Слова отдельными блоками: satori переносит их как обычный текст, римский номер — золотом.
  const words = heading.split(/\s+/).filter(Boolean)
  const date = view.hero.subheading || formatMonthYear(view.event.startDate, locale)
  const meta = [date, view.event.city].filter(Boolean).join(' · ')
  const org = view.hero.eyebrow.split(/\s+·\s+/)[0] || view.association.name

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: BRAND,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        fontFamily: 'Golos Text',
        color: '#fff',
      }}
    >
      <svg
        width="560"
        height="467"
        viewBox="0 0 480 400"
        style={{ position: 'absolute', right: -40, top: 60 }}
      >
        <circle cx="150" cy="250" r="180" fill="none" stroke={LINE} strokeWidth="1.2" />
        <circle cx="330" cy="250" r="180" fill="none" stroke={LINE} strokeWidth="1.2" />
        <path d="M150 250 L330 250 L240 94.12 Z" fill="none" stroke={ACCENT} strokeWidth="2" />
        <circle cx="150" cy="250" r="5" fill={ACCENT} />
        <circle cx="330" cy="250" r="5" fill={ACCENT} />
        <circle cx="240" cy="94.12" r="5" fill={ACCENT} />
      </svg>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          width: 860,
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, fontWeight: 500, color: MUTED }}>{org}</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: heading.length > 90 ? 50 : 58,
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {words.map((w, i) => (
            <span
              key={i}
              style={{ marginRight: 14, color: /^[IVXLC]{1,7}$/.test(w) ? ACCENT : undefined }}
            >
              {w}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: ACCENT }}>
            {meta}
          </div>
          {view.hero.partnerNote && (
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 500, color: MUTED }}>
              {view.hero.partnerNote}
            </div>
          )}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: await loadFonts(),
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' },
    },
  )
}

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import '../tokens.css'
import '../ds.css'
import '../landing.css'

export const shellMetadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
}

export const shellViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b2a5b',
}

// Корневая разметка публичных страниц. Класс js — до отрисовки, для анимаций появления.
export function Shell({
  lang,
  fonts,
  children,
}: {
  lang: 'ru' | 'kk'
  // классы next/font (fonts.ts или fonts-kk.ts)
  fonts: string
  children: ReactNode
}) {
  return (
    <html lang={lang} className={fonts} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

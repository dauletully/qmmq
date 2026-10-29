'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { setupPixels, type PixelIds } from './pixels'
import { initTracker, isTrackingOff, track } from './tracker'

type Props = {
  locale: string // 'ru' | 'kk'
  // slug лендинга — для фильтра «Лендинг» в отчётах
  landing?: string
  pixels?: PixelIds
}

// Защита от двойного page_view (StrictMode в разработке, повторный монтаж).
let lastPage = ''

const WA_LINK = /^(https?:\/\/)?(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\/|^whatsapp:/i

function sectionOf(el: Element): string | undefined {
  return el.closest('[data-section]')?.getAttribute('data-section') || undefined
}

function onClick(e: MouseEvent) {
  const target = e.target instanceof Element ? e.target : null
  if (!target) return
  const cta = target.closest('[data-cta]')
  if (cta) track('cta_click', { location: cta.getAttribute('data-cta') })
  const link = target.closest('a[href]')
  if (link && WA_LINK.test(link.getAttribute('href') || '')) {
    track('whatsapp_click', {
      location: link.getAttribute('data-cta') || sectionOf(link) || 'page',
    })
  }
}

// section_view — один раз за просмотр страницы, когда блок виден на 40 %.
// Блок выше экрана засчитывается, если занимает 40 % высоты окна.
function observeSections() {
  if (!('IntersectionObserver' in window)) return
  const seen = new Set<string>()
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        const id = en.target.getAttribute('data-section')
        const viewport = en.rootBounds?.height || innerHeight
        if (
          id &&
          !seen.has(id) &&
          en.isIntersecting &&
          (en.intersectionRatio >= 0.4 || en.intersectionRect.height >= viewport * 0.4)
        ) {
          seen.add(id)
          io.unobserve(en.target)
          track('section_view', { section: id })
        }
      }
    },
    { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  )
  document.querySelectorAll('[data-section]').forEach((el) => io.observe(el))
  return () => io.disconnect()
}

export function AnalyticsTracker({ locale, landing, pixels }: Props) {
  const pathname = usePathname()
  const metaPixelId = pixels?.metaPixelId
  const tiktokPixelId = pixels?.tiktokPixelId

  useEffect(() => {
    initTracker({ locale, landing })
  }, [locale, landing])

  useEffect(() => {
    if (!isTrackingOff()) setupPixels({ metaPixelId, tiktokPixelId })
  }, [metaPixelId, tiktokPixelId])

  useEffect(() => {
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (lastPage != pathname) track('page_view')
    lastPage = pathname
    return observeSections()
  }, [pathname])

  return null
}

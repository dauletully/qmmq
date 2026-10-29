'use client'

import type { MouseEvent } from 'react'

import { track } from '@/analytics/client'
import type { Locale } from '@/lib/constants'

export const POSITION_KEY = 'qmmq:lang-pos'

type Props = {
  locale: Locale
  hrefs: Record<Locale, string>
  label: string
}

// Блок, который сейчас вверху экрана, и доля его прокрутки — чтобы открыть тот же блок на другом языке.
function currentPosition(): { id: string; ratio: number } | null {
  const header = document.querySelector('.lp-header')?.getBoundingClientRect().height ?? 0
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main [data-section][id]'))
  let found: { id: string; ratio: number } | null = null
  for (const el of sections) {
    const r = el.getBoundingClientRect()
    if (r.top - header <= 1) {
      found = { id: el.id, ratio: Math.min(1, Math.max(0, (header - r.top) / r.height)) }
    }
  }
  return found
}

export function LangSwitch({ locale, hrefs, label }: Props) {
  function onClick(e: MouseEvent<HTMLAnchorElement>, to: Locale) {
    if (to === locale) {
      e.preventDefault()
      return
    }
    track('lang_switch', { to })
    const pos = currentPosition()
    if (!pos || pos.id === 'top' || e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    try {
      sessionStorage.setItem(POSITION_KEY, JSON.stringify(pos))
    } catch {}
    // Другой язык — другая корневая разметка (html lang), нужна полная загрузка страницы.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${hrefs[to].split('#')[0]}#${pos.id}`)
  }

  return (
    <nav className="q-lang" aria-label={label}>
      <a
        href={hrefs.ru}
        hrefLang="ru"
        lang="ru"
        aria-current={locale === 'ru' ? 'true' : undefined}
        onClick={(e) => onClick(e, 'ru')}
      >
        RU
      </a>
      <a
        href={hrefs.kk}
        hrefLang="kk"
        lang="kk"
        aria-current={locale === 'kk' ? 'true' : undefined}
        onClick={(e) => onClick(e, 'kk')}
      >
        KZ
      </a>
    </nav>
  )
}

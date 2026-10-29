'use client'

import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getDict } from '@/i18n/dictionary'
import { countdownInline, countdownParts, unit } from '@/i18n/format'
import type { Locale } from '@/lib/constants'

type Props = {
  deadline: string | null
  // Время серверного рендера: первый клиентский рендер совпадает с HTML, потом — текущее время.
  renderedAt: number
  locale: Locale
  variant: 'inline' | 'cells' | 'text'
}

function closeRegistration() {
  document.querySelectorAll('.lp').forEach((el) => el.setAttribute('data-reg', 'closed'))
}

export function useNow(renderedAt: number, deadlineMs: number | null) {
  const [now, setNow] = useState(renderedAt)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (deadlineMs && t >= deadlineMs) {
        closeRegistration()
        return
      }
      // Раз в минуту, на границе минуты — без секунд.
      timer = setTimeout(tick, 60_000 - (t % 60_000) + 50)
    }
    tick()
    return () => clearTimeout(timer)
  }, [deadlineMs])
  return now
}

export function Countdown({ deadline, renderedAt, locale, variant }: Props) {
  const deadlineMs = deadline ? new Date(deadline).getTime() : null
  const now = useNow(renderedAt, deadlineMs)
  if (!deadlineMs) return null
  const t = getDict(locale)
  const p = countdownParts(deadlineMs, now)
  const text = countdownInline(p, t)

  if (variant === 'text') return <b className="q-num">{text}</b>

  if (variant === 'inline') {
    return (
      <div className="q-countdown q-countdown--inline" role="timer" aria-live="off">
        <Clock className="q-icon q-icon--sm" aria-hidden="true" />
        <span>{t.countdown.until}</span>
        <b>{text}</b>
      </div>
    )
  }

  const cells: Array<[number, readonly string[]]> = [
    [p.days, t.countdown.days],
    [p.hours, t.countdown.hours],
    [p.minutes, t.countdown.minutes],
  ]
  return (
    <div className="q-countdown" role="timer" aria-live="off">
      <span className="q-countdown__label">
        <Clock className="q-icon q-icon--sm" aria-hidden="true" />
        {t.countdown.until}
      </span>
      <div className="q-countdown__cells">
        {cells.map(([n, forms], i) => (
          <div className="q-countdown__cell" key={i}>
            <span className="q-countdown__num">{n}</span>
            <span className="q-countdown__unit">{unit(n, forms)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

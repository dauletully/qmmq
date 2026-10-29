'use client'

import { CalendarClock } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getDict } from '@/i18n/dictionary'
import { deadlineInfo, deadlineLeft, deadlineLine } from '@/i18n/format'
import type { Locale } from '@/lib/constants'

type Props = {
  deadline: string | null
  // Время серверного рендера: первый клиентский рендер совпадает с HTML, потом — текущее время.
  renderedAt: number
  locale: Locale
  // inline — строка в первом и финальном экране; panel — панель с крупной датой; text — закреплённая панель.
  variant: 'inline' | 'panel' | 'text'
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
      // Раз в минуту, на границе минуты: число дней меняется в полночь, закрытие — по минуте дедлайна.
      timer = setTimeout(tick, 60_000 - (t % 60_000) + 50)
    }
    tick()
    return () => clearTimeout(timer)
  }, [deadlineMs])
  return now
}

// Спокойный дедлайн: «Регистрация до 5 декабря · осталось 36 дней» вместо часов и минут.
export function Countdown({ deadline, renderedAt, locale, variant }: Props) {
  const deadlineMs = deadline ? new Date(deadline).getTime() : null
  const now = useNow(renderedAt, deadlineMs)
  if (!deadlineMs) return null
  const t = getDict(locale)
  const info = deadlineInfo(deadlineMs, now, locale)
  const dateText = locale === 'kk' ? `${info.date} дейін` : info.date

  if (variant === 'text') return <b className="q-num">{deadlineLine(info, locale, true)}</b>

  if (variant === 'inline') {
    return (
      <div className="q-countdown q-countdown--inline" role="status" aria-live="off">
        <CalendarClock className="q-icon q-icon--sm" aria-hidden="true" />
        <span>
          {t.countdown.until && `${t.countdown.until} `}
          <b>{dateText}</b>
        </span>
        <span className="q-countdown__left">
          <span className="q-countdown__sep" aria-hidden="true">
            ·{' '}
          </span>
          {deadlineLeft(info, t)}
        </span>
      </div>
    )
  }

  return (
    <div className="q-countdown q-countdown--panel" role="status" aria-live="off">
      <span className="q-countdown__label">
        <CalendarClock className="q-icon q-icon--sm" aria-hidden="true" />
        {t.countdown.until || t.countdown.closedShort.split(' ')[0]}
      </span>
      <p className="q-countdown__date q-num">{dateText}</p>
      <p className="q-countdown__left">{deadlineLeft(info, t)}</p>
    </div>
  )
}

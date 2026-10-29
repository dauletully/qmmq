'use client'

import { MessageCircle } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import type { Locale } from '@/lib/constants'
import { getDict } from '@/i18n/dictionary'

import { Countdown } from './Countdown'

type Props = {
  locale: Locale
  deadline: string | null
  renderedAt: number
  label: ReactNode
  whatsappHref: string | null
}

// Закреплённая панель регистрации и кнопка WhatsApp (телефон, < 1024).
// Панель видна, когда главная кнопка первого экрана ушла из вида; прячется у формы и при открытой клавиатуре.
export function StickyBar({ locale, deadline, renderedAt, label, whatsappHref }: Props) {
  const t = getDict(locale)
  const [heroGone, setHeroGone] = useState(false)
  const [formVisible, setFormVisible] = useState(false)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const hero = document.querySelector('[data-cta="hero"]')
    const form = document.getElementById('register')
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.target === hero) setHeroGone(!en.isIntersecting && en.boundingClientRect.top < 0)
        if (en.target === form) setFormVisible(en.isIntersecting)
      }
    })
    if (hero) io.observe(hero)
    if (form) io.observe(form)

    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      el.matches('input:not([type=checkbox]):not([type=radio]), select, textarea')
    const onIn = (e: FocusEvent) => isField(e.target) && setTyping(true)
    const onOut = (e: FocusEvent) => isField(e.target) && setTyping(false)
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      io.disconnect()
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])

  const visible = heroGone && !formVisible && !typing

  return (
    <>
      <div className={`q-sticky lp-sticky${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
        {deadline && (
          <div className="q-sticky__meta">
            <span className="if-open">{t.countdown.until}</span>
            <span className="if-open">
              <Countdown
                deadline={deadline}
                renderedAt={renderedAt}
                locale={locale}
                variant="text"
              />
            </span>
            <span className="if-closed">{t.countdown.closedShort}</span>
            <b className="if-closed">{t.countdown.closedStatus}</b>
          </div>
        )}
        <a
          className="q-btn q-btn--primary q-btn--block"
          href="#register"
          data-cta="sticky"
          tabIndex={visible ? 0 : -1}
        >
          {label}
        </a>
      </div>
      {whatsappHref && (
        <a
          className={`q-fab lp-fab${visible ? ' is-raised' : ''}`}
          href={whatsappHref}
          target="_blank"
          rel="noopener"
          aria-label={t.whatsappFab}
        >
          <MessageCircle className="q-icon" aria-hidden="true" />
        </a>
      )}
    </>
  )
}

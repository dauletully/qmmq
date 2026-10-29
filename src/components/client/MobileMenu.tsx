'use client'

import { Menu, X } from 'lucide-react'
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react'

type Props = {
  items: Array<{ href: string; label: string }>
  labels: { open: string; close: string; nav: string }
  logo: ReactNode
  lang: ReactNode
  cta: ReactNode
}

// Меню на телефоне: полноэкранный лист на brand (<dialog>: фокус внутри, Esc закрывает).
export function MobileMenu({ items, labels, logo, lang, cta }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    const onClose = () => {
      setOpen(false)
      btnRef.current?.focus()
    }
    dlg.addEventListener('close', onClose)
    // Вышли на десктоп с открытым меню — закрываем.
    const mq = window.matchMedia('(min-width: 1024px)')
    const onMq = () => mq.matches && dlg.open && dlg.close()
    mq.addEventListener('change', onMq)
    return () => {
      dlg.removeEventListener('close', onClose)
      mq.removeEventListener('change', onMq)
    }
  }, [])

  function show() {
    ref.current?.showModal()
    setOpen(true)
  }

  // Переход по якорю: закрыть лист, затем прокрутить (иначе прокрутка заблокирована).
  function onNav(e: MouseEvent<HTMLElement>) {
    const a = (e.target as Element).closest('a')
    if (!a) return
    const href = a.getAttribute('href') || ''
    if (!href.startsWith('#')) return
    e.preventDefault()
    ref.current?.close()
    requestAnimationFrame(() => {
      document.getElementById(href.slice(1))?.scrollIntoView()
      history.replaceState(null, '', href)
    })
  }

  return (
    <>
      <button
        ref={btnRef}
        className="q-iconbtn lp-menu-btn"
        type="button"
        aria-label={labels.open}
        aria-expanded={open}
        aria-controls="lp-menu"
        onClick={show}
      >
        <Menu className="q-icon q-icon--lg" aria-hidden="true" />
      </button>
      <dialog ref={ref} id="lp-menu" className="lp-menu q-dark" aria-label={labels.nav}>
        <div className="lp-menu__inner" onClick={onNav}>
          <div className="lp-menu__top">
            {logo}
            <button
              className="q-iconbtn"
              type="button"
              aria-label={labels.close}
              onClick={() => ref.current?.close()}
            >
              <X className="q-icon q-icon--lg" aria-hidden="true" />
            </button>
          </div>
          <nav className="lp-menu__nav" aria-label={labels.nav}>
            {items.map((it) => (
              <a key={it.href} href={it.href}>
                {it.label}
              </a>
            ))}
          </nav>
          <div className="lp-menu__bottom">
            {lang}
            {cta}
          </div>
        </div>
      </dialog>
    </>
  )
}

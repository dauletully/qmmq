'use client'

import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'

type Props = {
  // Кнопки с data-dialog="<name>" открывают лист.
  name: string
  titleId: string
  closeLabel: string
  className?: string
  head: ReactNode
  onOpen: () => void
  children: ReactNode
}

// Нижний лист на телефоне и модальное окно 560 px на 1024+ (<dialog>: фокус внутри, Esc закрывает,
// фокус возвращается на кнопку, которая открыла).
export function Sheet({ name, titleId, closeLabel, className, head, onOpen, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const onOpenRef = useRef(onOpen)
  useEffect(() => {
    onOpenRef.current = onOpen
  })

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    const onDocClick = (e: MouseEvent) => {
      const el = e.target instanceof Element ? e.target.closest(`[data-dialog="${name}"]`) : null
      if (!el) return
      e.preventDefault()
      trigger.current = el as HTMLElement
      document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close())
      dlg.showModal()
      onOpenRef.current()
      requestAnimationFrame(() => document.getElementById(titleId)?.focus())
    }
    const onClose = () => trigger.current?.focus()
    document.addEventListener('click', onDocClick)
    dlg.addEventListener('close', onClose)
    return () => {
      document.removeEventListener('click', onDocClick)
      dlg.removeEventListener('close', onClose)
    }
  }, [name, titleId])

  return (
    <dialog
      ref={ref}
      className={`lp-sheet${className ? ` ${className}` : ''}`}
      aria-labelledby={titleId}
      onClick={(e) => {
        // клик по затемнению вокруг листа
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <div className="lp-sheet__inner">
        <div className="lp-sheet__grip" aria-hidden="true" />
        <div className="lp-sheet__head">
          {head}
          <button
            className="q-iconbtn lp-sheet__close"
            type="button"
            aria-label={closeLabel}
            onClick={() => ref.current?.close()}
          >
            <X className="q-icon q-icon--lg" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

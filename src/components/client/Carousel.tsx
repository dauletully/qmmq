'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'

type Props = {
  label: string
  count: number
  // Раскладка на 1024+: сетка или лента со стрелками.
  desktop: 'grid' | 'scroll'
  cols: number
  labels: { prev: string; next: string }
  children: ReactNode
}

// Карусель на scroll-snap: на телефоне — лента с точками и счётчиком «1 / 4».
export function Carousel({ label, count, desktop, cols, labels, children }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: count <= cols })

  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const first = el.children[0] as HTMLElement | undefined
      if (!first) return
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0
      const step = first.offsetWidth + gap
      const max = el.scrollWidth - el.clientWidth
      setIndex(Math.min(count - 1, Math.round(el.scrollLeft / step)))
      setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [count])

  function go(dir: 1 | -1) {
    const el = track.current
    const first = el?.children[0] as HTMLElement | undefined
    if (!el || !first) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: 'smooth' })
  }

  const style = { '--cols': cols } as CSSProperties
  return (
    <div
      className={`lp-carousel lp-carousel--${desktop}`}
      style={style}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="lp-carousel__track" ref={track} tabIndex={0}>
        {children}
      </div>
      {count > 1 && (
        <div className="lp-carousel__foot">
          <div className="q-dots" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className={i === index ? 'is-active' : undefined} />
            ))}
          </div>
          <span className="q-small q-num lp-carousel__count" aria-live="polite">
            {index + 1} / {count}
          </span>
          <div className="q-arrows lp-arrows">
            <button
              type="button"
              aria-label={labels.prev}
              disabled={edges.start}
              onClick={() => go(-1)}
            >
              <ChevronLeft className="q-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={labels.next}
              disabled={edges.end}
              onClick={() => go(1)}
            >
              <ChevronRight className="q-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

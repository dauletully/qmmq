'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'

// Монтирует содержимое (картинку), только когда блок подошёл к экрану. Встроенный loading="lazy"
// в Chrome начинает грузить за 1,25–3 тыс. px — фото ниже первого экрана отнимали канал у первого экрана.
export function LazyMount({
  children,
  className,
  style,
  rootMargin = '300px',
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  rootMargin?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      const raf = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(raf)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return (
    <div ref={ref} className={className} style={style}>
      {shown ? children : <noscript>{children}</noscript>}
    </div>
  )
}

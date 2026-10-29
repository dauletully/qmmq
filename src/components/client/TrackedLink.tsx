'use client'

import type { ReactNode } from 'react'

import { track } from '@/analytics/client'
import type { AnalyticsEventName } from '@/analytics/shared'

// Ссылка, которая отправляет событие аналитики при нажатии (например, regulations_download).
export function TrackedLink({
  href,
  event,
  className,
  children,
}: {
  href: string
  event: AnalyticsEventName
  className?: string
  children: ReactNode
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => track(event)}
    >
      {children}
    </a>
  )
}

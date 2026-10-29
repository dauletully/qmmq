'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { useTransition } from 'react'

type Props = {
  period: string
  landing: string | null
  periods: { key: string; label: string }[]
  landings: { slug: string; title: string }[]
  children: React.ReactNode
}

// Фильтры над отчётом. Пока сервер пересчитывает отчёт, старые цифры остаются видны (приглушённо).
export function ReportShell({ period, landing, periods, landings, children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const go = (next: { period?: string; landing?: string | null }) => {
    const params = new URLSearchParams()
    const p = next.period ?? period
    const l = next.landing === undefined ? landing : next.landing
    if (p !== '7d') params.set('period', p)
    if (l) params.set('landing', l)
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="qa" data-pending={pending ? '' : undefined} aria-busy={pending}>
      <div className="qa-filters" role="toolbar" aria-label="Фильтры отчёта">
        <div className="qa-seg" role="group" aria-label="Период">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={p.key === period}
              onClick={() => p.key !== period && go({ period: p.key })}
            >
              {p.label}
            </button>
          ))}
        </div>
        {landings.length > 1 || landing ? (
          <select
            className="qa-select"
            aria-label="Лендинг"
            value={landing || ''}
            onChange={(e) => go({ landing: e.target.value || null })}
          >
            <option value="">Все лендинги</option>
            {landings.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.title}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="qa-body">{children}</div>
    </div>
  )
}

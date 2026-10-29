'use client'

import { useListQuery } from '@payloadcms/ui'
import type { Where } from 'payload'
import React from 'react'

import { LEAD_TYPES } from '../../lib/constants'

// Быстрые фильтры над списком заявок: тип, статус amoCRM, оплата.

const SYNC = [
  { value: 'failed', label: 'Ошибка' },
  { value: 'disabled', label: 'Не отправлялась' },
  { value: 'pending', label: 'В очереди' },
  { value: 'sent', label: 'Отправлена' },
]

type Filters = { type?: string; sync?: string; paid?: boolean }

function readFilters(where: Where | undefined): Filters {
  const result: Filters = {}
  const visit = (w: unknown) => {
    if (!w || typeof w !== 'object') return
    for (const [key, cond] of Object.entries(w as Record<string, unknown>)) {
      if (key === 'and' || key === 'or') {
        const list = Array.isArray(cond) ? cond : Object.values(cond as object)
        list.forEach(visit)
        continue
      }
      const equals = (cond as { equals?: unknown })?.equals
      if (key === 'type' && typeof equals === 'string') result.type = equals
      if (key === 'amo.syncStatus' && typeof equals === 'string') result.sync = equals
      if (key === 'payment.paid' && (equals === true || equals === 'true')) result.paid = true
    }
  }
  visit(where)
  return result
}

function toWhere(f: Filters): Where {
  const and: Where[] = []
  if (f.type) and.push({ type: { equals: f.type } })
  if (f.sync) and.push({ 'amo.syncStatus': { equals: f.sync } })
  if (f.paid) and.push({ 'payment.paid': { equals: true } })
  return and.length ? { and } : {}
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: '4px 12px',
        borderRadius: 999,
        border: '1px solid var(--theme-elevation-200)',
        background: active ? 'var(--theme-elevation-800)' : 'var(--theme-elevation-0)',
        color: active ? 'var(--theme-elevation-0)' : 'var(--theme-text)',
        fontSize: 13,
        lineHeight: '20px',
      }}
    >
      {children}
    </button>
  )
}

export function LeadFilters() {
  const { query, handleWhereChange } = useListQuery()
  const current = readFilters(query?.where)

  const apply = (next: Filters) => {
    void handleWhereChange?.(toWhere(next))
  }

  const row: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  }
  const label: React.CSSProperties = {
    color: 'var(--theme-elevation-500)',
    fontSize: 13,
    minWidth: 70,
  }

  return (
    <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
      <div style={row}>
        <span style={label}>Тип:</span>
        <Chip active={!current.type} onClick={() => apply({ ...current, type: undefined })}>
          Все
        </Chip>
        {LEAD_TYPES.map((t) => (
          <Chip
            key={t.value}
            active={current.type === t.value}
            onClick={() => apply({ ...current, type: t.value })}
          >
            {t.label.ru}
          </Chip>
        ))}
      </div>
      <div style={row}>
        <span style={label}>amoCRM:</span>
        <Chip active={!current.sync} onClick={() => apply({ ...current, sync: undefined })}>
          Все
        </Chip>
        {SYNC.map((s) => (
          <Chip
            key={s.value}
            active={current.sync === s.value}
            onClick={() => apply({ ...current, sync: s.value })}
          >
            {s.label}
          </Chip>
        ))}
        <span style={{ ...label, minWidth: 0, marginLeft: 12 }}>Оплата:</span>
        <Chip
          active={Boolean(current.paid)}
          onClick={() => apply({ ...current, paid: !current.paid })}
        >
          Только оплаченные
        </Chip>
      </div>
    </div>
  )
}

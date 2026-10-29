import React from 'react'

import { fmt, pct, plural, share } from './format'

type Color = 'visitors' | 'leads' | 'paid'
const colorVar = (c: Color) => ({ '--qa-c': `var(--qa-${c})` }) as React.CSSProperties

export function Tile(props: {
  label: string
  value: string
  sub?: React.ReactNode
  color?: Color
}) {
  return (
    <div className="qa-tile">
      <div className="qa-tile__label">
        {props.color ? <span className="qa-key" style={colorVar(props.color)} /> : null}
        {props.label}
      </div>
      <div className="qa-tile__value">{props.value}</div>
      {props.sub ? <div className="qa-tile__sub">{props.sub}</div> : null}
    </div>
  )
}

export function PlanProgress({ steps, paid }: { steps: number[]; paid: number }) {
  const goal = Math.max(...steps, 1)
  const next = steps.find((s) => s > paid)
  return (
    <div>
      <div className="qa-plan__head">
        <div className="qa-plan__value">
          {fmt(paid)}
          <small>
            из {fmt(goal)} {plural(goal, 'оплаты', 'оплат', 'оплат')}
          </small>
        </div>
        <div className="qa-note">
          {next ? `До ступени ${fmt(next)} — ещё ${fmt(next - paid)}` : 'План выполнен полностью'}
        </div>
      </div>
      <div
        className="qa-plan__bar"
        role="meter"
        aria-label="Прогресс к плану оплат"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={paid}
      >
        <div className="qa-plan__fill" style={{ width: `${share(paid, goal) * 100}%` }} />
        {steps.map((s) => (
          <div key={s} className="qa-plan__mark" style={{ left: `${share(s, goal) * 100}%` }}>
            <span>{fmt(s)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export type BarItem = { key: string; label: React.ReactNode; value: number; note?: string }

// Горизонтальные полосы; ширина — доля от `max`, справа — значение и процент от `base`.
export function Bars(props: { items: BarItem[]; base: number; max?: number; color?: Color }) {
  const max = props.max ?? Math.max(...props.items.map((i) => i.value), 1)
  return (
    <ul className="qa-bars">
      {props.items.map((item) => (
        <li key={item.key}>
          <div className="qa-bar__top">
            <span className="qa-bar__label">{item.label}</span>
            <span className="qa-bar__value">
              <b>{fmt(item.value)}</b>
              <span>{item.note ?? pct(item.value, props.base)}</span>
            </span>
          </div>
          <div className="qa-bar__track">
            <div
              className="qa-bar__fill"
              style={{
                ...colorVar(props.color || 'visitors'),
                width: `${share(item.value, max) * 100}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Card(props: {
  title: string
  note?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`qa-card ${props.className || ''}`}>
      <header>
        <h2>{props.title}</h2>
        {props.note ? <p>{props.note}</p> : null}
      </header>
      {props.children}
    </section>
  )
}

export type TableRow = {
  key: string
  label: React.ReactNode
  sub?: React.ReactNode
  visitors: number
  leads: number
  paid: number
}

// Таблица «посетители → заявки → оплаты → конверсия». Конверсия — заявки / посетители.
export function FunnelTable(props: {
  rows: TableRow[]
  firstColumn: string
  hasLeads: boolean
  showPaid?: boolean
  totalVisitors?: number
  footer?: boolean
}) {
  const { rows, hasLeads } = props
  const showPaid = hasLeads && props.showPaid !== false
  const maxVisitors = Math.max(...rows.map((r) => r.visitors), 1)
  if (!rows.length) return <div className="qa-empty">Нет данных за период</div>
  const sum = (k: 'visitors' | 'leads' | 'paid') => rows.reduce((s, r) => s + r[k], 0)
  return (
    <div className="qa-table-wrap">
      <table className="qa-table">
        <thead>
          <tr>
            <th scope="col">{props.firstColumn}</th>
            <th scope="col">
              <span className="qa-wide">Посетители</span>
              <span className="qa-narrow">Посет.</span>
            </th>
            {hasLeads ? <th scope="col">Заявки</th> : null}
            {showPaid ? <th scope="col">Оплаты</th> : null}
            {hasLeads ? <th scope="col">Конв.</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">
                {r.label}
                {r.sub ? <small>{r.sub}</small> : null}
                <span
                  className="qa-share"
                  style={{ width: `${share(r.visitors, maxVisitors) * 100}%` }}
                />
              </th>
              <td>{fmt(r.visitors)}</td>
              {hasLeads ? <td>{fmt(r.leads)}</td> : null}
              {showPaid ? <td>{fmt(r.paid)}</td> : null}
              {hasLeads ? <td>{r.visitors ? pct(r.leads, r.visitors) : '—'}</td> : null}
            </tr>
          ))}
        </tbody>
        {props.footer ? (
          <tfoot>
            <tr>
              <td>Всего</td>
              <td>{fmt(props.totalVisitors ?? sum('visitors'))}</td>
              {hasLeads ? <td>{fmt(sum('leads'))}</td> : null}
              {showPaid ? <td>{fmt(sum('paid'))}</td> : null}
              {hasLeads ? (
                <td>{pct(sum('leads'), props.totalVisitors ?? sum('visitors'))}</td>
              ) : null}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  )
}

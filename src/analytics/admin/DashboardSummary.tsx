import type { ServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { hasRole } from '../../access'
import { buildSummary } from '../server/reports'
import './analytics.css'
import { fmt, pct } from './format'
import { PlanProgress, Tile } from './parts'

// Компактная сводка над карточками главной страницы админки.
export async function DashboardSummary({ payload, user }: ServerProps) {
  if (!hasRole(user as never, 'admin', 'manager')) return null

  let s: Awaited<ReturnType<typeof buildSummary>>
  try {
    s = await buildSummary(payload)
  } catch (err) {
    payload.logger.error({ err }, 'analytics: сводка на главной')
    return null
  }
  const href = formatAdminURL({ adminRoute: payload.config.routes.admin, path: '/analytics' })

  return (
    <section className="qa-summary" aria-label="Сводка аналитики">
      <div className="qa-summary__head">
        <h2>Лендинг за 7 дней</h2>
        <a className="qa-link" href={href}>
          Все отчёты
        </a>
      </div>
      <div className="qa-tiles">
        <Tile
          label="Посетители"
          color="visitors"
          value={fmt(s.week.visitors)}
          sub={`сегодня ${fmt(s.today.visitors)}`}
        />
        {s.hasLeads ? (
          <>
            <Tile
              label="Заявки"
              color="leads"
              value={fmt(s.week.leads)}
              sub={`сегодня ${fmt(s.today.leads)}`}
            />
            <Tile label="Конверсия" value={pct(s.week.leads, s.week.visits)} sub="визит → заявка" />
            <Tile label="Оплаты" color="paid" value={fmt(s.week.paid)} sub="за 7 дней" />
          </>
        ) : (
          <Tile label="Визиты" value={fmt(s.week.visits)} />
        )}
      </div>
      {s.hasLeads ? <PlanProgress steps={s.plan.steps} paid={s.plan.paid} /> : null}
    </section>
  )
}

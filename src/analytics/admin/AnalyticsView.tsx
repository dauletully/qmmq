import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter, SetStepNav } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { hasRole } from '../../access'
import { SETTINGS_SLUG } from '../shared'
import { buildReport, parsePeriod, PERIODS } from '../server/reports'
import './analytics.css'
import { ReportBody } from './ReportBody'
import { ReportShell } from './ReportShell'

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

// Раздел «Аналитика» — /admin/analytics. Свой вид Payload не оборачивает в шаблон, поэтому
// навигация, шапка и проверка входа — здесь.
export async function AnalyticsView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const { payload, user } = req
  const adminRoute = payload.config.routes.admin

  if (!user) {
    const login = formatAdminURL({ adminRoute, path: payload.config.admin.routes.login })
    redirect(
      `${login}?redirect=${encodeURIComponent(formatAdminURL({ adminRoute, path: '/analytics' }))}`,
    )
  }

  const allowed = hasRole(user, 'admin', 'manager')
  const period = parsePeriod(first(searchParams?.period))
  const landingParam = first(searchParams?.landing)
  const landing = landingParam && /^[a-z0-9-]{1,64}$/i.test(landingParam) ? landingParam : null
  const report = allowed ? await buildReport(payload, { period, landing }) : null

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={user}
      viewType="analytics"
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: 'Аналитика' }]} />
      <Gutter>
        <div className="qa-head">
          <div>
            <h1>Аналитика</h1>
            <p>Лендинг конкурса: посетители, заявки и оплаты</p>
          </div>
          {allowed ? (
            <a
              className="qa-link"
              href={formatAdminURL({ adminRoute, path: `/globals/${SETTINGS_SLUG}` })}
            >
              Цели и исключения
            </a>
          ) : null}
        </div>
        {report ? (
          <ReportShell
            period={period}
            landing={landing}
            periods={PERIODS.map((p) => ({ key: p.key, label: p.label }))}
            landings={report.landings}
          >
            <ReportBody report={report} />
          </ReportShell>
        ) : (
          <div className="qa">
            <div className="qa-alert">Отчёты доступны администраторам и менеджерам.</div>
          </div>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}

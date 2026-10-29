import type { CollectionConfig, Config, Endpoint, GlobalConfig } from 'payload'

import { AnalyticsEvents } from './collections/AnalyticsEvents'
import { AnalyticsSettings } from './globals/AnalyticsSettings'
import { ingestEndpoint } from './server/ingest'

type AdminComponents = NonNullable<NonNullable<Config['admin']>['components']>

// Всё, что модуль аналитики добавляет в Payload. payload.config.ts подключает это целиком.
export const analytics: {
  collections: CollectionConfig[]
  globals: GlobalConfig[]
  endpoints: Endpoint[]
  beforeDashboard: NonNullable<AdminComponents['beforeDashboard']>
  afterNavLinks: NonNullable<AdminComponents['afterNavLinks']>
  views: NonNullable<AdminComponents['views']>
} = {
  collections: [AnalyticsEvents],
  globals: [AnalyticsSettings],
  endpoints: [ingestEndpoint],
  beforeDashboard: ['/analytics/admin/DashboardSummary#DashboardSummary'],
  afterNavLinks: ['/analytics/admin/NavLinks#NavLinks'],
  views: {
    analytics: {
      Component: '/analytics/admin/AnalyticsView#AnalyticsView',
      path: '/analytics',
      exact: true,
      meta: { title: 'Аналитика' },
    },
  },
}

import type { CollectionConfig, Config, Endpoint, GlobalConfig } from 'payload'

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
  collections: [],
  globals: [],
  endpoints: [],
  beforeDashboard: [],
  afterNavLinks: [],
  views: {},
}

import type { CollectionConfig } from 'payload'

import { adminOnly, leadManagers, nobody } from '../../access'
import { EVENTS_SLUG, EVENTS_TABLE } from '../shared'

// Сырые события трекера. Пишутся только endpoint-ом /api/lp напрямую в таблицу (без хуков Payload).
// IP-адрес не хранится.
export const AnalyticsEvents: CollectionConfig = {
  slug: EVENTS_SLUG,
  dbName: EVENTS_TABLE,
  labels: { singular: 'Событие аналитики', plural: 'События аналитики' },
  admin: {
    hidden: true,
    useAsTitle: 'event',
    defaultColumns: ['event', 'path', 'channel', 'device', 'createdAt'],
  },
  access: {
    create: nobody,
    read: leadManagers,
    update: nobody,
    delete: adminOnly,
  },
  graphQL: false,
  disableDuplicate: true,
  indexes: [
    { fields: ['event', 'createdAt'] },
    { fields: ['visitorId', 'createdAt'] },
    { fields: ['landing', 'createdAt'] },
  ],
  fields: [
    { name: 'event', type: 'text', required: true },
    { name: 'visitorId', type: 'text', required: true },
    { name: 'sessionId', type: 'text', required: true, index: true },
    { name: 'props', type: 'json' },
    { name: 'path', type: 'text' },
    { name: 'locale', type: 'text' },
    { name: 'landing', type: 'text' },
    // first-touch: с чем посетитель пришёл впервые
    { name: 'utmSource', type: 'text' },
    { name: 'utmMedium', type: 'text' },
    { name: 'utmCampaign', type: 'text' },
    { name: 'utmContent', type: 'text' },
    { name: 'utmTerm', type: 'text' },
    { name: 'referrer', type: 'text' },
    { name: 'landingPath', type: 'text' },
    // источник, вычисленный при приёме (instagram, whatsapp, direct…)
    { name: 'channel', type: 'text' },
    { name: 'device', type: 'text' },
    { name: 'browser', type: 'text' },
    { name: 'os', type: 'text' },
  ],
}

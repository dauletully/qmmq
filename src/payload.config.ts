import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { analytics } from './analytics/payload'
import { collections } from './collections'
import { endpoints } from './endpoints'
import { globals } from './globals'
import { jobs } from './jobs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Каждый модуль (контент, заявки и amoCRM, аналитика) подключается через свой индекс —
// этот файл только собирает их вместе. См. docs/ARCHITECTURE.md.
export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    dateFormat: 'dd.MM.yyyy HH:mm',
    meta: {
      titleSuffix: ' — QMMQ',
    },
    components: {
      beforeDashboard: [...analytics.beforeDashboard],
      afterNavLinks: [...analytics.afterNavLinks],
      views: { ...analytics.views },
    },
  },
  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: 'ru',
  },
  localization: {
    locales: [
      { code: 'ru', label: 'Русский' },
      { code: 'kk', label: 'Қазақша' },
    ],
    defaultLocale: 'ru',
    fallback: true,
  },
  collections: [...collections, ...analytics.collections],
  globals: [...globals, ...analytics.globals],
  endpoints: [...endpoints, ...analytics.endpoints],
  jobs,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})

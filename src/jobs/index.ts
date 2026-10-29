import type { JobsConfig } from 'payload'

import { isAdmin } from '../access'
import { AMO_QUEUE } from '../lib/amocrm/sync'
import { sendLeadToAmoTask } from './sendLeadToAmo'

export const jobs: JobsConfig = {
  tasks: [sendLeadToAmoTask],
  // Очередь разбирается внутри сервера приложения каждые 5 секунд (одна ВМ, не serverless).
  autoRun: [{ cron: '*/5 * * * * *', queue: AMO_QUEUE, limit: 10, silent: { info: true } }],
  deleteJobOnComplete: true,
  access: {
    run: ({ req }) => isAdmin(req.user),
    queue: ({ req }) => isAdmin(req.user),
    cancel: ({ req }) => isAdmin(req.user),
  },
}

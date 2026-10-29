import type { TaskConfig } from 'payload'

import {
  AMO_MAX_RETRIES,
  AMO_RETRY_DELAY_MS,
  AMO_TASK_SLUG,
  syncLeadToAmo,
} from '../lib/amocrm/sync'

// Отправка заявки в amoCRM. Ошибка сети, 429 и 5xx — повтор с растущей паузой;
// статус, число попыток и последняя ошибка пишутся в саму заявку (группа amo).
export const sendLeadToAmoTask: TaskConfig<'amocrmSendLead'> = {
  slug: AMO_TASK_SLUG,
  label: 'Отправка заявки в amoCRM',
  inputSchema: [{ name: 'leadId', type: 'number', required: true }],
  outputSchema: [{ name: 'status', type: 'text' }],
  retries: {
    attempts: AMO_MAX_RETRIES,
    backoff: { type: 'exponential', delay: AMO_RETRY_DELAY_MS },
  },
  handler: async ({ input, job, req }) => {
    const status = await syncLeadToAmo(req.payload, input.leadId, {
      isLastAttempt: (job.totalTried ?? 0) >= AMO_MAX_RETRIES,
    })
    return { output: { status } }
  },
}

import type { Payload } from 'payload'

import type { Event, Landing, Lead } from '../../payload-types'
import { AMO_LEAD_TYPES } from '../constants'
import { amoDisabledReason, getAmoSettings, type AmoSettings } from '../integrations'
import { AmoClient, AmoError } from './client'
import { buildComplexLead, buildLeadNote, type LeadForAmo } from './lead'

// Отправка одной заявки в amoCRM. Вызывается из задачи очереди (src/jobs).

export const AMO_TASK_SLUG = 'amocrmSendLead'
export const AMO_QUEUE = 'amocrm'
// Повторы с растущей паузой: 30 с, 1, 2, 4, 8, 16, 32, 64 мин — всего около двух часов.
export const AMO_MAX_RETRIES = 8
export const AMO_RETRY_DELAY_MS = 30_000

export type SyncOutcome = 'sent' | 'disabled' | 'failed' | 'skipped'

const sentence = (text: string) => text.trim().replace(/[.\s]+$/, '')

// Защита от двойной отправки одной заявки параллельными задачами в этом процессе.
const inFlight = new Set<number>()

export function siteUrl(): string {
  return (process.env.SITE_URL || '').replace(/\/+$/, '')
}

function adminLeadUrl(id: number): string | null {
  const base = siteUrl()
  return base ? `${base}/admin/collections/leads/${id}` : null
}

function relId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return null
}

async function updateAmo(payload: Payload, id: number, amo: Partial<NonNullable<Lead['amo']>>) {
  await payload.update({
    collection: 'leads',
    id,
    data: { amo },
    depth: 0,
    overrideAccess: true,
    context: { system: true },
  })
}

type SyncOptions = {
  // Последняя попытка задачи — после ошибки статус станет «Ошибка», без новых повторов.
  isLastAttempt: boolean
  settings?: AmoSettings
  client?: AmoClient
}

export async function syncLeadToAmo(
  payload: Payload,
  leadId: number,
  opts: SyncOptions,
): Promise<SyncOutcome> {
  if (inFlight.has(leadId)) {
    throw new AmoError('Заявка уже отправляется', { status: null, retriable: true })
  }
  inFlight.add(leadId)
  try {
    return await doSync(payload, leadId, opts)
  } finally {
    inFlight.delete(leadId)
  }
}

async function doSync(payload: Payload, leadId: number, opts: SyncOptions): Promise<SyncOutcome> {
  const lead = await payload.findByID({
    collection: 'leads',
    id: leadId,
    depth: 1,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!lead) return 'skipped'
  if (lead.amo?.syncStatus === 'sent' && lead.amo?.leadId) return 'skipped'
  // Обратная связь и подобные заявки в amoCRM не уходят — даже по кнопке «Отправить повторно».
  if (!AMO_LEAD_TYPES.includes(lead.type)) {
    if (lead.amo?.syncStatus !== 'skipped') {
      await updateAmo(payload, leadId, {
        syncStatus: 'skipped',
        lastError: 'Этот тип заявки не отправляется в amoCRM',
      })
    }
    return 'skipped'
  }

  const settings = opts.settings ?? (await getAmoSettings(payload))
  const reason = amoDisabledReason(settings)
  if (reason) {
    await updateAmo(payload, leadId, { syncStatus: 'disabled', lastError: reason })
    return 'disabled'
  }

  const attempts = (lead.amo?.attempts ?? 0) + 1
  const event = lead.event && typeof lead.event === 'object' ? (lead.event as Event) : null
  const landing =
    lead.landing && typeof lead.landing === 'object' ? (lead.landing as Landing) : null
  const leadForAmo = lead as unknown as LeadForAmo
  const warnings: string[] = []

  try {
    const client =
      opts.client ?? new AmoClient({ baseUrl: settings.baseUrl, accessToken: settings.accessToken })

    let amoLeadId = lead.amo?.leadId ?? null
    if (!amoLeadId) {
      const buildOpts = {
        lead: leadForAmo,
        event,
        landingSlug: landing?.slug,
        settings,
        adminUrl: adminLeadUrl(leadId),
      }
      let result
      try {
        result = await client.createLeadComplex(buildComplexLead(buildOpts))
      } catch (err) {
        // amoCRM отклонила поля (например, поле удалили в аккаунте) — отправляем без них,
        // все данные всё равно будут в примечании.
        if (err instanceof AmoError && err.status === 400) {
          result = await client.createLeadComplex(
            buildComplexLead({ ...buildOpts, withCustomFields: false }),
          )
          warnings.push(
            `Сделка создана без дополнительных полей: ${sentence(err.message)}. Нажмите «Создать поля в amoCRM» в настройках интеграции.`,
          )
        } else {
          throw err
        }
      }
      amoLeadId = result.id
      // Сохраняем номер сделки сразу, чтобы повтор не создал дубль.
      await updateAmo(payload, leadId, {
        leadId: result.id,
        contactId: result.contact_id ?? null,
        pipelineId: settings.pipelineId ?? null,
        statusId: settings.pipelineId ? (settings.newStatusId ?? null) : null,
        attempts,
        lastError: null,
      })
    }

    try {
      await client.addLeadNote(
        amoLeadId,
        buildLeadNote({
          lead: leadForAmo,
          event,
          landingSlug: landing?.slug,
          adminUrl: adminLeadUrl(leadId),
        }),
      )
    } catch (err) {
      if (err instanceof AmoError && err.retriable && !opts.isLastAttempt) throw err
      warnings.push(`Примечание не добавлено: ${err instanceof Error ? err.message : String(err)}`)
    }

    await updateAmo(payload, leadId, {
      syncStatus: 'sent',
      syncedAt: new Date().toISOString(),
      attempts,
      lastError: warnings.length ? warnings.join('\n') : null,
    })
    return 'sent'
  } catch (err) {
    const retriable = err instanceof AmoError ? err.retriable : true
    const willRetry = retriable && !opts.isLastAttempt
    const message = sentence(err instanceof Error ? err.message : String(err))
    await updateAmo(payload, leadId, {
      syncStatus: willRetry ? 'pending' : 'failed',
      attempts,
      lastError: willRetry ? `${message}. Повторим автоматически.` : message,
    })
    if (willRetry) throw err
    return 'failed'
  }
}

// Ставит заявку в очередь на отправку (без ожидания amoCRM).
// Незавершённые задачи по этой заявке заменяются новой, чтобы не было двух параллельных отправок.
export async function queueLeadSync(payload: Payload, leadIds: number[]): Promise<number> {
  if (!leadIds.length) return 0
  const wanted = new Set(leadIds)
  const pendingJobs = await payload.find({
    collection: 'payload-jobs',
    where: {
      and: [
        { taskSlug: { equals: AMO_TASK_SLUG } },
        { completedAt: { exists: false } },
        { processing: { equals: false } },
      ],
    },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const stale = pendingJobs.docs
    .filter((job) => wanted.has(relId((job.input as { leadId?: number } | null)?.leadId) ?? -1))
    .map((job) => job.id)
  if (stale.length) {
    await payload.delete({
      collection: 'payload-jobs',
      where: { id: { in: stale } },
      overrideAccess: true,
    })
  }

  for (const id of wanted) {
    await updateAmo(payload, id, { syncStatus: 'pending' })
    await payload.jobs.queue({ task: AMO_TASK_SLUG, queue: AMO_QUEUE, input: { leadId: id } })
  }
  return wanted.size
}

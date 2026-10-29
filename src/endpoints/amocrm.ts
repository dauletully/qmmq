import { timingSafeEqual } from 'node:crypto'

import type { Endpoint, PayloadRequest } from 'payload'

import { hasRole, isAdmin, roleOf } from '../access'
import { AmoClient, AmoError, type AmoPipeline } from '../lib/amocrm/client'
import { setupLeadFields } from '../lib/amocrm/fields'
import { queueLeadSync, siteUrl } from '../lib/amocrm/sync'
import { parseAmoWebhook } from '../lib/amocrm/webhook'
import { validateAmoBaseUrl } from '../lib/validators'
import {
  amoDisabledReason,
  getAmoSettings,
  type AmoSettings,
  type CachedPipeline,
} from '../lib/integrations'

const noStore = { 'Cache-Control': 'no-store' }
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: noStore })
const forbidden = () => json({ ok: false, error: 'Недостаточно прав' }, 403)

async function readJson(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    const text = (await req.text?.()) ?? ''
    const parsed = text ? JSON.parse(text) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err))

// Данные из формы (ещё не сохранённые) имеют приоритет над сохранёнными.
function clientFrom(settings: AmoSettings, body: Record<string, unknown>) {
  const baseUrl =
    typeof body.baseUrl === 'string' && body.baseUrl.trim() ? body.baseUrl : settings.baseUrl
  const accessToken =
    typeof body.accessToken === 'string' && body.accessToken.trim()
      ? body.accessToken
      : settings.accessToken
  if (!baseUrl)
    throw new AmoError('Укажите адрес аккаунта amoCRM', { status: null, retriable: false })
  const urlError = validateAmoBaseUrl(baseUrl, {} as never)
  if (urlError !== true) throw new AmoError(String(urlError), { status: null, retriable: false })
  if (!accessToken)
    throw new AmoError('Вставьте долгосрочный токен', { status: null, retriable: false })
  return new AmoClient({ baseUrl, accessToken })
}

async function saveAmo(req: PayloadRequest, patch: Record<string, unknown>) {
  const current = await req.payload.findGlobal({
    slug: 'integrations',
    depth: 0,
    overrideAccess: true,
  })
  await req.payload.updateGlobal({
    slug: 'integrations',
    data: { amocrm: { ...(current.amocrm ?? {}), ...patch } },
    depth: 0,
    overrideAccess: true,
    context: { system: true },
  })
}

function compactPipelines(pipelines: AmoPipeline[]): CachedPipeline[] {
  return pipelines
    .filter((p) => !p.is_archive)
    .sort((a, b) => a.sort - b.sort)
    .map((p) => ({
      id: p.id,
      name: p.name,
      isMain: p.is_main,
      statuses: (p._embedded?.statuses ?? [])
        .sort((a, b) => a.sort - b.sort)
        .map((s) => ({ id: s.id, name: s.name, color: s.color })),
    }))
}

function webhookUrl(req: PayloadRequest, secret: string) {
  const base = siteUrl() || new URL(req.url ?? 'http://localhost').origin
  return `${base}/api/amocrm/webhook?secret=${encodeURIComponent(secret)}`
}

function secretMatches(given: string | null, expected: string) {
  if (!given || !expected) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Проверить подключение: GET /api/v4/account
const check: Endpoint = {
  path: '/amocrm/check',
  method: 'post',
  handler: async (req) => {
    if (!isAdmin(req.user)) return forbidden()
    try {
      const client = clientFrom(await getAmoSettings(req.payload), await readJson(req))
      const account = await client.getAccount()
      return json({
        ok: true,
        account: { id: account?.id, name: account?.name, subdomain: account?.subdomain },
      })
    } catch (err) {
      return json({ ok: false, error: errorText(err) })
    }
  },
}

// Загрузить воронки и этапы — сохраняются в настройках, чтобы выбирать из списка.
const pipelines: Endpoint = {
  path: '/amocrm/pipelines',
  method: 'post',
  handler: async (req) => {
    if (!isAdmin(req.user)) return forbidden()
    try {
      const client = clientFrom(await getAmoSettings(req.payload), await readJson(req))
      const list = compactPipelines(await client.getPipelines())
      await saveAmo(req, { pipelinesCache: list })
      return json({ ok: true, pipelines: list })
    } catch (err) {
      return json({ ok: false, error: errorText(err) })
    }
  },
}

// Создать недостающие поля сделки и сохранить их id в fieldMap.
const setupFields: Endpoint = {
  path: '/amocrm/setup-fields',
  method: 'post',
  handler: async (req) => {
    if (!isAdmin(req.user)) return forbidden()
    try {
      const client = clientFrom(await getAmoSettings(req.payload), await readJson(req))
      const result = await setupLeadFields(client)
      await saveAmo(req, { fieldMap: result.fieldMap })
      return json({ ok: true, ...result })
    } catch (err) {
      return json({ ok: false, error: errorText(err) })
    }
  },
}

// Подключить вебхук в amoCRM через API (то же, что вставить адрес вручную).
const registerWebhook: Endpoint = {
  path: '/amocrm/register-webhook',
  method: 'post',
  handler: async (req) => {
    if (!isAdmin(req.user)) return forbidden()
    try {
      const settings = await getAmoSettings(req.payload)
      if (!settings.webhookSecret) {
        return json({
          ok: false,
          error: 'Сначала сохраните настройки — будет создан секрет вебхука',
        })
      }
      const destination = webhookUrl(req, settings.webhookSecret)
      if (!destination.startsWith('https://') || /localhost|127\.0\.0\.1/.test(destination)) {
        return json({
          ok: false,
          error: `amoCRM принимает только публичный адрес https. Сейчас адрес вебхука: ${destination}. Задайте SITE_URL на сервере.`,
        })
      }
      const client = clientFrom(settings, await readJson(req))
      await client.createWebhook(destination, ['status_lead'])
      return json({ ok: true, destination })
    } catch (err) {
      return json({ ok: false, error: errorText(err) })
    }
  },
}

// Отправить заявки повторно: { id } — одну, { all: true } — все неотправленные (disabled и failed).
const resend: Endpoint = {
  path: '/amocrm/resend',
  method: 'post',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin', 'manager')) return forbidden()
    const body = await readJson(req)
    const settings = await getAmoSettings(req.payload)
    const reason = amoDisabledReason(settings)
    if (reason) return json({ ok: false, error: `${reason}. Заявки останутся на сайте.` })

    let ids: number[] = []
    if (body.all === true) {
      const found = await req.payload.find({
        collection: 'leads',
        where: { 'amo.syncStatus': { in: ['disabled', 'failed'] } },
        limit: 500,
        depth: 0,
        select: { type: true },
        sort: 'createdAt',
        overrideAccess: true,
      })
      ids = found.docs.map((d) => d.id)
    } else {
      const id = Number(body.id)
      if (!Number.isInteger(id) || id <= 0)
        return json({ ok: false, error: 'Не указана заявка' }, 400)
      const lead = await req.payload.findByID({
        collection: 'leads',
        id,
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
      })
      if (!lead) return json({ ok: false, error: 'Заявка не найдена' }, 404)
      if (lead.amo?.syncStatus === 'sent' && lead.amo?.leadId) {
        return json({ ok: false, error: `Сделка уже создана в amoCRM (№${lead.amo.leadId})` })
      }
      ids = [id]
    }
    const queued = await queueLeadSync(req.payload, ids)
    return json({ ok: true, queued })
  },
}

// Сводка по отправке — для панели в настройках интеграции.
const queueStats: Endpoint = {
  path: '/amocrm/queue',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user, 'admin', 'manager')) return forbidden()
    const counts: Record<string, number> = {}
    for (const status of ['pending', 'sent', 'failed', 'disabled']) {
      const { totalDocs } = await req.payload.count({
        collection: 'leads',
        where: { 'amo.syncStatus': { equals: status } },
        overrideAccess: true,
      })
      counts[status] = totalDocs
    }
    const reason = amoDisabledReason(await getAmoSettings(req.payload))
    return json({ ok: true, counts, disabledReason: reason })
  },
}

// Подписи для карточки заявки: ссылка на сделку, названия воронки и этапа.
const leadInfo: Endpoint = {
  path: '/amocrm/lead-info',
  method: 'get',
  handler: async (req) => {
    if (!roleOf(req.user)) return forbidden()
    const url = new URL(req.url ?? 'http://localhost')
    const pipelineId = Number(url.searchParams.get('pipelineId')) || null
    const statusId = Number(url.searchParams.get('statusId')) || null
    const amoLeadId = Number(url.searchParams.get('leadId')) || null
    const settings = await getAmoSettings(req.payload)
    const pipeline = settings.pipelines.find((p) => p.id === pipelineId)
    const status = pipeline?.statuses.find((s) => s.id === statusId)
    return json({
      ok: true,
      dealUrl:
        amoLeadId && settings.baseUrl
          ? `${settings.baseUrl.replace(/\/+$/, '')}/leads/detail/${amoLeadId}`
          : null,
      pipelineName: pipeline?.name ?? null,
      statusName: status?.name ?? null,
      paid: statusId ? settings.paidStatusIds.includes(statusId) : false,
      disabledReason: amoDisabledReason(settings),
      canResend: hasRole(req.user, 'admin', 'manager'),
    })
  },
}

// Вебхук amoCRM: смена этапа сделки → amo.statusId, этап «Оплачено» → payment.paid.
const webhook: Endpoint = {
  path: '/amocrm/webhook',
  method: 'post',
  handler: async (req) => {
    const url = new URL(req.url ?? 'http://localhost')
    const settings = await getAmoSettings(req.payload)
    if (!secretMatches(url.searchParams.get('secret'), settings.webhookSecret)) {
      return json({ ok: false, error: 'unauthorized' }, 401)
    }

    const raw = (await req.text?.()) ?? ''
    let body: string | Record<string, unknown> = raw
    if ((req.headers.get('content-type') ?? '').includes('application/json')) {
      try {
        body = JSON.parse(raw)
      } catch {
        return json({ ok: false, error: 'invalid_json' }, 400)
      }
    }

    const changes = parseAmoWebhook(body)
    let updated = 0
    for (const change of changes) {
      const { docs } = await req.payload.find({
        collection: 'leads',
        where: { 'amo.leadId': { equals: change.leadId } },
        limit: 20,
        depth: 0,
        overrideAccess: true,
      })
      for (const lead of docs) {
        const paidNow = change.statusId !== null && settings.paidStatusIds.includes(change.statusId)
        const alreadyPaid = Boolean(lead.payment?.paid)
        await req.payload.update({
          collection: 'leads',
          id: lead.id,
          data: {
            amo: {
              ...(change.statusId ? { statusId: change.statusId } : {}),
              ...(change.pipelineId ? { pipelineId: change.pipelineId } : {}),
            },
            ...(paidNow && !alreadyPaid
              ? { payment: { paid: true, paidAt: new Date().toISOString() } }
              : {}),
          },
          depth: 0,
          overrideAccess: true,
          context: { system: true },
        })
        updated++
      }
    }
    return json({ ok: true, received: changes.length, updated })
  },
}

export const amocrmEndpoints: Endpoint[] = [
  check,
  pipelines,
  setupFields,
  registerWebhook,
  resend,
  queueStats,
  leadInfo,
  webhook,
]

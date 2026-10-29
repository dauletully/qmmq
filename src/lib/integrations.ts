import type { Payload } from 'payload'

import type { AmoFieldMap } from './amocrm/fields'

// Настройки интеграций. Токен amoCRM читается только здесь, на сервере, в обход доступа —
// наружу (на публичные страницы) отдаются только ID пикселей.

export type CachedPipeline = {
  id: number
  name: string
  isMain?: boolean
  statuses: Array<{ id: number; name: string; color?: string }>
}

export type AmoSettings = {
  enabled: boolean
  baseUrl: string
  accessToken: string
  pipelineId: number | null
  newStatusId: number | null
  paidStatusIds: number[]
  fieldMap: AmoFieldMap | null
  webhookSecret: string
  pipelines: CachedPipeline[]
}

export type PublicIntegrations = {
  metaPixelId: string | null
  tiktokPixelId: string | null
}

async function resolvePayload(payload?: Payload): Promise<Payload> {
  if (payload) return payload
  // Динамический импорт — чтобы не было цикла config → endpoints → lib → config.
  const [{ getPayload }, { default: config }] = await Promise.all([
    import('payload'),
    import('@payload-config'),
  ])
  return getPayload({ config })
}

export async function getAmoSettings(payload?: Payload): Promise<AmoSettings> {
  const p = await resolvePayload(payload)
  const doc = await p.findGlobal({ slug: 'integrations', depth: 0, overrideAccess: true })
  const amo = doc?.amocrm ?? {}
  return {
    enabled: Boolean(amo.enabled),
    baseUrl: amo.baseUrl?.trim() ?? '',
    accessToken: amo.accessToken?.trim() ?? '',
    pipelineId: amo.pipelineId ?? null,
    newStatusId: amo.newStatusId ?? null,
    paidStatusIds: (amo.paidStatusIds ?? []).filter((n): n is number => typeof n === 'number'),
    fieldMap: (amo.fieldMap as AmoFieldMap | null) ?? null,
    webhookSecret: amo.webhookSecret ?? '',
    pipelines: Array.isArray(amo.pipelinesCache) ? (amo.pipelinesCache as CachedPipeline[]) : [],
  }
}

// Почему заявки сейчас не уходят в amoCRM (null — всё настроено).
export function amoDisabledReason(s: AmoSettings): string | null {
  if (!s.enabled) return 'Отправка в amoCRM выключена в настройках интеграции'
  if (!s.baseUrl) return 'Не указан адрес аккаунта amoCRM'
  if (!s.accessToken) return 'Не указан долгосрочный токен amoCRM'
  return null
}

// Для публичных страниц: только ID пикселей. Пустое значение — пиксель не подключать.
export async function getPublicIntegrations(payload?: Payload): Promise<PublicIntegrations> {
  try {
    const p = await resolvePayload(payload)
    const doc = await p.findGlobal({
      slug: 'integrations',
      depth: 0,
      overrideAccess: true,
      select: { pixels: true },
    })
    return {
      metaPixelId: doc?.pixels?.metaPixelId?.trim() || null,
      tiktokPixelId: doc?.pixels?.tiktokPixelId?.trim() || null,
    }
  } catch {
    return { metaPixelId: null, tiktokPixelId: null }
  }
}

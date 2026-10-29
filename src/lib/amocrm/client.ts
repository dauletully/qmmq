// Клиент amoCRM API v4 для приватной интеграции с долгосрочным токеном.
// Лимит amoCRM — 7 запросов в секунду на интеграцию; держим не больше ~6.

export type AmoPipelineStatus = {
  id: number
  name: string
  sort: number
  type: number
  color?: string
  pipeline_id: number
}

export type AmoPipeline = {
  id: number
  name: string
  sort: number
  is_main: boolean
  is_archive?: boolean
  _embedded?: { statuses?: AmoPipelineStatus[] }
}

export type AmoCustomFieldEnum = { id: number; value: string; sort?: number; code?: string | null }

export type AmoCustomField = {
  id: number
  name: string
  code?: string | null
  type: string
  sort?: number
  enums?: AmoCustomFieldEnum[] | null
}

export type AmoCustomFieldValue = {
  field_id?: number
  field_code?: string
  values: Array<{ value?: string | number | boolean; enum_id?: number; enum_code?: string }>
}

export type AmoNewCustomField = {
  name: string
  type: string
  code?: string
  sort?: number
  enums?: Array<{ value: string; sort: number; code?: string }>
}

export type AmoComplexLead = {
  name: string
  price?: number
  pipeline_id?: number
  status_id?: number
  request_id?: string
  custom_fields_values?: AmoCustomFieldValue[]
  _embedded?: {
    tags?: Array<{ name: string } | { id: number }>
    contacts?: Array<{
      id?: number
      name?: string
      first_name?: string
      custom_fields_values?: AmoCustomFieldValue[]
    }>
  }
}

export type AmoComplexResult = {
  id: number
  contact_id: number | null
  company_id: number | null
  merged: boolean
  request_id: string[]
}

export type AmoAccount = {
  id: number
  name: string
  subdomain: string
  country?: string
  currency?: string
}

export class AmoError extends Error {
  status: number | null
  retriable: boolean
  body: unknown

  constructor(
    message: string,
    opts: { status: number | null; retriable: boolean; body?: unknown },
  ) {
    super(message)
    this.name = 'AmoError'
    this.status = opts.status
    this.retriable = opts.retriable
    this.body = opts.body
  }
}

export type AmoClientOptions = {
  baseUrl: string
  accessToken: string
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  // Минимальный интервал между запросами к одному аккаунту, мс.
  minIntervalMs?: number
  // Сколько раз повторять запрос внутри клиента (429 — всегда, 5xx и сеть — только для GET).
  maxRetries?: number
  timeoutMs?: number
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Общая очередь на процесс: несколько задач подряд не превысят лимит.
const nextSlotByHost = new Map<string, number>()

async function throttle(key: string, intervalMs: number, sleep: (ms: number) => Promise<void>) {
  const now = Date.now()
  const slot = Math.max(now, nextSlotByHost.get(key) ?? 0)
  nextSlotByHost.set(key, slot + intervalMs)
  if (slot > now) await sleep(slot - now)
}

export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

function describeBody(body: unknown): string {
  if (!body || typeof body !== 'object') return typeof body === 'string' ? body.slice(0, 300) : ''
  const b = body as Record<string, unknown>
  const parts: string[] = []
  if (typeof b.title === 'string') parts.push(b.title)
  if (typeof b.detail === 'string') parts.push(b.detail)
  const ve = b['validation-errors']
  if (Array.isArray(ve)) {
    for (const item of ve) {
      const errors = (item as { errors?: Array<{ path?: string; detail?: string }> }).errors ?? []
      for (const e of errors) parts.push(`${e.path ?? ''}: ${e.detail ?? ''}`.trim())
    }
  }
  return parts.join('; ').slice(0, 500)
}

function messageForStatus(status: number, body: unknown): string {
  const details = describeBody(body)
  const suffix = details ? ` — ${details}` : ''
  switch (status) {
    case 400:
      return `amoCRM отклонила данные (400)${suffix}`
    case 401:
      return `amoCRM не приняла токен (401): проверьте долгосрочный токен и адрес аккаунта${suffix}`
    case 402:
      return `Аккаунт amoCRM не оплачен (402)${suffix}`
    case 403:
      return `amoCRM запретила доступ (403): у интеграции нет прав или аккаунт временно заблокирован за превышение лимитов${suffix}`
    case 404:
      return `Не найдено в amoCRM (404): проверьте адрес аккаунта${suffix}`
    case 429:
      return `Слишком много запросов к amoCRM (429)${suffix}`
    default:
      return status >= 500
        ? `amoCRM временно недоступна (${status})${suffix}`
        : `Ошибка amoCRM (${status})${suffix}`
  }
}

export class AmoClient {
  readonly baseUrl: string
  private token: string
  private fetchImpl: typeof fetch
  private sleep: (ms: number) => Promise<void>
  private minIntervalMs: number
  private maxRetries: number
  private timeoutMs: number

  constructor(opts: AmoClientOptions) {
    if (!opts.baseUrl)
      throw new AmoError('Не указан адрес аккаунта amoCRM', { status: null, retriable: false })
    if (!opts.accessToken)
      throw new AmoError('Не указан токен amoCRM', { status: null, retriable: false })
    this.baseUrl = normalizeBaseUrl(opts.baseUrl)
    this.token = opts.accessToken.trim()
    this.fetchImpl = opts.fetch ?? fetch
    this.sleep = opts.sleep ?? defaultSleep
    this.minIntervalMs = opts.minIntervalMs ?? 170
    this.maxRetries = opts.maxRetries ?? 3
    this.timeoutMs = opts.timeoutMs ?? 15_000
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    body?: unknown,
  ): Promise<T | null> {
    const url = `${this.baseUrl}${path}`
    const idempotent = method === 'GET'

    for (let attempt = 0; ; attempt++) {
      await throttle(this.baseUrl, this.minIntervalMs, this.sleep)

      let res: Response
      try {
        res = await this.fetchImpl(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json',
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.timeoutMs),
        })
      } catch (err) {
        if (idempotent && attempt < this.maxRetries) {
          await this.sleep(1000 * 2 ** attempt)
          continue
        }
        const reason = err instanceof Error ? err.message : String(err)
        throw new AmoError(`Нет связи с amoCRM: ${reason}`, { status: null, retriable: true })
      }

      if (res.status === 204) return null
      const text = await res.text()
      let parsed: unknown = null
      if (text) {
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = text
        }
      }
      if (res.ok) return parsed as T

      // 429 — запрос не выполнен, повторять безопасно. 5xx — только для GET (POST мог пройти).
      const canRetryHere =
        attempt < this.maxRetries && (res.status === 429 || (idempotent && res.status >= 500))
      if (canRetryHere) {
        const retryAfter = Number(res.headers.get('retry-after'))
        await this.sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt)
        continue
      }

      const retriable =
        res.status === 429 || res.status >= 500 || [401, 402, 403].includes(res.status)
      throw new AmoError(messageForStatus(res.status, parsed), {
        status: res.status,
        retriable,
        body: parsed,
      })
    }
  }

  getAccount() {
    return this.request<AmoAccount>('GET', '/api/v4/account')
  }

  async getPipelines(): Promise<AmoPipeline[]> {
    const data = await this.request<{ _embedded?: { pipelines?: AmoPipeline[] } }>(
      'GET',
      '/api/v4/leads/pipelines',
    )
    return data?._embedded?.pipelines ?? []
  }

  async getLeadCustomFields(): Promise<AmoCustomField[]> {
    const all: AmoCustomField[] = []
    for (let page = 1; page <= 20; page++) {
      const data = await this.request<{
        _embedded?: { custom_fields?: AmoCustomField[] }
        _page_count?: number
      }>('GET', `/api/v4/leads/custom_fields?limit=250&page=${page}`)
      const items = data?._embedded?.custom_fields ?? []
      all.push(...items)
      if (!data || items.length === 0 || (data._page_count && page >= data._page_count)) break
    }
    return all
  }

  async createLeadCustomFields(fields: AmoNewCustomField[]): Promise<AmoCustomField[]> {
    if (!fields.length) return []
    const data = await this.request<{ _embedded?: { custom_fields?: AmoCustomField[] } }>(
      'POST',
      '/api/v4/leads/custom_fields',
      fields,
    )
    return data?._embedded?.custom_fields ?? []
  }

  async createLeadComplex(lead: AmoComplexLead): Promise<AmoComplexResult> {
    const data = await this.request<AmoComplexResult[]>('POST', '/api/v4/leads/complex', [lead])
    const result = Array.isArray(data) ? data[0] : null
    if (!result?.id) {
      throw new AmoError('amoCRM не вернула номер сделки', {
        status: null,
        retriable: true,
        body: data,
      })
    }
    return result
  }

  async addLeadNote(leadId: number, text: string) {
    return this.request('POST', `/api/v4/leads/${leadId}/notes`, [
      { note_type: 'common', params: { text } },
    ])
  }

  async createWebhook(destination: string, settings: string[]) {
    return this.request('POST', '/api/v4/webhooks', { destination, settings })
  }
}

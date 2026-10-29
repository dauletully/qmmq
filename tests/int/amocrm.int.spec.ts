// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import { AmoClient, AmoError } from '@/lib/amocrm/client'
import { setupLeadFields, type AmoFieldMap } from '@/lib/amocrm/fields'
import { buildComplexLead, buildLeadNote, type LeadForAmo } from '@/lib/amocrm/lead'
import { parseAmoWebhook } from '@/lib/amocrm/webhook'
import { registrationSchema, schoolSchema, fieldErrors } from '@/lib/forms/schemas'
import { normalizePhone } from '@/lib/phone'

type Call = { url: string; init: RequestInit }

function mockFetch(
  responses: Array<{ status: number; body?: unknown; headers?: Record<string, string> }>,
) {
  const calls: Call[] = []
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} })
    const next = responses.shift()
    if (!next) throw new Error('unexpected request')
    const text = next.body === undefined ? '' : JSON.stringify(next.body)
    return new Response(next.status === 204 ? null : text, {
      status: next.status,
      headers: next.headers,
    })
  })
  return { fetch: fn as unknown as typeof fetch, calls }
}

const sleep = vi.fn(async () => undefined)
let host = 0
// У каждого теста свой «аккаунт», чтобы общая очередь запросов не мешала.
const client = (f: typeof fetch) =>
  new AmoClient({
    baseUrl: `https://t${++host}.amocrm.ru/`,
    accessToken: ' token ',
    fetch: f,
    sleep,
  })

const lead: LeadForAmo = {
  id: 42,
  type: 'registration',
  locale: 'ru',
  fullName: 'Иванова Айгерим',
  subject: 'math',
  region: 'almaty',
  city: 'Алматы',
  school: 'Школа-лицей',
  experience: '5to15',
  phone: '+77011234567',
  email: 'teacher@example.com',
  howHeard: 'Instagram',
  consent: true,
  consentAt: '2026-10-29T10:00:00.000Z',
  createdAt: '2026-10-29T10:00:00.000Z',
  attribution: { utmSource: 'instagram', utmCampaign: 'xii', referrer: 'https://l.instagram.com/' },
}

const fieldMap: AmoFieldMap = {
  fields: {
    subjects: { id: 101, enums: { math: 1001, physics: 1002 } },
    region: { id: 102, enums: { almaty: 2001 } },
    city: { id: 103 },
    siteLeadId: { id: 104 },
  },
}

describe('amoCRM: сделка из заявки', () => {
  it('собирает сделку с контактом, тегами, ценой, полями и UTM', () => {
    const result = buildComplexLead({
      lead,
      event: { price: 50000, title: 'XII конкурс' },
      settings: { pipelineId: 7, newStatusId: 70, fieldMap },
    })
    expect(result.name).toBe('Регистрация — Иванова Айгерим')
    expect(result.price).toBe(50000)
    expect(result.pipeline_id).toBe(7)
    expect(result.status_id).toBe(70)
    expect(result._embedded?.tags).toEqual([{ name: 'Регистрация' }, { name: 'Математика' }])
    expect(result._embedded?.contacts?.[0]).toEqual({
      name: 'Иванова Айгерим',
      custom_fields_values: [
        { field_code: 'PHONE', values: [{ value: '+77011234567', enum_code: 'MOB' }] },
        { field_code: 'EMAIL', values: [{ value: 'teacher@example.com', enum_code: 'WORK' }] },
      ],
    })
    const cf = result.custom_fields_values ?? []
    expect(cf).toContainEqual({ field_id: 101, values: [{ enum_id: 1001 }] })
    expect(cf).toContainEqual({ field_id: 102, values: [{ enum_id: 2001 }] })
    expect(cf).toContainEqual({ field_id: 103, values: [{ value: 'Алматы' }] })
    expect(cf).toContainEqual({ field_id: 104, values: [{ value: '42' }] })
    // UTM-поля не найдены в аккаунте (fieldMap.utm нет) — по стандартным кодам
    expect(cf).toContainEqual({ field_code: 'UTM_SOURCE', values: [{ value: 'instagram' }] })
    expect(cf).toContainEqual({
      field_code: 'UTM_REFERRER',
      values: [{ value: 'https://l.instagram.com/' }],
    })
  })

  it('заявка от школы: цена × участники, без дополнительных полей по запросу', () => {
    const result = buildComplexLead({
      lead: {
        ...lead,
        type: 'school',
        organization: 'Лицей №1',
        contactPerson: 'Директор',
        participantsCount: 6,
        subjects: ['math', 'physics'],
      },
      event: { price: 50000 },
      settings: { fieldMap },
      withCustomFields: false,
    })
    expect(result.name).toBe('Заявка от школы — Лицей №1')
    expect(result.price).toBe(300000)
    expect(result.pipeline_id).toBeUndefined()
    expect(result.custom_fields_values).toBeUndefined()
    expect(result._embedded?.tags).toEqual([
      { name: 'Заявка от школы' },
      { name: 'Математика' },
      { name: 'Физика' },
    ])
  })

  it('примечание содержит полный текст заявки', () => {
    const note = buildLeadNote({
      lead,
      event: { title: 'XII конкурс' },
      landingSlug: 'contest-2026',
    })
    expect(note).toContain('Заявка с сайта №42 — Регистрация')
    expect(note).toContain('Телефон (WhatsApp): +7 701 123 45 67')
    expect(note).toContain('Регион: Алматы')
    expect(note).toContain('Стаж: 5–15 лет')
    expect(note).toContain('utm_source=instagram')
  })
})

describe('amoCRM: клиент API v4', () => {
  it('POST /api/v4/leads/complex с Bearer-токеном', async () => {
    const { fetch, calls } = mockFetch([
      {
        status: 200,
        body: [{ id: 555, contact_id: 777, company_id: null, merged: false, request_id: ['42'] }],
      },
    ])
    const result = await client(fetch).createLeadComplex({ name: 'x' })
    expect(result).toMatchObject({ id: 555, contact_id: 777 })
    expect(calls[0].url).toMatch(/^https:\/\/t\d+\.amocrm\.ru\/api\/v4\/leads\/complex$/)
    expect(calls[0].init.method).toBe('POST')
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer token')
    expect(JSON.parse(String(calls[0].init.body))).toEqual([{ name: 'x' }])
  })

  it('429 — ждёт и повторяет', async () => {
    const { fetch, calls } = mockFetch([
      { status: 429, headers: { 'retry-after': '2' } },
      {
        status: 200,
        body: [{ id: 1, contact_id: null, company_id: null, merged: false, request_id: ['1'] }],
      },
    ])
    sleep.mockClear()
    await client(fetch).createLeadComplex({ name: 'x' })
    expect(calls).toHaveLength(2)
    expect(sleep).toHaveBeenCalledWith(2000)
  })

  it('5xx на POST не повторяет внутри клиента (сделка могла создаться) — ошибка с повтором в очереди', async () => {
    const { fetch, calls } = mockFetch([{ status: 502, body: { title: 'Bad Gateway' } }])
    const err = await client(fetch)
      .createLeadComplex({ name: 'x' })
      .catch((e) => e)
    expect(err).toBeInstanceOf(AmoError)
    expect(err.retriable).toBe(true)
    expect(err.status).toBe(502)
    expect(calls).toHaveLength(1)
  })

  it('5xx на GET повторяет', async () => {
    const { fetch, calls } = mockFetch([
      { status: 503 },
      { status: 200, body: { id: 1, name: 'Ассоциация', subdomain: 'school' } },
    ])
    const account = await client(fetch).getAccount()
    expect(account?.subdomain).toBe('school')
    expect(calls).toHaveLength(2)
  })

  it('401 — понятная ошибка про токен', async () => {
    const { fetch } = mockFetch([{ status: 401, body: { title: 'Unauthorized' } }])
    const err = await client(fetch)
      .getAccount()
      .catch((e) => e)
    expect(err).toBeInstanceOf(AmoError)
    expect(err.message).toContain('токен')
  })

  it('400 — ошибка без повтора, с деталями валидации', async () => {
    const { fetch } = mockFetch([
      {
        status: 400,
        body: {
          title: 'Bad Request',
          'validation-errors': [
            { errors: [{ path: 'custom_fields_values.0.field_id', detail: 'Field not found' }] },
          ],
        },
      },
    ])
    const err = await client(fetch)
      .createLeadComplex({ name: 'x' })
      .catch((e) => e)
    expect(err.retriable).toBe(false)
    expect(err.message).toContain('custom_fields_values.0.field_id: Field not found')
  })

  it('204 — пустой список полей', async () => {
    const { fetch } = mockFetch([{ status: 204 }])
    expect(await client(fetch).getLeadCustomFields()).toEqual([])
  })

  it('«Создать поля»: находит существующие, создаёт недостающие, запоминает id и варианты', async () => {
    const { fetch, calls } = mockFetch([
      {
        status: 200,
        body: {
          _page_count: 1,
          _embedded: {
            custom_fields: [
              {
                id: 11,
                name: 'Регион',
                code: 'QMMQ_REGION',
                type: 'select',
                enums: [{ id: 1, value: 'Алматы', code: 'almaty' }],
              },
              { id: 12, name: 'utm_source', code: 'UTM_SOURCE', type: 'tracking_data' },
            ],
          },
        },
      },
      {
        status: 200,
        body: {
          _embedded: {
            custom_fields: [
              {
                id: 21,
                name: 'Предмет',
                code: 'QMMQ_SUBJECTS',
                type: 'multiselect',
                enums: [{ id: 5, value: 'Математика', code: 'math' }],
              },
              { id: 22, name: 'Город', code: 'QMMQ_CITY', type: 'text' },
            ],
          },
        },
      },
    ])
    const result = await setupLeadFields(client(fetch))
    expect(result.fieldMap.fields?.region).toEqual({ id: 11, enums: { almaty: 1 } })
    expect(result.fieldMap.fields?.subjects).toEqual({ id: 21, enums: { math: 5 } })
    expect(result.fieldMap.fields?.city).toEqual({ id: 22, enums: undefined })
    expect(result.fieldMap.utm).toEqual({ utmSource: 12 })
    expect(result.existing).toEqual(['Регион'])
    const created = JSON.parse(String(calls[1].init.body)) as Array<{
      code: string
      enums?: unknown[]
    }>
    expect(calls[1].url).toContain('/api/v4/leads/custom_fields')
    expect(created.map((f) => f.code)).not.toContain('QMMQ_REGION')
    expect(created.find((f) => f.code === 'QMMQ_SUBJECTS')?.enums).toHaveLength(3)
  })
})

describe('amoCRM: вебхук', () => {
  it('разбирает form-urlencoded смену этапа', () => {
    const body =
      'leads%5Bstatus%5D%5B0%5D%5Bid%5D=555&leads%5Bstatus%5D%5B0%5D%5Bstatus_id%5D=142' +
      '&leads%5Bstatus%5D%5B0%5D%5Bpipeline_id%5D=7&leads%5Bstatus%5D%5B0%5D%5Bold_status_id%5D=70' +
      '&account%5Bsubdomain%5D=school'
    expect(parseAmoWebhook(body)).toEqual([
      { leadId: 555, statusId: 142, pipelineId: 7, oldStatusId: 70, event: 'status' },
    ])
  })

  it('пустое или чужое тело — без изменений', () => {
    expect(parseAmoWebhook('')).toEqual([])
    expect(parseAmoWebhook('contacts[add][0][id]=1')).toEqual([])
  })
})

describe('формы', () => {
  it('нормализует телефон', () => {
    expect(normalizePhone('8 (701) 123-45-67')).toBe('+77011234567')
    expect(normalizePhone('+7 701 123 45 67')).toBe('+77011234567')
    expect(normalizePhone('7011234567')).toBe('+77011234567')
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('+7 916 123 45 67')).toBeNull()
    expect(normalizePhone('701123456')).toBeNull()
  })

  it('регистрация: ключи ошибок', () => {
    const r = registrationSchema.safeParse({
      fullName: 'Я',
      subject: 'chemistry',
      phone: '123',
      email: 'x',
      consent: false,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(fieldErrors(r.error)).toMatchObject({
        fullName: 'too_short',
        subject: 'invalid_option',
        region: 'invalid_option',
        city: 'required',
        phone: 'invalid_phone',
        email: 'invalid_email',
        consent: 'consent_required',
      })
    }
  })

  it('школа: число участников и предметы', () => {
    const r = schoolSchema.safeParse({
      organization: 'Лицей №1',
      contactPerson: 'Директор',
      phone: '87011234567',
      participantsCount: '6',
      subjects: ['math', 'math', 'physics'],
      consent: true,
    })
    expect(r.success && r.data).toMatchObject({
      phone: '+77011234567',
      participantsCount: 6,
      subjects: ['math', 'physics'],
    })
  })
})

describe('amoCRM: отправка заявки (очередь)', () => {
  const settings = {
    enabled: true,
    baseUrl: 'https://sync.amocrm.ru',
    accessToken: 't',
    pipelineId: 7,
    newStatusId: 70,
    paidStatusIds: [142],
    fieldMap: fieldMap,
    webhookSecret: 's',
    pipelines: [],
  }

  function stubPayload(amo: Record<string, unknown> = {}) {
    const updates: Array<Record<string, unknown>> = []
    const doc = {
      ...lead,
      amo: { attempts: 0, ...amo } as Record<string, unknown>,
      event: { id: 1, price: 50000 },
      landing: { id: 1, slug: 'contest-2026' },
    }
    const payload = {
      findByID: async () => doc,
      update: async ({ data }: { data: { amo: Record<string, unknown> } }) => {
        updates.push(data.amo)
        Object.assign(doc.amo, data.amo)
        return doc
      },
    }
    return { payload: payload as never, updates, doc }
  }

  it('успех: сделка, примечание, статус sent', async () => {
    const { syncLeadToAmo } = await import('@/lib/amocrm/sync')
    const { payload, doc } = stubPayload()
    const { fetch, calls } = mockFetch([
      {
        status: 200,
        body: [{ id: 555, contact_id: 777, company_id: null, merged: false, request_id: ['42'] }],
      },
      { status: 200, body: {} },
    ])
    const result = await syncLeadToAmo(payload, 42, {
      isLastAttempt: false,
      settings,
      client: client(fetch),
    })
    expect(result).toBe('sent')
    expect(doc.amo).toMatchObject({
      syncStatus: 'sent',
      leadId: 555,
      contactId: 777,
      attempts: 1,
      lastError: null,
    })
    expect(calls[1].url).toContain('/api/v4/leads/555/notes')
  })

  it('временная ошибка: pending и исключение (повтор в очереди); на последней попытке — failed', async () => {
    const { syncLeadToAmo } = await import('@/lib/amocrm/sync')
    const first = stubPayload()
    const { fetch } = mockFetch([{ status: 503 }])
    await expect(
      syncLeadToAmo(first.payload, 42, { isLastAttempt: false, settings, client: client(fetch) }),
    ).rejects.toBeInstanceOf(AmoError)
    expect(first.doc.amo).toMatchObject({ syncStatus: 'pending', attempts: 1 })

    const last = stubPayload({ attempts: 8 })
    const f2 = mockFetch([{ status: 503 }])
    const result = await syncLeadToAmo(last.payload, 42, {
      isLastAttempt: true,
      settings,
      client: client(f2.fetch),
    })
    expect(result).toBe('failed')
    expect(last.doc.amo).toMatchObject({ syncStatus: 'failed', attempts: 9 })
  })

  it('сделка уже создана — повтор только добавляет примечание, без дубля', async () => {
    const { syncLeadToAmo } = await import('@/lib/amocrm/sync')
    const { payload, doc } = stubPayload({ leadId: 555, syncStatus: 'pending', attempts: 1 })
    const { fetch, calls } = mockFetch([{ status: 200, body: {} }])
    expect(
      await syncLeadToAmo(payload, 42, { isLastAttempt: false, settings, client: client(fetch) }),
    ).toBe('sent')
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain('/leads/555/notes')
    expect(doc.amo.syncStatus).toBe('sent')
  })

  it('amoCRM отклонила поля (400) — сделка без полей и предупреждение', async () => {
    const { syncLeadToAmo } = await import('@/lib/amocrm/sync')
    const { payload, doc } = stubPayload()
    const { fetch, calls } = mockFetch([
      { status: 400, body: { title: 'Bad Request' } },
      {
        status: 200,
        body: [{ id: 556, contact_id: 778, company_id: null, merged: false, request_id: ['42'] }],
      },
      { status: 200, body: {} },
    ])
    expect(
      await syncLeadToAmo(payload, 42, { isLastAttempt: false, settings, client: client(fetch) }),
    ).toBe('sent')
    expect(JSON.parse(String(calls[1].init.body))[0].custom_fields_values).toBeUndefined()
    expect(String(doc.amo.lastError)).toContain('без дополнительных полей')
  })

  it('интеграция выключена — disabled, без запросов', async () => {
    const { syncLeadToAmo } = await import('@/lib/amocrm/sync')
    const { payload, doc } = stubPayload()
    const { fetch, calls } = mockFetch([])
    const result = await syncLeadToAmo(payload, 42, {
      isLastAttempt: false,
      settings: { ...settings, enabled: false },
      client: client(fetch),
    })
    expect(result).toBe('disabled')
    expect(calls).toHaveLength(0)
    expect(doc.amo.syncStatus).toBe('disabled')
  })
})

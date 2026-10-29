// @vitest-environment node
import { createHash } from 'node:crypto'

import type { Payload } from 'payload'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  fieldErrors,
  registrationSchema,
  registrationStep1Schema,
  registrationStep2Schema,
} from '@/lib/forms/schemas'
import {
  COMPLETION_TTL_MS,
  handleFormCompletion,
  handleFormSubmission,
  resetFormRateLimits,
} from '@/lib/forms/submit'

// Регистрация в два шага: схемы и серверные обработчики на заглушке Payload (без базы).

type Doc = Record<string, unknown> & { id: number }

function fakePayload(opts: { deadline?: string | null; amoEnabled?: boolean } = {}) {
  const leads = new Map<number, Doc>()
  const jobs: number[] = []
  let nextId = 1
  const landing: Doc = {
    id: 10,
    slug: 'contest-2026',
    event: 20,
    forms: { howHeardOptions: [{ label: { ru: 'Instagram', kk: 'Instagram' } }] },
  }
  const event: Doc = {
    id: 20,
    title: 'XII конкурс',
    registrationDeadline: opts.deadline === undefined ? '2099-01-01T00:00:00.000Z' : opts.deadline,
    regulationsPdf: null,
  }
  const payload = {
    logger: { info() {}, error() {}, warn() {} },
    async find({ collection, where }: { collection: string; where?: Record<string, unknown> }) {
      if (collection === 'landings') {
        const slug = (where?.slug as { equals?: string })?.equals
        return { docs: slug === landing.slug ? [landing] : [] }
      }
      if (collection === 'payload-jobs') return { docs: [] }
      return { docs: [] }
    },
    async findByID({ collection, id }: { collection: string; id: number }) {
      if (collection === 'events') return id === event.id ? event : null
      if (collection === 'landings') return id === landing.id ? landing : null
      if (collection === 'leads') return leads.get(Number(id)) ?? null
      return null
    },
    async findGlobal() {
      return opts.amoEnabled
        ? { amocrm: { enabled: true, baseUrl: 'https://x.amocrm.ru', accessToken: 'token' } }
        : { amocrm: { enabled: false } }
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const doc: Doc = { ...data, id: nextId++, createdAt: new Date().toISOString() }
      leads.set(doc.id, doc)
      return doc
    },
    async update({ id, data }: { id: number; data: Record<string, unknown> }) {
      const doc = leads.get(Number(id))!
      // Как Payload: группа (amo, payment) обновляется по полям, остальные поля группы остаются.
      for (const [key, value] of Object.entries(data)) {
        const prev = doc[key]
        doc[key] =
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          prev &&
          typeof prev === 'object'
            ? { ...(prev as object), ...(value as object) }
            : value
      }
      return doc
    },
    async delete() {
      return { docs: [] }
    },
    async jobs() {},
  }
  // Очередь amoCRM: запоминаем, какие заявки ставились в очередь.
  ;(payload as unknown as { jobs: unknown }).jobs = {
    queue: async ({ input }: { input: { leadId: number } }) => {
      jobs.push(input.leadId)
      return { id: jobs.length }
    },
  }
  return { payload: payload as unknown as Payload, leads, jobs }
}

const started = () => Date.now() - 10_000

function post(
  payload: Payload,
  fields: Record<string, unknown>,
  extra: Record<string, unknown> = {},
  ip = '1.1.1.1',
) {
  return handleFormSubmission({
    payload,
    type: 'registration',
    ip,
    rawBody: JSON.stringify({
      landing: 'contest-2026',
      locale: 'ru',
      fields,
      hp: '',
      startedAt: started(),
      ...extra,
    }),
  })
}

function patch(
  payload: Payload,
  leadId: number | string,
  token: string,
  fields: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  return handleFormCompletion({
    payload,
    leadId: String(leadId),
    ip: '1.1.1.1',
    rawBody: JSON.stringify({
      token,
      locale: 'ru',
      fields,
      hp: '',
      startedAt: started(),
      ...extra,
    }),
  })
}

const step1 = {
  fullName: 'Иванова Айгерим',
  subject: 'math',
  phone: '+7 701 123 45 67',
  consent: true,
}
const step2 = {
  region: 'almaty',
  city: 'Алматы',
  school: 'Школа-лицей № 1',
  experience: '5to15',
  email: 'Teacher@Example.com',
  howHeard: 'instagram',
}

describe('схемы регистрации', () => {
  it('шаг 1 — контакт и согласие; шаг 2 — остальное; полная схема = объединение', () => {
    expect(registrationStep1Schema.safeParse(step1).success).toBe(true)
    expect(registrationStep2Schema.safeParse(step2).success).toBe(true)
    expect(registrationSchema.safeParse({ ...step1, ...step2 }).success).toBe(true)
    expect(Object.keys(registrationSchema.shape).sort()).toEqual(
      [
        ...Object.keys(registrationStep1Schema.shape),
        ...Object.keys(registrationStep2Schema.shape),
      ].sort(),
    )
  })

  it('шаг 1 не пропускает без согласия и с чужим номером; лишние поля игнорирует', () => {
    const noConsent = registrationStep1Schema.safeParse({ ...step1, consent: false })
    expect(noConsent.success).toBe(false)
    expect(fieldErrors(noConsent.error!)).toEqual({ consent: 'consent_required' })
    const badPhone = registrationStep1Schema.safeParse({ ...step1, phone: '+1 202 555 0100' })
    expect(fieldErrors(badPhone.error!)).toEqual({ phone: 'invalid_phone' })
    const ok = registrationStep1Schema.safeParse({ ...step1, ...step2 })
    expect(ok.success).toBe(true)
    expect(Object.keys(ok.data!)).toEqual(['fullName', 'subject', 'phone', 'consent'])
  })

  it('шаг 2 требует регион, город, школу и e-mail; стаж и источник необязательны', () => {
    const res = registrationStep2Schema.safeParse({ experience: '' })
    expect(res.success).toBe(false)
    expect(fieldErrors(res.error!)).toEqual({
      region: 'invalid_option',
      city: 'required',
      school: 'required',
      email: 'required',
    })
    const ok = registrationStep2Schema.safeParse({ ...step2, experience: '', howHeard: '' })
    expect(ok.success).toBe(true)
    expect(ok.data!.experience).toBeUndefined()
    expect(ok.data!.email).toBe('teacher@example.com')
  })
})

describe('API форм: регистрация в два шага', () => {
  beforeEach(() => resetFormRateLimits())

  it('шаг 1 сохраняет неполную заявку с хешем токена и ставит её в очередь amoCRM', async () => {
    const { payload, leads, jobs } = fakePayload({ amoEnabled: true })
    const res = await post(payload, step1, { step: 1 })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, leadId: 1, type: 'registration' })
    expect(typeof res.body.token).toBe('string')
    expect(res.body.redirect).toBeUndefined()

    const lead = leads.get(1)!
    expect(lead).toMatchObject({
      type: 'registration',
      fullName: 'Иванова Айгерим',
      subject: 'math',
      phone: '+77011234567',
      consent: true,
      incomplete: true,
    })
    expect(lead.region).toBeUndefined()
    expect(lead.completeToken).toBe(
      createHash('sha256')
        .update(res.body.token as string)
        .digest('hex'),
    )
    expect(lead.amo).toMatchObject({ syncStatus: 'pending' })
    expect(jobs).toEqual([1])
  })

  it('шаг 2 дополняет заявку, снимает отметку, гасит токен и повторно ставит в очередь', async () => {
    const { payload, leads, jobs } = fakePayload({ amoEnabled: true })
    const first = await post(payload, step1, { step: 1 })
    const token = first.body.token as string
    // Как будто сделка уже создана после первого шага.
    Object.assign(leads.get(1)!.amo as object, { syncStatus: 'sent', leadId: 555 })

    const res = await patch(payload, 1, token, step2)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, leadId: 1, redirect: '/spasibo' })

    const lead = leads.get(1)!
    expect(lead).toMatchObject({
      incomplete: false,
      completeToken: null,
      region: 'almaty',
      city: 'Алматы',
      school: 'Школа-лицей № 1',
      experience: '5to15',
      email: 'teacher@example.com',
      howHeard: 'Instagram',
    })
    expect(lead.amo).toMatchObject({ syncStatus: 'pending', leadId: 555 })
    expect(jobs).toEqual([1, 1])

    // Токен одноразовый.
    const again = await patch(payload, 1, token, step2)
    expect(again.status).toBe(403)
    expect(again.body).toEqual({ ok: false, error: 'invalid_token' })
  })

  it('шаг 2 отклоняет чужой токен, несуществующую и просроченную заявку', async () => {
    const { payload, leads } = fakePayload()
    const first = await post(payload, step1, { step: 1 })
    const token = first.body.token as string

    expect((await patch(payload, 1, 'x'.repeat(32), step2)).status).toBe(403)
    expect((await patch(payload, 99, token, step2)).status).toBe(403)
    expect((await patch(payload, 'abc', token, step2)).status).toBe(404)
    expect(leads.get(1)!.incomplete).toBe(true)

    leads.get(1)!.createdAt = new Date(Date.now() - COMPLETION_TTL_MS - 1000).toISOString()
    expect((await patch(payload, 1, token, step2)).status).toBe(403)
  })

  it('шаг 2 возвращает ошибки полей и не трогает заявку', async () => {
    const { payload, leads } = fakePayload()
    const first = await post(payload, step1, { step: 1 })
    const res = await patch(payload, 1, first.body.token as string, { email: 'нет' })
    expect(res.status).toBe(400)
    expect(res.body.errors).toEqual({
      region: 'invalid_option',
      city: 'required',
      school: 'required',
      email: 'invalid_email',
    })
    expect(leads.get(1)!.incomplete).toBe(true)
  })

  it('одна форма (компьютер) сохраняет полную заявку без токена', async () => {
    const { payload, leads } = fakePayload()
    const res = await post(payload, { ...step1, ...step2 })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, leadId: 1, redirect: '/spasibo' })
    expect(res.body.token).toBeUndefined()
    expect(leads.get(1)).toMatchObject({ incomplete: false, email: 'teacher@example.com' })
    expect(leads.get(1)!.completeToken).toBeUndefined()
    // amoCRM не настроена — статус disabled.
    expect(leads.get(1)!.amo).toMatchObject({ syncStatus: 'disabled' })
  })

  it('шаг 1 без шага 2 — ошибки только по полям первого шага', async () => {
    const { payload } = fakePayload()
    const res = await post(payload, { fullName: 'Ив', consent: false }, { step: 1 })
    expect(res.status).toBe(400)
    expect(res.body.errors).toEqual({
      fullName: 'too_short',
      subject: 'invalid_option',
      phone: 'required',
      consent: 'consent_required',
    })
  })

  it('после дедлайна первый шаг сохраняется как лист ожидания, второй ведёт на его страницу', async () => {
    const { payload, leads } = fakePayload({ deadline: '2020-01-01T00:00:00.000Z' })
    const first = await post(payload, step1, { step: 1 })
    expect(first.body.type).toBe('waitlist')
    expect(leads.get(1)!.type).toBe('waitlist')
    const second = await patch(payload, 1, first.body.token as string, step2)
    expect(second.body.redirect).toBe('/spasibo?type=waitlist')
  })

  it('honeypot и слишком быстрая отправка', async () => {
    const { payload, leads } = fakePayload()
    const hp = await post(payload, step1, { step: 1, hp: 'spam' })
    expect(hp.status).toBe(200)
    expect(leads.size).toBe(0)
    const fast = await post(payload, step1, { step: 1, startedAt: Date.now() - 500 })
    expect(fast.status).toBe(400)
    expect(fast.body.error).toBe('too_fast')
    const first = await post(payload, step1, { step: 1 })
    const fast2 = await patch(payload, 1, first.body.token as string, step2, {
      startedAt: Date.now() - 500,
    })
    expect(fast2.status).toBe(400)
  })

  it('лимит частоты общий для обоих шагов', async () => {
    const { payload } = fakePayload()
    const first = await post(payload, step1, { step: 1 }, '9.9.9.9')
    for (let i = 0; i < 4; i++) await post(payload, step1, { step: 1 }, '9.9.9.9')
    const res = await handleFormCompletion({
      payload,
      leadId: '1',
      ip: '9.9.9.9',
      rawBody: JSON.stringify({
        token: first.body.token,
        locale: 'ru',
        fields: step2,
        startedAt: started(),
      }),
    })
    expect(res.status).toBe(429)
  })
})

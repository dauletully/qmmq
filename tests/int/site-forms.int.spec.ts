import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetSiteFormRateLimits } from '@/lib/forms/site'
import { handleFormSubmission } from '@/lib/forms/submit'
import config from '@/payload.config'

// Формы сайта через общий вход POST /api/forms/:type (handleFormSubmission делегирует в site.ts).
// Пишет в базу из DATABASE_URL — созданные записи удаляются в afterAll.

let payload: Payload
const stamp = Date.now()
const createdLeads: number[] = []
const createdSubscribers: number[] = []
let ipCounter = 0

type Fields = Record<string, unknown>

function envelope(fields: Fields, extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    locale: 'ru',
    fields,
    path: '/community/join',
    startedAt: Date.now() - 10_000,
    hp: '',
    attribution: { utmSource: 'test', landingPath: '/community/join' },
    ...extra,
  })
}

async function submit(type: string, fields: Fields, extra: Record<string, unknown> = {}, ip?: string) {
  const result = await handleFormSubmission({
    payload,
    type,
    rawBody: envelope(fields, extra),
    ip: ip ?? `test-ip-${++ipCounter}`,
  })
  if (typeof result.body.leadId === 'number') createdLeads.push(result.body.leadId)
  if (typeof result.body.subscriberId === 'number') createdSubscribers.push(result.body.subscriberId)
  return result
}

const person = {
  fullName: 'Тестовый Учитель',
  subject: 'math',
  region: 'almaty',
  school: 'Школа № 1',
  phone: '+7 701 123 45 67',
  email: `teacher-${stamp}@example.com`,
  consent: true,
}

describe('Формы сайта', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  beforeEach(() => {
    resetSiteFormRateLimits()
  })

  afterAll(async () => {
    if (createdLeads.length) {
      await payload.delete({
        collection: 'leads',
        where: { id: { in: createdLeads } },
        overrideAccess: true,
      })
    }
    if (createdSubscribers.length) {
      await payload.delete({
        collection: 'subscribers',
        where: { id: { in: createdSubscribers } },
        overrideAccess: true,
      })
    }
  })

  it('неизвестный тип формы — 404', async () => {
    const res = await submit('newsletter', {})
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('unknown_form')
  })

  it('community: заявка сохраняется с типом community и отметкой «хочу в каталог»', async () => {
    const res = await submit('community', { ...person, wantsCatalog: 'on' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    const lead = await payload.findByID({
      collection: 'leads',
      id: res.body.leadId as number,
      depth: 0,
      overrideAccess: true,
    })
    expect(lead.type).toBe('community')
    expect(lead.fullName).toBe(person.fullName)
    expect(lead.phone).toBe('+77011234567')
    expect(lead.email).toBe(person.email)
    expect(lead.wantsCatalog).toBe(true)
    expect(lead.sourcePath).toBe('/community/join')
    expect(lead.consent).toBe(true)
    expect(lead.displayName).toBe(person.fullName)
    // amoCRM не настроена в тестовой базе — disabled; настроена — pending. Но не skipped.
    expect(['pending', 'disabled']).toContain(lead.amo?.syncStatus)
    expect(lead.attribution?.utmSource).toBe('test')
  })

  it('community: ошибки валидации возвращаются ключами по полям', async () => {
    const res = await submit('community', { ...person, phone: '12345', consent: false })
    expect(res.status).toBe(400)
    const errors = res.body.errors as Record<string, string>
    expect(errors.phone).toBe('invalid_phone')
    expect(errors.consent).toBe('consent_required')
  })

  it('speaker: сохраняются роль, тема и стаж', async () => {
    const res = await submit('speaker', {
      ...person,
      speakerRole: 'jury',
      topic: 'Комбинаторика в школьной олимпиаде',
      experience: 'gt15',
      message: 'Готов проверять работы',
    })
    expect(res.status).toBe(200)
    const lead = await payload.findByID({
      collection: 'leads',
      id: res.body.leadId as number,
      depth: 0,
      overrideAccess: true,
    })
    expect(lead.type).toBe('speaker')
    expect(lead.speakerRole).toBe('jury')
    expect(lead.topic).toBe('Комбинаторика в школьной олимпиаде')
    expect(lead.experience).toBe('gt15')
    expect(lead.message).toBe('Готов проверять работы')
  })

  it('partner: в заголовке заявки — организация, формат сохраняется', async () => {
    const res = await submit('partner', {
      organization: 'ТОО «Тест»',
      contactPerson: 'Иван Петров',
      partnerFormat: 'sponsor',
      phone: '+7 701 123 45 68',
      email: `partner-${stamp}@example.com`,
      consent: true,
    })
    expect(res.status).toBe(200)
    const lead = await payload.findByID({
      collection: 'leads',
      id: res.body.leadId as number,
      depth: 0,
      overrideAccess: true,
    })
    expect(lead.type).toBe('partner')
    expect(lead.displayName).toBe('ТОО «Тест»')
    expect(lead.partnerFormat).toBe('sponsor')
    expect(['pending', 'disabled']).toContain(lead.amo?.syncStatus)
  })

  it('feedback: сохраняется, в amoCRM не уходит (skipped), телефон не обязателен', async () => {
    const res = await submit('feedback', {
      fullName: 'Айгуль',
      email: `feedback-${stamp}@example.com`,
      message: 'Подскажите, где посмотреть задачи прошлого года?',
      consent: true,
    })
    expect(res.status).toBe(200)
    const lead = await payload.findByID({
      collection: 'leads',
      id: res.body.leadId as number,
      depth: 0,
      overrideAccess: true,
    })
    expect(lead.type).toBe('feedback')
    expect(lead.phone ?? null).toBeNull()
    expect(lead.amo?.syncStatus).toBe('skipped')
  })

  it('subscribe: подписчик создаётся один раз, повтор обновляет предмет и регион', async () => {
    const email = `subscriber-${stamp}@example.com`
    const first = await submit('subscribe', { email, subject: 'math', consent: true }, { path: '/' })
    expect(first.status).toBe(200)
    const second = await submit(
      'subscribe',
      { email: email.toUpperCase(), subject: 'physics', region: 'astana', consent: true },
      { path: '/news' },
    )
    expect(second.status).toBe(200)
    expect(second.body.subscriberId).toBe(first.body.subscriberId)
    const sub = await payload.findByID({
      collection: 'subscribers',
      id: first.body.subscriberId as number,
      depth: 0,
      overrideAccess: true,
    })
    expect(sub.email).toBe(email)
    expect(sub.subject).toBe('physics')
    expect(sub.region).toBe('astana')
    expect(sub.active).toBe(true)
    expect(sub.source).toBe('/news')
    // Подписка не создаёт заявку в leads
    const leads = await payload.count({
      collection: 'leads',
      where: { email: { equals: email } },
      overrideAccess: true,
    })
    expect(leads.totalDocs).toBe(0)
  })

  it('subscribe: без согласия — 400', async () => {
    const res = await submit('subscribe', { email: `nc-${stamp}@example.com` })
    expect(res.status).toBe(400)
    expect((res.body.errors as Record<string, string>).consent).toBe('consent_required')
  })

  it('слишком быстрая отправка отклоняется', async () => {
    const res = await submit('community', person, { startedAt: Date.now() })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('too_fast')
  })

  it('honeypot: ответ ok, заявка не сохраняется', async () => {
    const email = `hp-${stamp}@example.com`
    const res = await submit('community', { ...person, email }, { hp: 'bot' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.leadId).toBeUndefined()
    const count = await payload.count({
      collection: 'leads',
      where: { email: { equals: email } },
      overrideAccess: true,
    })
    expect(count.totalDocs).toBe(0)
  })

  it('лимит отправок с одного IP', async () => {
    const ip = `burst-${stamp}`
    for (let i = 0; i < 5; i++) {
      const res = await submit('feedback', { fullName: 'A', email: 'x' }, {}, ip)
      expect(res.status).toBe(400)
    }
    const res = await submit('feedback', { fullName: 'A', email: 'x' }, {}, ip)
    expect(res.status).toBe(429)
    expect(res.body.error).toBe('rate_limited')
  })
})

import { createHash, randomBytes } from 'node:crypto'

import type { Payload } from 'payload'

import type { Lead } from '../../payload-types'
import { queueLeadSync } from '../amocrm/sync'
import type { FormType, Locale } from '../constants'
import { amoDisabledReason, getAmoSettings } from '../integrations'
import { createRateLimiter } from '../rateLimit'
import {
  completionEnvelopeSchema,
  envelopeSchema,
  fieldErrors,
  formSchemas,
  isFormType,
  registrationStep1Schema,
  registrationStep2Schema,
  type RegistrationData,
  type RegistrationStep1Data,
  type RegistrationStep2Data,
  type RegulationsData,
  type SchoolData,
} from './schemas'
import { handleSiteFormSubmission, isSiteFormType } from './site'

// Серверная обработка POST /api/forms/:type и PATCH /api/forms/registration/:id.
// Не импортировать на клиенте.

export const MIN_FILL_MS = 3000
export const MAX_BODY_BYTES = 20_000
// Сколько живёт токен второго шага: заявку можно дополнить в течение суток.
export const COMPLETION_TTL_MS = 24 * 60 * 60_000

// На один IP: не больше 5 отправок за 30 секунд и 20 за 10 минут
// (учителя одной школы могут сидеть за одним IP).
const burstLimiter = createRateLimiter({ windowMs: 30_000, max: 5 })
const windowLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 20 })

export function resetFormRateLimits() {
  burstLimiter.reset()
  windowLimiter.reset()
}

export type FormResult = { status: number; body: Record<string, unknown> }

function thankYouPath(locale: Locale, type: Lead['type']): string {
  const base = locale === 'kk' ? '/kz/spasibo' : '/spasibo'
  return type === 'registration' ? base : `${base}?type=${type}`
}

function relId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return null
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

type LocalizedLabel = string | Partial<Record<Locale, string | null>> | null | undefined
type HowHeardOptions = Array<{ label?: LocalizedLabel }>

// Вариант «Как узнали» сохраняем русской подписью, даже если форма была на казахском.
function canonicalHowHeard(value: string | undefined, options: HowHeardOptions) {
  if (!value) return undefined
  const needle = value.trim().toLowerCase()
  for (const option of options) {
    const label = option.label
    if (!label) continue
    const variants = typeof label === 'string' ? [label] : Object.values(label)
    if (variants.some((v) => v?.trim().toLowerCase() === needle)) {
      return (typeof label === 'string' ? label : label.ru) || value
    }
  }
  return value
}

function isHoneypotFilled(hp: unknown): boolean {
  return typeof hp === 'string' ? hp.trim() !== '' : hp !== undefined && hp !== null && hp !== false
}

// Слишком быстро после открытия формы. Отрицательная разница — часы клиента спешат, пропускаем.
function isTooFast(startedAt: number | undefined, now: number): boolean {
  const elapsed = typeof startedAt === 'number' ? now - startedAt : NaN
  return Number.isNaN(elapsed) || (elapsed >= 0 && elapsed < MIN_FILL_MS)
}

function step2Fields(f: RegistrationStep2Data, howHeardOptions: HowHeardOptions): Partial<Lead> {
  return {
    region: f.region,
    city: f.city,
    school: f.school,
    experience: f.experience,
    email: f.email,
    howHeard: canonicalHowHeard(f.howHeard, howHeardOptions),
  }
}

// Если amoCRM не настроена — заявка сохраняется со статусом disabled и уйдёт позже.
async function amoStatus(payload: Payload): Promise<string | null> {
  try {
    return amoDisabledReason(await getAmoSettings(payload))
  } catch (err) {
    payload.logger.error({ err, msg: 'forms: не удалось прочитать настройки amoCRM' })
    return 'Не удалось прочитать настройки amoCRM'
  }
}

// Только постановка в очередь (запись в базу) — amoCRM форма не ждёт.
async function enqueue(payload: Payload, leadId: number) {
  try {
    await queueLeadSync(payload, [leadId])
  } catch (err) {
    payload.logger.error({ err, msg: 'forms: не удалось поставить заявку в очередь amoCRM' })
    await payload
      .update({
        collection: 'leads',
        id: leadId,
        data: {
          amo: {
            syncStatus: 'failed',
            lastError:
              'Не удалось поставить в очередь отправки — нажмите «Отправить в amoCRM повторно»',
          },
        },
        overrideAccess: true,
        context: { system: true },
      })
      .catch(() => undefined)
  }
}

export async function handleFormSubmission(args: {
  payload: Payload
  type: string | undefined
  rawBody: string
  ip: string
  now?: number
}): Promise<FormResult> {
  const { payload, type, rawBody, ip } = args
  const now = args.now ?? Date.now()

  // Формы сайта (community, speaker, partner, feedback, subscribe) — свой обработчик.
  if (isSiteFormType(type)) return handleSiteFormSubmission(args)

  if (!isFormType(type)) return { status: 404, body: { ok: false, error: 'unknown_form' } }

  if (!burstLimiter.hit(ip, now) || !windowLimiter.hit(ip, now)) {
    return { status: 429, body: { ok: false, error: 'rate_limited' } }
  }

  if (rawBody.length > MAX_BODY_BYTES) {
    return { status: 413, body: { ok: false, error: 'too_large' } }
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return { status: 400, body: { ok: false, error: 'invalid_request' } }
  }
  const envelope = envelopeSchema.safeParse(json)
  if (!envelope.success) return { status: 400, body: { ok: false, error: 'invalid_request' } }
  const { landing: landingSlug, locale, fields, attribution, hp, startedAt } = envelope.data
  const step1 = type === 'registration' && envelope.data.step === 1

  // Honeypot заполнен — делаем вид, что всё хорошо, но ничего не сохраняем.
  if (isHoneypotFilled(hp)) {
    payload.logger.info({ msg: 'forms: honeypot', type, ip })
    if (type === 'regulations') return { status: 200, body: { ok: true, pdfUrl: null } }
    if (step1) return { status: 200, body: { ok: true, leadId: 0, token: hashToken(String(now)) } }
    return { status: 200, body: { ok: true, redirect: thankYouPath(locale, 'registration') } }
  }

  if (isTooFast(startedAt, now)) return { status: 400, body: { ok: false, error: 'too_fast' } }

  const schema = step1 ? registrationStep1Schema : formSchemas[type as FormType]
  const parsed = schema.safeParse(fields)
  if (!parsed.success) {
    return { status: 400, body: { ok: false, errors: fieldErrors(parsed.error) } }
  }

  const landings = await payload.find({
    collection: 'landings',
    where: { slug: { equals: landingSlug } },
    locale: 'all',
    depth: 0,
    limit: 1,
    select: { slug: true, event: true, forms: true },
    overrideAccess: true,
  })
  const landing = landings.docs[0]
  if (!landing) return { status: 400, body: { ok: false, error: 'unknown_landing' } }

  const eventId = relId(landing.event)
  const event = eventId
    ? await payload.findByID({
        collection: 'events',
        id: eventId,
        depth: 1,
        locale,
        select: { title: true, registrationDeadline: true, regulationsPdf: true },
        overrideAccess: true,
        disableErrors: true,
      })
    : null

  let leadType: Lead['type'] = type
  if (
    type === 'registration' &&
    event?.registrationDeadline &&
    new Date(event.registrationDeadline).getTime() < now
  ) {
    leadType = 'waitlist'
  }

  const nowIso = new Date(now).toISOString()
  const data: Partial<Lead> & Pick<Lead, 'type'> = {
    type: leadType,
    event: eventId ?? undefined,
    landing: landing.id,
    locale,
    consent: true,
    consentAt: nowIso,
    attribution: attribution ?? {},
    incomplete: false,
  }

  // Токен второго шага возвращается клиенту один раз; в базе — только его хеш.
  let token: string | null = null

  if (type === 'school') {
    const f = parsed.data as SchoolData
    Object.assign(data, {
      organization: f.organization,
      contactPerson: f.contactPerson,
      phone: f.phone,
      participantsCount: f.participantsCount,
      subjects: f.subjects,
    })
  } else if (type === 'regulations') {
    const f = parsed.data as RegulationsData
    Object.assign(data, { fullName: f.fullName, phone: f.phone, email: f.email })
  } else if (step1) {
    const f = parsed.data as RegistrationStep1Data
    token = randomBytes(24).toString('base64url')
    Object.assign(data, {
      fullName: f.fullName,
      subject: f.subject,
      phone: f.phone,
      incomplete: true,
      completeToken: hashToken(token),
    })
  } else {
    const f = parsed.data as RegistrationData
    Object.assign(data, {
      fullName: f.fullName,
      subject: f.subject,
      phone: f.phone,
      ...step2Fields(f, (landing.forms?.howHeardOptions ?? []) as HowHeardOptions),
    })
  }

  const disabledReason = await amoStatus(payload)
  data.amo = disabledReason
    ? { syncStatus: 'disabled', lastError: disabledReason, attempts: 0 }
    : { syncStatus: 'pending', attempts: 0 }

  const lead = await payload.create({
    collection: 'leads',
    data: data as Lead,
    depth: 0,
    overrideAccess: true,
    context: { system: true },
  })

  if (!disabledReason) await enqueue(payload, lead.id)

  if (type === 'regulations') {
    const pdf = event?.regulationsPdf
    const pdfUrl = pdf && typeof pdf === 'object' ? (pdf.url ?? null) : null
    return { status: 200, body: { ok: true, leadId: lead.id, pdfUrl } }
  }
  if (step1) {
    return { status: 200, body: { ok: true, leadId: lead.id, type: leadType, token } }
  }
  return {
    status: 200,
    body: { ok: true, leadId: lead.id, type: leadType, redirect: thankYouPath(locale, leadType) },
  }
}

// Второй шаг регистрации: дополняет заявку, созданную первым шагом. Токен одноразовый.
export async function handleFormCompletion(args: {
  payload: Payload
  leadId: string | undefined
  rawBody: string
  ip: string
  now?: number
}): Promise<FormResult> {
  const { payload, rawBody, ip } = args
  const now = args.now ?? Date.now()
  const id = Number(args.leadId)

  if (!Number.isInteger(id) || id <= 0) {
    return { status: 404, body: { ok: false, error: 'unknown_lead' } }
  }
  if (!burstLimiter.hit(ip, now) || !windowLimiter.hit(ip, now)) {
    return { status: 429, body: { ok: false, error: 'rate_limited' } }
  }
  if (rawBody.length > MAX_BODY_BYTES) {
    return { status: 413, body: { ok: false, error: 'too_large' } }
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return { status: 400, body: { ok: false, error: 'invalid_request' } }
  }
  const envelope = completionEnvelopeSchema.safeParse(json)
  if (!envelope.success) return { status: 400, body: { ok: false, error: 'invalid_request' } }
  const { token, locale, fields, hp, startedAt } = envelope.data

  if (isHoneypotFilled(hp)) {
    payload.logger.info({ msg: 'forms: honeypot (step 2)', ip })
    return { status: 200, body: { ok: true, redirect: thankYouPath(locale, 'registration') } }
  }
  if (isTooFast(startedAt, now)) return { status: 400, body: { ok: false, error: 'too_fast' } }

  const parsed = registrationStep2Schema.safeParse(fields)
  if (!parsed.success) {
    return { status: 400, body: { ok: false, errors: fieldErrors(parsed.error) } }
  }

  const lead = await payload.findByID({
    collection: 'leads',
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  const fresh = lead && now - new Date(lead.createdAt).getTime() < COMPLETION_TTL_MS
  if (
    !lead ||
    !fresh ||
    !lead.incomplete ||
    !lead.completeToken ||
    (lead.type !== 'registration' && lead.type !== 'waitlist') ||
    lead.completeToken !== hashToken(token)
  ) {
    return { status: 403, body: { ok: false, error: 'invalid_token' } }
  }

  const landingId = relId(lead.landing)
  const landing = landingId
    ? await payload.findByID({
        collection: 'landings',
        id: landingId,
        locale: 'all',
        depth: 0,
        select: { forms: true },
        overrideAccess: true,
        disableErrors: true,
      })
    : null

  const data: Partial<Lead> = {
    ...step2Fields(parsed.data, (landing?.forms?.howHeardOptions ?? []) as HowHeardOptions),
    incomplete: false,
    completeToken: null,
  }
  // Сделка уже создана после первого шага — очередь добавит к ней примечание с полной заявкой.
  const resend = lead.amo?.syncStatus !== 'disabled'
  if (resend) data.amo = { ...lead.amo, syncStatus: 'pending' }

  await payload.update({
    collection: 'leads',
    id,
    data,
    depth: 0,
    overrideAccess: true,
    context: { system: true },
  })
  if (resend) await enqueue(payload, id)

  return {
    status: 200,
    body: { ok: true, leadId: id, type: lead.type, redirect: thankYouPath(locale, lead.type) },
  }
}

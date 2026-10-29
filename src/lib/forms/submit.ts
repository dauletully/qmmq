import type { Payload } from 'payload'

import type { Lead } from '../../payload-types'
import { queueLeadSync } from '../amocrm/sync'
import type { FormType, Locale } from '../constants'
import { amoDisabledReason, getAmoSettings } from '../integrations'
import { createRateLimiter } from '../rateLimit'
import {
  envelopeSchema,
  fieldErrors,
  formSchemas,
  isFormType,
  type RegistrationData,
  type RegulationsData,
  type SchoolData,
} from './schemas'

// Серверная обработка POST /api/forms/:type. Не импортировать на клиенте.

export const MIN_FILL_MS = 3000
export const MAX_BODY_BYTES = 20_000

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

type LocalizedLabel = string | Partial<Record<Locale, string | null>> | null | undefined

// Вариант «Как узнали» сохраняем русской подписью, даже если форма была на казахском.
function canonicalHowHeard(value: string | undefined, options: Array<{ label?: LocalizedLabel }>) {
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

export async function handleFormSubmission(args: {
  payload: Payload
  type: string | undefined
  rawBody: string
  ip: string
  now?: number
}): Promise<FormResult> {
  const { payload, type, rawBody, ip } = args
  const now = args.now ?? Date.now()

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

  // Honeypot заполнен — делаем вид, что всё хорошо, но ничего не сохраняем.
  if (typeof hp === 'string' ? hp.trim() !== '' : hp !== undefined && hp !== null && hp !== false) {
    payload.logger.info({ msg: 'forms: honeypot', type, ip })
    return {
      status: 200,
      body:
        type === 'regulations'
          ? { ok: true, pdfUrl: null }
          : { ok: true, redirect: thankYouPath(locale, 'registration') },
    }
  }

  // Слишком быстро после открытия формы. Отрицательная разница — часы клиента спешат, пропускаем.
  const elapsed = typeof startedAt === 'number' ? now - startedAt : NaN
  if (Number.isNaN(elapsed) || (elapsed >= 0 && elapsed < MIN_FILL_MS)) {
    return { status: 400, body: { ok: false, error: 'too_fast' } }
  }

  const parsed = formSchemas[type as FormType].safeParse(fields)
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
  }

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
  } else {
    const f = parsed.data as RegistrationData
    const howHeardOptions = (landing.forms?.howHeardOptions ?? []) as Array<{
      label?: LocalizedLabel
    }>
    Object.assign(data, {
      fullName: f.fullName,
      subject: f.subject,
      region: f.region,
      city: f.city,
      school: f.school,
      experience: f.experience,
      phone: f.phone,
      email: f.email,
      howHeard: canonicalHowHeard(f.howHeard, howHeardOptions),
    })
  }

  // Если amoCRM не настроена — заявка сохраняется со статусом disabled и уйдёт позже.
  let disabledReason: string | null = null
  try {
    disabledReason = amoDisabledReason(await getAmoSettings(payload))
  } catch (err) {
    payload.logger.error({ err, msg: 'forms: не удалось прочитать настройки amoCRM' })
    disabledReason = 'Не удалось прочитать настройки amoCRM'
  }
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

  // Только постановка в очередь (запись в базу) — amoCRM форма не ждёт.
  if (!disabledReason) {
    try {
      await queueLeadSync(payload, [lead.id])
    } catch (err) {
      payload.logger.error({ err, msg: 'forms: не удалось поставить заявку в очередь amoCRM' })
      await payload
        .update({
          collection: 'leads',
          id: lead.id,
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

  if (type === 'regulations') {
    const pdf = event?.regulationsPdf
    const pdfUrl = pdf && typeof pdf === 'object' ? (pdf.url ?? null) : null
    return { status: 200, body: { ok: true, leadId: lead.id, pdfUrl } }
  }
  return {
    status: 200,
    body: { ok: true, leadId: lead.id, type: leadType, redirect: thankYouPath(locale, leadType) },
  }
}

import type { Payload } from 'payload'
import { z } from 'zod'

import type { Lead } from '../../payload-types'
import { queueLeadSync } from '../amocrm/sync'
import {
  AMO_LEAD_TYPES,
  EXPERIENCE,
  PARTNER_FORMATS,
  REGIONS,
  SITE_LOCALES,
  SPEAKER_ROLES,
  SUBJECTS,
  valuesOf,
  type SiteLocale,
} from '../constants'
import { amoDisabledReason, getAmoSettings } from '../integrations'
import { isValidPhone, normalizePhone } from '../phone'
import { createRateLimiter } from '../rateLimit'
import { attributionSchema, fieldErrors } from './schemas'

// Формы сайта qmmq.kz: вступление в сообщество, спикер/жюри, партнёрство, обратная связь, подписка.
// Принимаются тем же POST /api/forms/:type (src/lib/forms/submit.ts делегирует сюда по типу).
// Схемы (верх файла) — общие для клиента и сервера; обработчик handleSiteFormSubmission —
// только сервер. Формы лендинга (registration, school, regulations) — в schemas.ts / submit.ts.

export const SITE_FORM_TYPES = ['community', 'speaker', 'partner', 'feedback', 'subscribe'] as const
export type SiteFormType = (typeof SITE_FORM_TYPES)[number]

export function isSiteFormType(value: unknown): value is SiteFormType {
  return typeof value === 'string' && (SITE_FORM_TYPES as readonly string[]).includes(value)
}

// ---- Схемы -------------------------------------------------------------------------------

const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

const requiredText = (min: number, max: number) =>
  z
    .string({ error: 'required' })
    .trim()
    .min(1, { error: 'required' })
    .min(min, { error: 'too_short' })
    .max(max, { error: 'too_long' })

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() || undefined : emptyToUndefined(v)),
    z.string({ error: 'invalid_value' }).max(max, { error: 'too_long' }).optional(),
  )

const phone = z
  .string({ error: 'required' })
  .trim()
  .min(1, { error: 'required' })
  .refine(isValidPhone, { error: 'invalid_phone' })
  .transform((v) => normalizePhone(v) as string)

const optionalPhone = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim() || undefined : emptyToUndefined(v)),
  phone.optional(),
)

const email = z
  .string({ error: 'required' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'required' })
  .pipe(z.email({ error: 'invalid_email' }).max(160, { error: 'too_long' }))

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToUndefined, z.enum(values, { error: 'invalid_option' }).optional())

const subject = z.enum(valuesOf(SUBJECTS), { error: 'invalid_option' })
const region = z.enum(valuesOf(REGIONS), { error: 'invalid_option' })
const consent = z.literal(true, { error: 'consent_required' })
// Чекбокс «хочу в каталог»: true / 'on' / 'true' → true, остальное → false.
const flag = z.preprocess(
  (v) => v === true || v === 'true' || v === 'on' || v === 1 || v === '1',
  z.boolean(),
)

// Вступить в сообщество (/community/join)
export const communitySchema = z.object({
  fullName: requiredText(3, 120),
  subject,
  region,
  school: requiredText(2, 200),
  phone,
  email,
  wantsCatalog: flag,
  consent,
})

// Стать спикером / членом жюри (/community)
export const speakerSchema = z.object({
  fullName: requiredText(3, 120),
  subject,
  region,
  school: optionalText(200),
  speakerRole: z.enum(valuesOf(SPEAKER_ROLES), { error: 'invalid_option' }),
  topic: requiredText(3, 300),
  experience: optionalEnum(valuesOf(EXPERIENCE)),
  message: optionalText(2000),
  phone,
  email,
  consent,
})

// Партнёрам (/partners)
export const partnerSchema = z.object({
  organization: requiredText(2, 200),
  contactPerson: requiredText(2, 120),
  partnerFormat: z.enum(valuesOf(PARTNER_FORMATS), { error: 'invalid_option' }),
  message: optionalText(2000),
  phone,
  email,
  consent,
})

// Обратная связь (/contacts). Телефон не обязателен.
export const feedbackSchema = z.object({
  fullName: requiredText(2, 120),
  email,
  phone: optionalPhone,
  message: requiredText(5, 3000),
  consent,
})

// Подписка на рассылку (подвал)
export const subscribeSchema = z.object({
  email,
  subject: optionalEnum(valuesOf(SUBJECTS)),
  region: optionalEnum(valuesOf(REGIONS)),
  consent,
})

export const siteFormSchemas = {
  community: communitySchema,
  speaker: speakerSchema,
  partner: partnerSchema,
  feedback: feedbackSchema,
  subscribe: subscribeSchema,
} as const satisfies Record<SiteFormType, z.ZodType>

export type CommunityInput = z.input<typeof communitySchema>
export type CommunityData = z.output<typeof communitySchema>
export type SpeakerInput = z.input<typeof speakerSchema>
export type SpeakerData = z.output<typeof speakerSchema>
export type PartnerInput = z.input<typeof partnerSchema>
export type PartnerData = z.output<typeof partnerSchema>
export type FeedbackInput = z.input<typeof feedbackSchema>
export type FeedbackData = z.output<typeof feedbackSchema>
export type SubscribeInput = z.input<typeof subscribeSchema>
export type SubscribeData = z.output<typeof subscribeSchema>

// Тело запроса POST /api/forms/:type для форм сайта. Лендинг не нужен; path — страница формы.
export const siteEnvelopeSchema = z.object({
  locale: z.enum(SITE_LOCALES).catch('ru'),
  fields: z.record(z.string(), z.unknown()),
  path: z.string().trim().max(300).optional().catch(undefined),
  attribution: attributionSchema.optional().catch(undefined),
  hp: z.unknown().optional(),
  startedAt: z.coerce.number().optional().catch(undefined),
})

export type SiteFormEnvelope = z.input<typeof siteEnvelopeSchema>

// ---- Сервер -----------------------------------------------------------------------------

export const SITE_MIN_FILL_MS = 3000
// Подписка — одно поле, заполняется быстро.
export const SUBSCRIBE_MIN_FILL_MS = 1200
export const SITE_MAX_BODY_BYTES = 20_000
export const AMO_SKIPPED_REASON = 'Этот тип заявки не отправляется в amoCRM'

// Те же лимиты, что у форм лендинга, но свой счётчик: сайт и лендинг — разные страницы.
const burstLimiter = createRateLimiter({ windowMs: 30_000, max: 5 })
const windowLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 20 })

export function resetSiteFormRateLimits() {
  burstLimiter.reset()
  windowLimiter.reset()
}

export type SiteFormResult = { status: number; body: Record<string, unknown> }

export async function handleSiteFormSubmission(args: {
  payload: Payload
  type: string | undefined
  rawBody: string
  ip: string
  now?: number
}): Promise<SiteFormResult> {
  const { payload, type, rawBody, ip } = args
  const now = args.now ?? Date.now()

  if (!isSiteFormType(type)) return { status: 404, body: { ok: false, error: 'unknown_form' } }

  if (!burstLimiter.hit(ip, now) || !windowLimiter.hit(ip, now)) {
    return { status: 429, body: { ok: false, error: 'rate_limited' } }
  }
  if (rawBody.length > SITE_MAX_BODY_BYTES) {
    return { status: 413, body: { ok: false, error: 'too_large' } }
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return { status: 400, body: { ok: false, error: 'invalid_request' } }
  }
  const envelope = siteEnvelopeSchema.safeParse(json)
  if (!envelope.success) return { status: 400, body: { ok: false, error: 'invalid_request' } }
  const { locale, fields, attribution, hp, startedAt, path } = envelope.data

  // Honeypot заполнен — отвечаем «ок», ничего не сохраняем.
  if (typeof hp === 'string' ? hp.trim() !== '' : hp !== undefined && hp !== null && hp !== false) {
    payload.logger.info({ msg: 'forms: honeypot', type, ip })
    return { status: 200, body: { ok: true } }
  }

  const minFill = type === 'subscribe' ? SUBSCRIBE_MIN_FILL_MS : SITE_MIN_FILL_MS
  const elapsed = typeof startedAt === 'number' ? now - startedAt : NaN
  if (Number.isNaN(elapsed) || (elapsed >= 0 && elapsed < minFill)) {
    return { status: 400, body: { ok: false, error: 'too_fast' } }
  }

  const parsed = siteFormSchemas[type].safeParse(fields)
  if (!parsed.success) {
    return { status: 400, body: { ok: false, errors: fieldErrors(parsed.error) } }
  }

  const nowIso = new Date(now).toISOString()

  if (type === 'subscribe') {
    const f = parsed.data as SubscribeData
    const id = await upsertSubscriber(payload, {
      email: f.email,
      subject: f.subject ?? null,
      region: f.region ?? null,
      locale,
      source: path ?? null,
      consentAt: nowIso,
    })
    return { status: 200, body: { ok: true, subscriberId: id } }
  }

  const data: Partial<Lead> & Pick<Lead, 'type'> = {
    type,
    locale,
    consent: true,
    consentAt: nowIso,
    attribution: attribution ?? {},
    sourcePath: path ?? null,
  }

  if (type === 'community') {
    const f = parsed.data as CommunityData
    Object.assign(data, {
      fullName: f.fullName,
      subject: f.subject,
      region: f.region,
      school: f.school,
      phone: f.phone,
      email: f.email,
      wantsCatalog: f.wantsCatalog,
    })
  } else if (type === 'speaker') {
    const f = parsed.data as SpeakerData
    Object.assign(data, {
      fullName: f.fullName,
      subject: f.subject,
      region: f.region,
      school: f.school ?? null,
      experience: f.experience ?? null,
      speakerRole: f.speakerRole,
      topic: f.topic,
      message: f.message ?? null,
      phone: f.phone,
      email: f.email,
    })
  } else if (type === 'partner') {
    const f = parsed.data as PartnerData
    Object.assign(data, {
      organization: f.organization,
      contactPerson: f.contactPerson,
      partnerFormat: f.partnerFormat,
      message: f.message ?? null,
      phone: f.phone,
      email: f.email,
    })
  } else {
    const f = parsed.data as FeedbackData
    Object.assign(data, {
      fullName: f.fullName,
      email: f.email,
      phone: f.phone ?? null,
      message: f.message,
    })
  }

  // В amoCRM уходят только community, speaker, partner (AMO_LEAD_TYPES); обратная связь — нет.
  const toAmo = AMO_LEAD_TYPES.includes(type)
  let disabledReason: string | null = null
  if (toAmo) {
    try {
      disabledReason = amoDisabledReason(await getAmoSettings(payload))
    } catch (err) {
      payload.logger.error({ err, msg: 'forms: не удалось прочитать настройки amoCRM' })
      disabledReason = 'Не удалось прочитать настройки amoCRM'
    }
  }
  data.amo = !toAmo
    ? { syncStatus: 'skipped', lastError: AMO_SKIPPED_REASON, attempts: 0 }
    : disabledReason
      ? { syncStatus: 'disabled', lastError: disabledReason, attempts: 0 }
      : { syncStatus: 'pending', attempts: 0 }

  const lead = await payload.create({
    collection: 'leads',
    data: data as Lead,
    depth: 0,
    overrideAccess: true,
    context: { system: true },
  })

  if (toAmo && !disabledReason) {
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

  return { status: 200, body: { ok: true, leadId: lead.id, type } }
}

// Подписчик: один e-mail — одна запись. Повторная подписка обновляет предмет/регион
// и снова включает подписку, если человек отписывался.
async function upsertSubscriber(
  payload: Payload,
  data: {
    email: string
    subject: string | null
    region: string | null
    locale: SiteLocale
    source: string | null
    consentAt: string
  },
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: data.email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const patch = {
    subject: data.subject as Lead['subject'],
    region: data.region as Lead['region'],
    locale: data.locale,
    source: data.source,
    consentAt: data.consentAt,
    active: true,
  }
  if (docs[0]) {
    await payload.update({
      collection: 'subscribers',
      id: docs[0].id,
      data: patch,
      depth: 0,
      overrideAccess: true,
    })
    return docs[0].id
  }
  const created = await payload.create({
    collection: 'subscribers',
    data: { email: data.email, ...patch },
    depth: 0,
    overrideAccess: true,
  })
  return created.id
}

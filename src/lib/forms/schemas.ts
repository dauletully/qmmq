import { z } from 'zod'

import {
  EXPERIENCE,
  FORM_TYPES,
  LOCALES,
  REGIONS,
  SUBJECTS,
  valuesOf,
  type FormType,
} from '../constants'
import { isValidPhone, normalizePhone } from '../phone'

// Одна схема на форму — для клиента и сервера. Сообщения об ошибках — ключи (см. messages.ts).
// Файл не должен импортировать ничего серверного.

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

const email = z
  .string({ error: 'required' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'required' })
  .pipe(z.email({ error: 'invalid_email' }).max(160, { error: 'too_long' }))

const subject = z.enum(valuesOf(SUBJECTS), { error: 'invalid_option' })
const region = z.enum(valuesOf(REGIONS), { error: 'invalid_option' })
const experience = z.preprocess(
  emptyToUndefined,
  z.enum(valuesOf(EXPERIENCE), { error: 'invalid_option' }).optional(),
)
const consent = z.literal(true, { error: 'consent_required' })

export const registrationSchema = z.object({
  fullName: requiredText(3, 120),
  subject,
  region,
  city: requiredText(2, 80),
  school: requiredText(2, 200),
  experience,
  phone,
  email,
  howHeard: optionalText(200),
  consent,
})

export const schoolSchema = z.object({
  organization: requiredText(2, 200),
  contactPerson: requiredText(2, 120),
  phone,
  participantsCount: z.coerce
    .number({ error: 'invalid_number' })
    .int({ error: 'invalid_number' })
    .min(1, { error: 'too_small' })
    .max(1000, { error: 'too_large' }),
  subjects: z
    .array(subject, { error: 'required' })
    .min(1, { error: 'required' })
    .transform((list) => Array.from(new Set(list))),
  consent,
})

export const regulationsSchema = z.object({
  fullName: requiredText(2, 120),
  phone,
  email,
  consent,
})

export const formSchemas = {
  registration: registrationSchema,
  school: schoolSchema,
  regulations: regulationsSchema,
} as const satisfies Record<FormType, z.ZodType>

export type RegistrationInput = z.input<typeof registrationSchema>
export type RegistrationData = z.output<typeof registrationSchema>
export type SchoolInput = z.input<typeof schoolSchema>
export type SchoolData = z.output<typeof schoolSchema>
export type RegulationsInput = z.input<typeof regulationsSchema>
export type RegulationsData = z.output<typeof regulationsSchema>
export type FormData = RegistrationData | SchoolData | RegulationsData

export function isFormType(value: unknown): value is FormType {
  return typeof value === 'string' && (FORM_TYPES as readonly string[]).includes(value)
}

// Атрибуция из трекера аналитики. Ничего не отклоняем — только обрезаем.
const attributionText = z
  .unknown()
  .transform((v) => (typeof v === 'string' ? v.slice(0, 500) : undefined))

export const attributionSchema = z
  .object({
    visitorId: attributionText,
    sessionId: attributionText,
    utmSource: attributionText,
    utmMedium: attributionText,
    utmCampaign: attributionText,
    utmContent: attributionText,
    utmTerm: attributionText,
    referrer: attributionText,
    landingPath: attributionText,
    device: attributionText,
  })
  .partial()

export type Attribution = z.output<typeof attributionSchema>

// Тело запроса POST /api/forms/:type.
export const envelopeSchema = z.object({
  landing: z.string().trim().min(1).max(100),
  locale: z.enum(LOCALES).catch('ru'),
  fields: z.record(z.string(), z.unknown()),
  attribution: attributionSchema.optional().catch(undefined),
  hp: z.unknown().optional(),
  startedAt: z.coerce.number().optional().catch(undefined),
})

export type FormEnvelope = z.input<typeof envelopeSchema>

// Ошибки zod → { поле: ключ_ошибки } (первая ошибка на поле).
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!result[key]) result[key] = issue.message
  }
  return result
}

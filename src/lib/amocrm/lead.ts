import { EXPERIENCE, labelOf, LEAD_TYPES, REGIONS, SUBJECTS, type LeadType } from '../constants'
import { formatPhone } from '../phone'
import type { AmoComplexLead, AmoCustomFieldValue } from './client'
import { AMO_UTM_CODES, type AmoFieldKey, type AmoFieldMap, type AmoUtmKey } from './fields'

// Сборка сделки amoCRM из заявки. Чистые функции — без обращения к базе и сети.

type Nullable<T> = T | null | undefined

export type LeadForAmo = {
  id: number
  type: LeadType
  locale?: Nullable<string>
  fullName?: Nullable<string>
  subject?: Nullable<string>
  region?: Nullable<string>
  city?: Nullable<string>
  school?: Nullable<string>
  experience?: Nullable<string>
  phone?: Nullable<string>
  email?: Nullable<string>
  howHeard?: Nullable<string>
  organization?: Nullable<string>
  contactPerson?: Nullable<string>
  participantsCount?: Nullable<number>
  subjects?: Nullable<string[]>
  consent?: Nullable<boolean>
  consentAt?: Nullable<string>
  createdAt: string
  attribution?: Nullable<
    Partial<
      Record<AmoUtmKey | 'visitorId' | 'sessionId' | 'landingPath' | 'device', Nullable<string>>
    >
  >
}

export type EventForAmo = {
  title?: Nullable<string>
  slug?: Nullable<string>
  price?: Nullable<number>
}

export type AmoLeadSettings = {
  pipelineId?: Nullable<number>
  newStatusId?: Nullable<number>
  fieldMap?: Nullable<AmoFieldMap>
}

export type BuildLeadOptions = {
  lead: LeadForAmo
  event?: Nullable<EventForAmo>
  landingSlug?: Nullable<string>
  settings: AmoLeadSettings
  adminUrl?: Nullable<string>
  // false — без дополнительных и UTM-полей (если amoCRM их отклонила)
  withCustomFields?: boolean
}

const TIME_ZONE = 'Asia/Almaty'

export function formatDateTime(iso: Nullable<string>): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function leadDisplayName(lead: LeadForAmo): string {
  return (
    (lead.type === 'school' ? lead.organization : lead.fullName)?.trim() || `Заявка №${lead.id}`
  )
}

export function leadSubjects(lead: LeadForAmo): string[] {
  if (lead.type === 'school') return lead.subjects ?? []
  return lead.subject ? [lead.subject] : []
}

export function leadTitle(lead: LeadForAmo): string {
  return `${labelOf(LEAD_TYPES, lead.type)} — ${leadDisplayName(lead)}`
}

export function leadPrice(lead: LeadForAmo, event: Nullable<EventForAmo>): number | undefined {
  const price = event?.price
  if (typeof price !== 'number' || price <= 0) return undefined
  if (lead.type === 'registration' || lead.type === 'waitlist') return price
  if (lead.type === 'school' && lead.participantsCount && lead.participantsCount > 0) {
    return price * lead.participantsCount
  }
  return undefined
}

export function buildLeadTags(lead: LeadForAmo): Array<{ name: string }> {
  const names = [
    labelOf(LEAD_TYPES, lead.type),
    ...leadSubjects(lead).map((s) => labelOf(SUBJECTS, s)),
  ]
  return Array.from(new Set(names.filter(Boolean))).map((name) => ({ name }))
}

function customFieldValues(
  lead: LeadForAmo,
  fieldMap: Nullable<AmoFieldMap>,
): AmoCustomFieldValue[] {
  const result: AmoCustomFieldValue[] = []
  const fields = fieldMap?.fields ?? {}

  const text = (key: AmoFieldKey, value: Nullable<string | number>) => {
    const id = fields[key]?.id
    if (!id || value === null || value === undefined || value === '') return
    result.push({ field_id: id, values: [{ value: String(value).slice(0, 250) }] })
  }
  const select = (key: AmoFieldKey, values: Array<Nullable<string>>) => {
    const field = fields[key]
    if (!field?.id) return
    const enumIds = values
      .map((v) => (v ? field.enums?.[v] : undefined))
      .filter((id): id is number => typeof id === 'number')
    if (enumIds.length)
      result.push({ field_id: field.id, values: enumIds.map((enum_id) => ({ enum_id })) })
  }

  select('leadType', [lead.type])
  select('subjects', leadSubjects(lead))
  select('region', [lead.region])
  text('city', lead.city)
  text('school', lead.type === 'school' ? lead.organization : lead.school)
  select('experience', [lead.experience])
  text('howHeard', lead.howHeard)
  text('participantsCount', lead.participantsCount)
  select('formLocale', [lead.locale])
  text('siteLeadId', lead.id)

  // UTM — в стандартные поля сделки: по id, если нашли их в аккаунте, иначе по коду.
  for (const [key, code] of Object.entries(AMO_UTM_CODES) as [AmoUtmKey, string][]) {
    const value = lead.attribution?.[key]
    if (!value) continue
    const id = fieldMap?.utm?.[key]
    if (fieldMap?.utm && !id) continue
    result.push({
      ...(id ? { field_id: id } : { field_code: code }),
      values: [{ value: value.slice(0, 250) }],
    })
  }
  return result
}

export function buildComplexLead(opts: BuildLeadOptions): AmoComplexLead {
  const { lead, event, settings } = opts
  const contactName =
    (lead.type === 'school' ? lead.contactPerson || lead.organization : lead.fullName)?.trim() ||
    `Заявка №${lead.id}`

  const contactFields: AmoCustomFieldValue[] = []
  if (lead.phone) {
    contactFields.push({ field_code: 'PHONE', values: [{ value: lead.phone, enum_code: 'MOB' }] })
  }
  if (lead.email) {
    contactFields.push({ field_code: 'EMAIL', values: [{ value: lead.email, enum_code: 'WORK' }] })
  }

  const result: AmoComplexLead = {
    name: leadTitle(lead).slice(0, 250),
    request_id: String(lead.id),
    _embedded: {
      tags: buildLeadTags(lead),
      contacts: [{ name: contactName.slice(0, 250), custom_fields_values: contactFields }],
    },
  }
  const price = leadPrice(lead, event)
  if (price !== undefined) result.price = price
  if (settings.pipelineId) result.pipeline_id = settings.pipelineId
  if (settings.pipelineId && settings.newStatusId) result.status_id = settings.newStatusId

  if (opts.withCustomFields !== false) {
    const cf = customFieldValues(lead, settings.fieldMap)
    if (cf.length) result.custom_fields_values = cf
  }
  return result
}

// Примечание к сделке с полным текстом заявки.
export function buildLeadNote(
  opts: Omit<BuildLeadOptions, 'settings' | 'withCustomFields'>,
): string {
  const { lead, event, landingSlug, adminUrl } = opts
  const lines: string[] = []
  const add = (label: string, value: Nullable<string | number>) => {
    if (value === null || value === undefined || value === '') return
    lines.push(`${label}: ${value}`)
  }

  lines.push(`Заявка с сайта №${lead.id} — ${labelOf(LEAD_TYPES, lead.type)}`)
  add('Мероприятие', event?.title)
  add('Лендинг', landingSlug)
  add('Язык формы', lead.locale === 'kk' ? 'казахский' : 'русский')
  add('Дата', `${formatDateTime(lead.createdAt)} (Алматы)`)
  lines.push('')

  if (lead.type === 'school') {
    add('Организация', lead.organization)
    add('Контактное лицо', lead.contactPerson)
    add('Число участников', lead.participantsCount)
    add('Предметы', (lead.subjects ?? []).map((s) => labelOf(SUBJECTS, s)).join(', '))
  } else {
    add('ФИО', lead.fullName)
    add('Предмет', labelOf(SUBJECTS, lead.subject))
    add('Регион', labelOf(REGIONS, lead.region))
    add('Город', lead.city)
    add('Школа / организация', lead.school)
    add('Стаж', labelOf(EXPERIENCE, lead.experience))
  }
  add('Телефон (WhatsApp)', lead.phone ? formatPhone(lead.phone) : '')
  add('E-mail', lead.email)
  add('Как узнали', lead.howHeard)
  add(
    'Согласие на обработку данных',
    lead.consent ? `да, ${formatDateTime(lead.consentAt)}` : 'нет',
  )

  const a = lead.attribution
  if (a) {
    const utm = (['utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm'] as const)
      .map((k) => (a[k] ? `${k.replace('utm', 'utm_').toLowerCase()}=${a[k]}` : ''))
      .filter(Boolean)
      .join(', ')
    if (utm || a.referrer || a.landingPath || a.device) lines.push('')
    add('UTM', utm)
    add('Откуда перешли', a.referrer)
    add('Страница входа', a.landingPath)
    add('Устройство', a.device)
  }
  if (adminUrl) {
    lines.push('')
    add('Карточка заявки', adminUrl)
  }
  return lines.join('\n')
}

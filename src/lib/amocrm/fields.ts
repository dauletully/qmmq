import { EXPERIENCE, LEAD_TYPES, REGIONS, SUBJECTS, type LabeledOption } from '../constants'
import type { AmoClient, AmoCustomField, AmoNewCustomField } from './client'

// Дополнительные поля сделки, которые кнопка «Создать поля в amoCRM» создаёт в аккаунте.
// key — ключ в fieldMap; code — символьный код поля в amoCRM.
type FieldDef = {
  key: AmoFieldKey
  name: string
  code: string
  type: 'text' | 'numeric' | 'select' | 'multiselect'
  options?: readonly LabeledOption[]
}

export type AmoFieldKey =
  | 'leadType'
  | 'subjects'
  | 'region'
  | 'city'
  | 'school'
  | 'experience'
  | 'howHeard'
  | 'participantsCount'
  | 'formLocale'
  | 'siteLeadId'

const LOCALE_OPTIONS = [
  { value: 'ru', label: { ru: 'Русский', kk: 'Орысша' } },
  { value: 'kk', label: { ru: 'Казахский', kk: 'Қазақша' } },
] as const satisfies readonly LabeledOption[]

export const AMO_LEAD_FIELDS: readonly FieldDef[] = [
  {
    key: 'leadType',
    name: 'Тип заявки с сайта',
    code: 'QMMQ_LEAD_TYPE',
    type: 'select',
    options: LEAD_TYPES,
  },
  {
    key: 'subjects',
    name: 'Предмет',
    code: 'QMMQ_SUBJECTS',
    type: 'multiselect',
    options: SUBJECTS,
  },
  { key: 'region', name: 'Регион', code: 'QMMQ_REGION', type: 'select', options: REGIONS },
  { key: 'city', name: 'Город', code: 'QMMQ_CITY', type: 'text' },
  { key: 'school', name: 'Школа / организация', code: 'QMMQ_SCHOOL', type: 'text' },
  { key: 'experience', name: 'Стаж', code: 'QMMQ_EXPERIENCE', type: 'select', options: EXPERIENCE },
  { key: 'howHeard', name: 'Как узнали о конкурсе', code: 'QMMQ_HOW_HEARD', type: 'text' },
  {
    key: 'participantsCount',
    name: 'Число участников',
    code: 'QMMQ_PARTICIPANTS',
    type: 'numeric',
  },
  {
    key: 'formLocale',
    name: 'Язык формы',
    code: 'QMMQ_LOCALE',
    type: 'select',
    options: LOCALE_OPTIONS,
  },
  { key: 'siteLeadId', name: 'Номер заявки на сайте', code: 'QMMQ_SITE_LEAD_ID', type: 'numeric' },
]

// Стандартные поля отслеживания в сделке amoCRM.
export const AMO_UTM_CODES = {
  utmSource: 'UTM_SOURCE',
  utmMedium: 'UTM_MEDIUM',
  utmCampaign: 'UTM_CAMPAIGN',
  utmContent: 'UTM_CONTENT',
  utmTerm: 'UTM_TERM',
  referrer: 'UTM_REFERRER',
} as const

export type AmoUtmKey = keyof typeof AMO_UTM_CODES

export type AmoFieldMap = {
  fields?: Partial<Record<AmoFieldKey, { id: number; enums?: Record<string, number> }>>
  // id стандартных UTM-полей, найденных в аккаунте
  utm?: Partial<Record<AmoUtmKey, number>>
  updatedAt?: string
}

function sameText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
}

function mapEnums(def: FieldDef, field: AmoCustomField): Record<string, number> | undefined {
  if (!def.options) return undefined
  const result: Record<string, number> = {}
  for (const option of def.options) {
    const match = field.enums?.find(
      (e) => sameText(e.code, option.value) || sameText(e.value, option.label.ru),
    )
    if (match) result[option.value] = match.id
  }
  return result
}

function findExisting(def: FieldDef, fields: AmoCustomField[]) {
  return (
    fields.find((f) => sameText(f.code, def.code)) ??
    fields.find((f) => sameText(f.name, def.name) && f.type === def.type)
  )
}

export function newFieldPayload(def: FieldDef, sort: number): AmoNewCustomField {
  return {
    name: def.name,
    type: def.type,
    code: def.code,
    sort,
    enums: def.options?.map((o, i) => ({ value: o.label.ru, sort: (i + 1) * 10, code: o.value })),
  }
}

export type SetupFieldsResult = {
  fieldMap: AmoFieldMap
  created: string[]
  existing: string[]
  utmFound: string[]
}

// Находит уже существующие поля (по коду или названию), создаёт недостающие, возвращает карту id.
export async function setupLeadFields(client: AmoClient): Promise<SetupFieldsResult> {
  const current = await client.getLeadCustomFields()
  const fieldMap: AmoFieldMap = { fields: {}, utm: {} }
  const existing: string[] = []
  const toCreate: FieldDef[] = []

  for (const def of AMO_LEAD_FIELDS) {
    const found = findExisting(def, current)
    if (found) {
      fieldMap.fields![def.key] = { id: found.id, enums: mapEnums(def, found) }
      existing.push(def.name)
    } else {
      toCreate.push(def)
    }
  }

  const created: string[] = []
  if (toCreate.length) {
    const result = await client.createLeadCustomFields(
      toCreate.map((def, i) => newFieldPayload(def, 500 + i * 10)),
    )
    for (const def of toCreate) {
      const field = findExisting(def, result)
      if (!field) continue
      fieldMap.fields![def.key] = { id: field.id, enums: mapEnums(def, field) }
      created.push(def.name)
    }
  }

  const utmFound: string[] = []
  for (const [key, code] of Object.entries(AMO_UTM_CODES) as [AmoUtmKey, string][]) {
    const field = current.find((f) => sameText(f.code, code))
    if (field) {
      fieldMap.utm![key] = field.id
      utmFound.push(code)
    }
  }

  fieldMap.updatedAt = new Date().toISOString()
  return { fieldMap, created, existing, utmFound }
}

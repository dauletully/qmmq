// Справочники: значения хранятся в базе, подписи — для сайта (RU/KZ) и админки (RU).
// Файл без серверных импортов — его используют и формы на клиенте.

export type Locale = 'ru' | 'kk'

export const LOCALES = ['ru', 'kk'] as const

export type LabeledOption<V extends string = string> = {
  value: V
  label: Record<Locale, string>
}

export const SUBJECTS = [
  { value: 'math', label: { ru: 'Математика', kk: 'Математика' } },
  { value: 'physics', label: { ru: 'Физика', kk: 'Физика' } },
  { value: 'informatics', label: { ru: 'Информатика', kk: 'Информатика' } },
] as const satisfies readonly LabeledOption[]

export type Subject = (typeof SUBJECTS)[number]['value']

// 17 областей и 3 города республиканского значения (2022).
export const REGIONS = [
  { value: 'astana', label: { ru: 'Астана', kk: 'Астана' } },
  { value: 'almaty', label: { ru: 'Алматы', kk: 'Алматы' } },
  { value: 'shymkent', label: { ru: 'Шымкент', kk: 'Шымкент' } },
  { value: 'abai', label: { ru: 'Абайская область', kk: 'Абай облысы' } },
  { value: 'akmola', label: { ru: 'Акмолинская область', kk: 'Ақмола облысы' } },
  { value: 'aktobe', label: { ru: 'Актюбинская область', kk: 'Ақтөбе облысы' } },
  { value: 'almaty_region', label: { ru: 'Алматинская область', kk: 'Алматы облысы' } },
  { value: 'atyrau', label: { ru: 'Атырауская область', kk: 'Атырау облысы' } },
  {
    value: 'east_kazakhstan',
    label: { ru: 'Восточно-Казахстанская область', kk: 'Шығыс Қазақстан облысы' },
  },
  { value: 'zhambyl', label: { ru: 'Жамбылская область', kk: 'Жамбыл облысы' } },
  { value: 'zhetysu', label: { ru: 'Жетысуская область', kk: 'Жетісу облысы' } },
  {
    value: 'west_kazakhstan',
    label: { ru: 'Западно-Казахстанская область', kk: 'Батыс Қазақстан облысы' },
  },
  { value: 'karaganda', label: { ru: 'Карагандинская область', kk: 'Қарағанды облысы' } },
  { value: 'kostanay', label: { ru: 'Костанайская область', kk: 'Қостанай облысы' } },
  { value: 'kyzylorda', label: { ru: 'Кызылординская область', kk: 'Қызылорда облысы' } },
  { value: 'mangystau', label: { ru: 'Мангистауская область', kk: 'Маңғыстау облысы' } },
  { value: 'pavlodar', label: { ru: 'Павлодарская область', kk: 'Павлодар облысы' } },
  {
    value: 'north_kazakhstan',
    label: { ru: 'Северо-Казахстанская область', kk: 'Солтүстік Қазақстан облысы' },
  },
  { value: 'turkistan', label: { ru: 'Туркестанская область', kk: 'Түркістан облысы' } },
  { value: 'ulytau', label: { ru: 'Улытауская область', kk: 'Ұлытау облысы' } },
] as const satisfies readonly LabeledOption[]

export type Region = (typeof REGIONS)[number]['value']

export const EXPERIENCE = [
  { value: 'lt5', label: { ru: 'До 5 лет', kk: '5 жылға дейін' } },
  { value: '5to15', label: { ru: '5–15 лет', kk: '5–15 жыл' } },
  { value: 'gt15', label: { ru: 'Более 15 лет', kk: '15 жылдан астам' } },
] as const satisfies readonly LabeledOption[]

export type Experience = (typeof EXPERIENCE)[number]['value']

export const LEAD_TYPES = [
  { value: 'registration', label: { ru: 'Регистрация', kk: 'Тіркелу' } },
  { value: 'waitlist', label: { ru: 'Лист ожидания', kk: 'Күту тізімі' } },
  { value: 'school', label: { ru: 'Заявка от школы', kk: 'Мектептен өтінім' } },
  { value: 'regulations', label: { ru: 'Положение', kk: 'Ереже' } },
] as const satisfies readonly LabeledOption[]

export type LeadType = (typeof LEAD_TYPES)[number]['value']

// Типы форм, которые принимает POST /api/forms/:type (waitlist назначает сервер).
export const FORM_TYPES = ['registration', 'school', 'regulations'] as const
export type FormType = (typeof FORM_TYPES)[number]

export const PERSON_ROLES = [
  { value: 'team', label: { ru: 'Команда', kk: 'Команда' } },
  { value: 'speaker', label: { ru: 'Спикер', kk: 'Спикер' } },
  { value: 'jury', label: { ru: 'Жюри', kk: 'Қазылар алқасы' } },
  { value: 'master', label: { ru: 'Педагог-мастер', kk: 'Шебер педагог' } },
] as const satisfies readonly LabeledOption[]

export const PARTNER_KINDS = [
  { value: 'ministry', label: { ru: 'Министерство', kk: 'Министрлік' } },
  { value: 'organizer', label: { ru: 'Организатор', kk: 'Ұйымдастырушы' } },
  { value: 'university', label: { ru: 'Вуз', kk: 'ЖОО' } },
  { value: 'sponsor', label: { ru: 'Спонсор', kk: 'Демеуші' } },
  { value: 'media', label: { ru: 'СМИ', kk: 'БАҚ' } },
] as const satisfies readonly LabeledOption[]

export const EVENT_TYPES = [
  { value: 'contest', label: { ru: 'Конкурс', kk: 'Байқау' } },
  { value: 'olympiad', label: { ru: 'Олимпиада', kk: 'Олимпиада' } },
  { value: 'seminar', label: { ru: 'Семинар', kk: 'Семинар' } },
  { value: 'training', label: { ru: 'Тренинг', kk: 'Тренинг' } },
] as const satisfies readonly LabeledOption[]

export const EVENT_LEVELS = [
  { value: 'international', label: { ru: 'Международный', kk: 'Халықаралық' } },
  { value: 'republic', label: { ru: 'Республиканский', kk: 'Республикалық' } },
  { value: 'regional', label: { ru: 'Областной', kk: 'Облыстық' } },
  { value: 'city', label: { ru: 'Городской', kk: 'Қалалық' } },
] as const satisfies readonly LabeledOption[]

export const EVENT_FORMATS = [
  { value: 'offline', label: { ru: 'Очно', kk: 'Офлайн' } },
  { value: 'online', label: { ru: 'Онлайн', kk: 'Онлайн' } },
] as const satisfies readonly LabeledOption[]

// Иконки Lucide, которые можно выбрать для карточек выгод (имена — как в lucide-react).
export const BENEFIT_ICONS = [
  { value: 'Award', label: { ru: 'Награда', kk: 'Марапат' } },
  { value: 'FileBadge', label: { ru: 'Документ', kk: 'Құжат' } },
  { value: 'GraduationCap', label: { ru: 'Академическая шапочка', kk: 'Академиялық бөрік' } },
  { value: 'BookOpen', label: { ru: 'Книга', kk: 'Кітап' } },
  { value: 'Brain', label: { ru: 'Мышление', kk: 'Ойлау' } },
  { value: 'Calculator', label: { ru: 'Калькулятор', kk: 'Калькулятор' } },
  { value: 'Clock', label: { ru: 'Часы', kk: 'Сағат' } },
  { value: 'Lightbulb', label: { ru: 'Идея', kk: 'Идея' } },
  { value: 'MessagesSquare', label: { ru: 'Обсуждение', kk: 'Талқылау' } },
  { value: 'Mic', label: { ru: 'Лекция', kk: 'Дәріс' } },
  { value: 'Sigma', label: { ru: 'Сигма', kk: 'Сигма' } },
  { value: 'Atom', label: { ru: 'Атом', kk: 'Атом' } },
  { value: 'Code', label: { ru: 'Код', kk: 'Код' } },
  { value: 'Trophy', label: { ru: 'Кубок', kk: 'Кубок' } },
  { value: 'Users', label: { ru: 'Сообщество', kk: 'Қауымдастық' } },
  { value: 'Handshake', label: { ru: 'Партнёрство', kk: 'Серіктестік' } },
  { value: 'Star', label: { ru: 'Звезда', kk: 'Жұлдыз' } },
  { value: 'Target', label: { ru: 'Цель', kk: 'Мақсат' } },
] as const satisfies readonly LabeledOption[]

export const SOCIAL_NETWORKS = [
  { value: 'instagram', label: { ru: 'Instagram', kk: 'Instagram' } },
  { value: 'facebook', label: { ru: 'Facebook', kk: 'Facebook' } },
  { value: 'telegram', label: { ru: 'Telegram', kk: 'Telegram' } },
  { value: 'whatsapp', label: { ru: 'Канал WhatsApp', kk: 'WhatsApp арнасы' } },
  { value: 'youtube', label: { ru: 'YouTube', kk: 'YouTube' } },
  { value: 'tiktok', label: { ru: 'TikTok', kk: 'TikTok' } },
  { value: 'vk', label: { ru: 'ВКонтакте', kk: 'ВКонтакте' } },
  { value: 'other', label: { ru: 'Другое', kk: 'Басқа' } },
] as const satisfies readonly LabeledOption[]

export function valuesOf<T extends readonly LabeledOption[]>(
  list: T,
): [T[number]['value'], ...T[number]['value'][]] {
  return list.map((o) => o.value) as [T[number]['value'], ...T[number]['value'][]]
}

export function labelOf(
  list: readonly LabeledOption[],
  value: string | null | undefined,
  locale: Locale = 'ru',
): string {
  if (!value) return ''
  const option = list.find((o) => o.value === value)
  return option ? option.label[locale] || option.label.ru : value
}

// Опции для <select> на сайте.
export function optionsFor(list: readonly LabeledOption[], locale: Locale = 'ru') {
  return list.map((o) => ({ value: o.value, label: o.label[locale] || o.label.ru }))
}

// Опции для полей select в Payload (админка на русском).
export function adminOptions(list: readonly LabeledOption[]) {
  return list.map((o) => ({ value: o.value, label: o.label.ru }))
}

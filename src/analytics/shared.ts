// Общие для трекера, сервера и отчётов константы. Договор — docs/ARCHITECTURE.md, раздел «Аналитика».

export const ANALYTICS_EVENTS = [
  'page_view',
  'section_view',
  'cta_click',
  'form_open',
  'form_start',
  'form_submit',
  'form_error',
  'lang_switch',
  'whatsapp_click',
  'regulations_download',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

// Порядок — как блоки идут на странице (для отчёта о досмотре).
export const LANDING_SECTIONS = [
  { id: 'hero', label: 'Первый экран' },
  { id: 'audience', label: 'Для кого' },
  { id: 'benefits', label: 'Что получает участник' },
  { id: 'gallery', label: 'Фотографии' },
  { id: 'program', label: 'Программа' },
  { id: 'pricing', label: 'Стоимость и регистрация' },
  { id: 'speakers', label: 'Спикеры и жюри' },
  { id: 'history', label: 'История и достижения' },
  { id: 'stories', label: 'Истории участников' },
  { id: 'address', label: 'Обращение' },
  { id: 'partners', label: 'Партнёры' },
  { id: 'faq', label: 'Вопросы и ответы' },
  { id: 'contacts', label: 'Контакты' },
] as const

export const CTA_LOCATIONS = ['header', 'hero', 'pricing', 'stories', 'final', 'sticky'] as const

export const FORM_TYPES = ['registration', 'school', 'regulations'] as const

export const DEVICE_TYPES = ['mobile', 'tablet', 'desktop'] as const
export type DeviceType = (typeof DEVICE_TYPES)[number]

// Нейтральный путь приёма событий: /api/lp. Слова collect/track/analytics/pixel/beacon
// режут блокировщики рекламы.
export const INGEST_PATH = '/lp'
export const INGEST_URL = `/api${INGEST_PATH}`

export const EVENTS_SLUG = 'analytics-events'
export const EVENTS_TABLE = 'analytics_events'
export const SETTINGS_SLUG = 'analytics-settings'

export const DEFAULT_PLAN_STEPS = [200, 300, 400] as const

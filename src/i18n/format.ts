import type { Locale } from '@/lib/constants'

import { getDict, plural, type Dict } from './dictionary'

const NBSP = ' '
// Казахстан живёт по UTC+5 (с марта 2024 — единый пояс).
const KZ_OFFSET_MS = 5 * 60 * 60 * 1000

export function groupThousands(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
}

export function formatPrice(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return ''
  return `${groupThousands(n)}${NBSP}₸`
}

function kzParts(iso: string) {
  const d = new Date(new Date(iso).getTime() + KZ_OFFSET_MS)
  return { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() }
}

// 12 декабря / 12 желтоқсан
export function formatDay(iso: string, locale: Locale): string {
  const t = getDict(locale)
  const p = kzParts(iso)
  return `${p.day}${NBSP}${t.months[p.month]}`
}

// Декабрь 2026 / 2026 жылғы желтоқсан
export function formatMonthYear(iso: string, locale: Locale): string {
  const t = getDict(locale)
  const p = kzParts(iso)
  if (locale === 'kk') return `${p.year} жылғы ${t.months[p.month]}`
  return `${t.monthsNominative[p.month]} ${p.year}`
}

// 12–13 декабря 2026 / 2026 жылғы 12–13 желтоқсан
export function formatDateRange(
  startIso: string,
  endIso: string | null | undefined,
  locale: Locale,
): string {
  const t = getDict(locale)
  const a = kzParts(startIso)
  const b = endIso ? kzParts(endIso) : a
  const sameDay = a.day === b.day && a.month === b.month && a.year === b.year
  let range: string
  if (sameDay) range = `${a.day}${NBSP}${t.months[a.month]}`
  else if (a.month === b.month && a.year === b.year)
    range = `${a.day}–${b.day}${NBSP}${t.months[a.month]}`
  else range = `${a.day}${NBSP}${t.months[a.month]} – ${b.day}${NBSP}${t.months[b.month]}`
  return locale === 'kk' ? `${b.year} жылғы ${range}` : `${range} ${b.year}`
}

// Спокойный дедлайн: «5 декабря» + сколько календарных дней осталось (по времени Казахстана).
// daysLeft = 0 — последний день; закрытие регистрации по времени решает data-reg.
export type DeadlineInfo = { date: string; daysLeft: number; lastDay: boolean }

function kzDayNumber(ms: number): number {
  return Math.floor((ms + KZ_OFFSET_MS) / 86_400_000)
}

export function deadlineInfo(deadlineMs: number, nowMs: number, locale: Locale): DeadlineInfo {
  const t = getDict(locale)
  const p = kzParts(new Date(deadlineMs).toISOString())
  const daysLeft = Math.max(0, kzDayNumber(deadlineMs) - kzDayNumber(nowMs))
  return {
    date: `${p.day}${NBSP}${t.monthsDative[p.month]}`,
    daysLeft,
    lastDay: daysLeft === 0,
  }
}

// «осталось 36 дней» / «последний день»
export function deadlineLeft(info: DeadlineInfo, t: Dict): string {
  return info.lastDay ? t.countdown.lastDay : t.countdown.left(info.daysLeft)
}

// Полная строка: «Регистрация до 5 декабря · осталось 36 дней» / «Тіркеу 5 желтоқсанға дейін · 36 күн қалды»
export function deadlineLine(info: DeadlineInfo, locale: Locale, short = false): string {
  const t = getDict(locale)
  const head = short ? t.countdown.untilShort : t.countdown.until
  const date = locale === 'kk' ? `${info.date} дейін` : info.date
  return `${head ? `${head} ` : ''}${date} · ${deadlineLeft(info, t)}`
}

export function unit(n: number, forms: readonly string[]): string {
  return plural(n, forms)
}

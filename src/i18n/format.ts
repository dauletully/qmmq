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

export type CountdownParts = { days: number; hours: number; minutes: number; done: boolean }

export function countdownParts(deadlineMs: number, nowMs: number): CountdownParts {
  const diff = deadlineMs - nowMs
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, done: true }
  const totalMinutes = Math.floor(diff / 60_000)
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    done: false,
  }
}

// 27 дн 14 ч 32 мин; меньше суток — без дней.
export function countdownInline(p: CountdownParts, t: Dict): string {
  const s = t.countdown.short
  const parts = [] as string[]
  if (p.days > 0) parts.push(`${p.days}${NBSP}${s.d}`)
  parts.push(`${p.hours}${NBSP}${s.h}`, `${p.minutes}${NBSP}${s.m}`)
  return parts.join(' ')
}

export function unit(n: number, forms: readonly string[]): string {
  return plural(n, forms)
}

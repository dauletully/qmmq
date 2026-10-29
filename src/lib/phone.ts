// Телефоны Казахстана (и России) с кодом +7. Без серверных импортов.

// Возвращает +7XXXXXXXXXX или null, если номер не распознан.
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null
  const digits = String(input).replace(/\D/g, '')
  let rest: string | null = null
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    rest = digits.slice(1)
  } else if (digits.length === 10) {
    rest = digits
  }
  // Номера +7 начинаются с 3–9 после кода страны (7xx — Казахстан, 9xx — мобильные России).
  if (!rest || !/^[3-9]\d{9}$/.test(rest)) return null
  return `+7${rest}`
}

export function isValidPhone(input: string | null | undefined): boolean {
  return normalizePhone(input) !== null
}

// +77011234567 → +7 701 123 45 67
export function formatPhone(phone: string | null | undefined): string {
  const n = normalizePhone(phone)
  if (!n) return phone ?? ''
  return `+7 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8, 10)} ${n.slice(10, 12)}`
}

const intFormat = new Intl.NumberFormat('ru-RU')

export const fmt = (n: number) => intFormat.format(Math.round(n))

// Доля в процентах: до 10 % — с одним знаком, дальше — целые.
export function pct(part: number, whole: number): string {
  if (!whole) return '—'
  const v = (part / whole) * 100
  if (v > 0 && v < 0.1) return '<0,1 %'
  const digits = v < 10 && v !== Math.round(v) ? 1 : 0
  return `${v.toFixed(digits).replace('.', ',')} %`
}

export const share = (part: number, whole: number) => (whole > 0 ? Math.min(1, part / whole) : 0)

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

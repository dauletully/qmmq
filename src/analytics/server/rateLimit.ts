// Ограничение частоты в памяти процесса (одна ВМ — этого достаточно). Окно — минута.
const WINDOW_MS = 60_000
const buckets = new Map<string, { count: number; reset: number }>()
let lastSweep = 0

export function allowRequest(key: string, limitPerMinute: number): boolean {
  const now = Date.now()
  if (now - lastSweep > WINDOW_MS) {
    lastSweep = now
    for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k)
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  bucket.count += 1
  return bucket.count <= limitPerMinute
}

// IP нужен только для лимита и нигде не сохраняется.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') || 'unknown'
}

// Простой лимит запросов в памяти процесса (одна ВМ — одного процесса достаточно).

export type RateLimiter = {
  // true — запрос разрешён (и учтён), false — лимит исчерпан.
  hit: (key: string, now?: number) => boolean
  reset: () => void
}

export function createRateLimiter({
  windowMs,
  max,
}: {
  windowMs: number
  max: number
}): RateLimiter {
  const hits = new Map<string, number[]>()
  let lastSweep = 0

  const sweep = (now: number) => {
    if (now - lastSweep < windowMs) return
    lastSweep = now
    for (const [key, list] of hits) {
      const fresh = list.filter((t) => now - t < windowMs)
      if (fresh.length) hits.set(key, fresh)
      else hits.delete(key)
    }
  }

  return {
    hit(key, now = Date.now()) {
      sweep(now)
      const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (list.length >= max) {
        hits.set(key, list)
        return false
      }
      list.push(now)
      hits.set(key, list)
      return true
    },
    reset() {
      hits.clear()
    },
  }
}

// IP клиента за обратным прокси (Caddy/nginx в Docker Compose передают X-Forwarded-For).
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

import { type NextRequest, NextResponse } from 'next/server'

// Хост лендинга (contest.qmmq.kz; локально contest.localhost): «/», «/kz», «/spasibo» и т. д.
// отдают активный лендинг из site-settings — внутренний маршрут /_active/… (см. app/(frontend)).
// На остальных хостах лендинг доступен по пути: /contest-2026, /contest-2026/kz.

const ACTIVE_SLUG = '_active'

function hostOf(req: NextRequest): string {
  const raw = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  return raw.split(',')[0]!.trim().toLowerCase().replace(/:\d+$/, '')
}

export function proxy(req: NextRequest) {
  const landingHost = process.env.LANDING_HOST?.trim().toLowerCase().replace(/:\d+$/, '')
  if (!landingHost || hostOf(req) !== landingHost) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = `/${ACTIVE_SLUG}${url.pathname === '/' ? '' : url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/', '/kz', '/spasibo', '/kz/spasibo', '/og', '/doc/:kind', '/kz/doc/:kind'],
}

// Лёгкий трекер лендинга без зависимостей. Протокол — src/analytics/server/ingest.ts.
import type { AnalyticsEventName, DeviceType } from '../shared'

export type EventProps = Record<string, string | number | boolean | null | undefined>

// Ровно поле `attribution` API форм (docs/ARCHITECTURE.md, «API форм»).
export type Attribution = {
  visitorId?: string
  sessionId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referrer?: string
  landingPath?: string
  device?: DeviceType
}

type FirstTouch = {
  us?: string
  um?: string
  uc?: string
  ux?: string
  ut?: string
  r?: string
  lp?: string
}
type QueuedEvent = { n: AnalyticsEventName; p: string; d?: EventProps }
type Listener = (event: AnalyticsEventName, props: EventProps) => void

const URL_ = '/api/lp'
const SESSION_MS = 30 * 60 * 1000
const K_VISITOR = 'qa_v'
const K_SESSION = 'qa_s'
const K_FIRST = 'qa_f'
const K_OFF = 'qa_off'

// Во встроенных браузерах localStorage бывает недоступен — тогда живём в памяти страницы.
const mem: Record<string, string | undefined> = {}
const read = (k: string): string | null => {
  if (k in mem) return mem[k] ?? null
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v?: string) => {
  mem[k] = v
  try {
    if (v == null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {}
}
const json = <T>(k: string): T | null => {
  try {
    return JSON.parse(read(k) || 'null')
  } catch {
    return null
  }
}

const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
const hasWindow = () => typeof window != 'undefined'

let config: { l?: string; g?: string } | null = null
let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | undefined
const listeners: Listener[] = []

const isOff = () => read(K_OFF) == '1'

function visitorId(): string {
  let v = read(K_VISITOR)
  if (!v) write(K_VISITOR, (v = rid()))
  return v
}

function sessionId(): string {
  const now = Date.now()
  let s = json<{ id: string; t: number }>(K_SESSION)
  if (!s || now - s.t > SESSION_MS) s = { id: rid(), t: now }
  s.t = now
  write(K_SESSION, JSON.stringify(s))
  return s.id
}

export function deviceType(): DeviceType {
  const ua = navigator.userAgent
  if (
    /iPad|Tablet/i.test(ua) ||
    (/Android/.test(ua) && !/Mobile/.test(ua)) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  )
    return 'tablet'
  return /Mobi|iPhone|iPod|Android/i.test(ua) ? 'mobile' : 'desktop'
}

function externalReferrer(): string | undefined {
  try {
    const u = new URL(document.referrer)
    if (u.host != location.host) return (u.protocol + '//' + u.host + u.pathname).slice(0, 200)
  } catch {}
}

// first-touch: UTM и referrer первого визита этого браузера
function firstTouch(): FirstTouch {
  let f = json<FirstTouch>(K_FIRST)
  if (!f) {
    const q = new URLSearchParams(location.search)
    const utm = (k: string) => q.get('utm_' + k) || undefined
    f = {
      us: utm('source'),
      um: utm('medium'),
      uc: utm('campaign'),
      ux: utm('content'),
      ut: utm('term'),
      r: externalReferrer(),
      lp: location.pathname,
    }
    write(K_FIRST, JSON.stringify(f))
  }
  return f
}

function send(beacon?: boolean) {
  clearTimeout(timer)
  timer = undefined
  if (!config || !queue.length) return
  if (isOff()) return void (queue = [])
  const body = JSON.stringify({
    v: visitorId(),
    s: sessionId(),
    l: config.l,
    g: config.g,
    dv: deviceType(),
    a: firstTouch(),
    e: queue.splice(0, 25),
  })
  if (!(beacon && navigator.sendBeacon && navigator.sendBeacon(URL_, body))) {
    fetch(URL_, { method: 'POST', body, keepalive: true, credentials: 'same-origin' })
      .then((r) => r.json())
      .then((r) => r.off && write(K_OFF, '1'))
      .catch(() => {})
  }
  if (queue.length) send(beacon)
}

export function track(event: AnalyticsEventName, props?: EventProps) {
  if (!hasWindow() || isOff()) return
  queue.push({ n: event, p: location.pathname, d: props })
  for (const l of listeners) {
    try {
      l(event, props || {})
    } catch {}
  }
  if (config) {
    if (event == 'form_submit') send()
    else timer = timer || setTimeout(send, 1000)
  }
}

export function getAttribution(): Attribution {
  if (!hasWindow()) return {}
  const f = firstTouch()
  return {
    visitorId: visitorId(),
    sessionId: sessionId(),
    utmSource: f.us,
    utmMedium: f.um,
    utmCampaign: f.uc,
    utmContent: f.ux,
    utmTerm: f.ut,
    referrer: f.r,
    landingPath: f.lp,
    device: deviceType(),
  }
}

export function onTrack(listener: Listener) {
  listeners.push(listener)
}

export function isTrackingOff(): boolean {
  return hasWindow() && isOff()
}

// ?notrack=1 — отключить учёт на этом устройстве (сотрудники), ?notrack=0 — вернуть.
export function initTracker(opts: { locale?: string; landing?: string }) {
  const flag = new URLSearchParams(location.search).get('notrack')
  if (flag) write(K_OFF, flag == '0' ? undefined : '1')
  const first = !config
  config = { l: opts.locale, g: opts.landing }
  firstTouch()
  if (first) {
    const flush = () => send(true)
    addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState == 'hidden') flush()
    })
  }
  if (queue.length) send()
}

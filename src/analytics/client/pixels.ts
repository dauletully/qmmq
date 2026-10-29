// Рекламные пиксели Meta и TikTok. Заглушки fbq/ttq создаются сразу и копят вызовы,
// а сами скрипты грузятся после первого взаимодействия или когда браузер простаивает,
// чтобы не мешать первой отрисовке. Соответствие событий — src/analytics/README.md.
import type { AnalyticsEventName } from '../shared'
import { onTrack, type EventProps } from './tracker'

export type PixelIds = { metaPixelId?: string | null; tiktokPixelId?: string | null }

/* eslint-disable @typescript-eslint/no-explicit-any */
type Fn = ((...args: any[]) => void) & Record<string, any>
type PixelWindow = Window & { fbq?: Fn; _fbq?: Fn; ttq?: any; TiktokAnalyticsObject?: string }

const TT_METHODS =
  'page track identify instances debug on off once ready alias group enableCookie disableCookie holdConsent revokeConsent grantConsent'.split(
    ' ',
  )

let started = false

function whenIdle(load: () => void) {
  const triggers = ['pointerdown', 'keydown', 'touchstart', 'scroll']
  let done = false
  const go = () => {
    if (done) return
    done = true
    for (const t of triggers) removeEventListener(t, go)
    load()
  }
  for (const t of triggers) addEventListener(t, go, { passive: true })
  const idle = () =>
    setTimeout(() => {
      const ric = (window as any).requestIdleCallback
      ric ? ric(go, { timeout: 3000 }) : go()
    }, 3500)
  if (document.readyState == 'complete') idle()
  else addEventListener('load', idle, { once: true })
}

function addScript(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

export function setupPixels({ metaPixelId, tiktokPixelId }: PixelIds) {
  if (started || (!metaPixelId && !tiktokPixelId)) return
  started = true
  const w = window as PixelWindow
  const scripts: string[] = []

  if (metaPixelId) {
    if (!w.fbq) {
      const n: Fn = function (...args: any[]) {
        n.callMethod ? n.callMethod(...args) : n.queue.push(args)
      } as Fn
      w.fbq = w._fbq = n
      n.push = n
      n.loaded = true
      n.version = '2.0'
      n.queue = []
      scripts.push('https://connect.facebook.net/en_US/fbevents.js')
    }
    w.fbq('init', metaPixelId)
  }

  if (tiktokPixelId) {
    if (!w.ttq) {
      const src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
      const ttq: any = (w.ttq = [])
      w.TiktokAnalyticsObject = 'ttq'
      ttq.methods = TT_METHODS
      ttq.setAndDefer = (t: any, e: string) => {
        t[e] = (...args: any[]) => t.push([e, ...args])
      }
      for (const m of TT_METHODS) ttq.setAndDefer(ttq, m)
      ttq.instance = (id: string) => {
        const e = ttq._i[id] || []
        for (const m of TT_METHODS) ttq.setAndDefer(e, m)
        return e
      }
      ttq._i = { [tiktokPixelId]: Object.assign([], { _u: src }) }
      ttq._t = { [tiktokPixelId]: +new Date() }
      ttq._o = { [tiktokPixelId]: {} }
      scripts.push(src + '?sdkid=' + tiktokPixelId + '&lib=ttq')
    }
  }

  const meta = (...args: unknown[]) => metaPixelId && w.fbq?.(...args)
  const tiktok = (method: string, ...args: unknown[]) => tiktokPixelId && w.ttq?.[method]?.(...args)

  onTrack((event: AnalyticsEventName, props: EventProps) => {
    if (event == 'page_view') {
      meta('track', 'PageView')
      tiktok('page')
    } else if (event == 'form_submit' && (props.form == 'registration' || props.form == 'school')) {
      // event_id совпадёт с серверной отправкой (Conversions API / Events API), если её подключат
      const id = props.leadId ? 'lead-' + props.leadId : 'ev-' + Date.now().toString(36)
      const data = { content_name: props.form }
      meta('track', 'Lead', data, { eventID: id })
      tiktok('track', props.form == 'registration' ? 'CompleteRegistration' : 'SubmitForm', data, {
        event_id: id,
      })
    } else if (event == 'whatsapp_click') {
      meta('track', 'Contact')
      tiktok('track', 'Contact')
    }
  })

  whenIdle(() => scripts.forEach(addScript))
}

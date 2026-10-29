import { eq } from '@payloadcms/db-postgres/drizzle'
import { isbot } from 'isbot'
import { after } from 'next/server'
import type { Endpoint, Payload } from 'payload'
import { z } from 'zod'

import { ANALYTICS_EVENTS, DEVICE_TYPES, EVENTS_TABLE, INGEST_PATH } from '../shared'
import { classifyChannel } from './channels'
import { drizzleOf } from './db'
import { allowRequest, clientIp } from './rateLimit'
import { parseUserAgent } from './userAgent'

const MAX_BODY = 16_384
const IP_LIMIT = 300 // запросов в минуту с одного IP (мобильные операторы — общий NAT)
const VISITOR_LIMIT = 60

const id = z.string().regex(/^[a-z0-9]{8,40}$/i)
const text = (max: number) =>
  z
    .string()
    .max(1000)
    .transform((s) => s.trim().slice(0, max) || undefined)
    .optional()
    .nullable()

const propValue = z.union([
  z.string().transform((s) => s.slice(0, 120)),
  z.number().finite(),
  z.boolean(),
  z.null(),
])

// Формат пакета от трекера (src/analytics/client/tracker.ts). Ключи короткие, чтобы трекер был лёгким.
const batchSchema = z.object({
  v: id, // visitorId
  s: id, // sessionId
  l: z.enum(['ru', 'kk']).optional().catch(undefined), // локаль
  g: z
    .string()
    .regex(/^[a-z0-9-]{1,64}$/i)
    .optional()
    .catch(undefined), // лендинг (slug)
  dv: z.enum(DEVICE_TYPES).optional().catch(undefined),
  a: z
    .object({
      us: text(100),
      um: text(100),
      uc: text(150),
      ux: text(150),
      ut: text(150),
      r: text(200),
      lp: text(200),
    })
    .partial()
    .optional(),
  e: z
    .array(
      z.object({
        n: z.enum(ANALYTICS_EVENTS),
        p: z.string().max(500).optional(),
        d: z
          .record(z.string().max(40), propValue)
          .refine((r) => Object.keys(r).length <= 10)
          .optional(),
      }),
    )
    .min(1)
    .max(25),
})

type Batch = z.infer<typeof batchSchema>

const cleanPath = (p?: string) => {
  if (!p || !p.startsWith('/')) return undefined
  return p.split(/[?#]/)[0].slice(0, 200)
}

const respond = (body: Record<string, unknown> | null, status = 200) =>
  body
    ? Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
    : new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })

// Запись — после ответа, чтобы приём не ждал базу.
function later(task: () => Promise<unknown>, payload: Payload) {
  const run = () =>
    task().catch((err) => payload.logger.error({ err }, 'analytics: не удалось записать события'))
  try {
    after(run)
  } catch {
    void run()
  }
}

function buildRows(batch: Batch, userAgent: string) {
  const ua = parseUserAgent(userAgent, batch.dv)
  const a = batch.a || {}
  const utmSource = a.us?.toLowerCase()
  const channel = classifyChannel({ utmSource, referrer: a.r, userAgent })
  return batch.e.map((e) => ({
    event: e.n,
    visitorId: batch.v,
    sessionId: batch.s,
    props: e.d && Object.keys(e.d).length ? e.d : null,
    path: cleanPath(e.p) ?? null,
    locale: batch.l ?? null,
    landing: batch.g ?? null,
    utmSource: utmSource ?? null,
    utmMedium: a.um?.toLowerCase() ?? null,
    utmCampaign: a.uc ?? null,
    utmContent: a.ux ?? null,
    utmTerm: a.ut ?? null,
    referrer: a.r ?? null,
    landingPath: cleanPath(a.lp ?? undefined) ?? null,
    channel,
    device: ua.device,
    browser: ua.browser,
    os: ua.os,
  }))
}

type EventsTable = { visitorId: never }
const eventsTable = (payload: Payload) =>
  (payload.db as unknown as { tables: Record<string, EventsTable> }).tables[EVENTS_TABLE]

export const ingestEndpoint: Endpoint = {
  path: INGEST_PATH,
  method: 'post',
  handler: async (req) => {
    const userAgent = req.headers.get('user-agent') || ''
    if (!userAgent || isbot(userAgent)) return respond(null, 204)

    if (!allowRequest(`ip:${clientIp(req.headers)}`, IP_LIMIT)) {
      return respond({ ok: 0, error: 'rate_limited' }, 429)
    }
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY) {
      return respond({ ok: 0, error: 'too_large' }, 413)
    }

    let batch: Batch
    try {
      const raw = (await req.text?.()) || ''
      if (raw.length > MAX_BODY) return respond({ ok: 0, error: 'too_large' }, 413)
      batch = batchSchema.parse(JSON.parse(raw))
    } catch {
      return respond({ ok: 0, error: 'invalid' }, 400)
    }

    if (!allowRequest(`v:${batch.v}`, VISITOR_LIMIT)) {
      return respond({ ok: 0, error: 'rate_limited' }, 429)
    }

    const { payload } = req

    // Сотрудник, вошедший в админку: не считаем и чистим то, что успело записаться с этого браузера.
    // Трекер по ответу off:1 запоминает это и больше ничего не шлёт.
    if (req.user) {
      later(async () => {
        const table = eventsTable(payload)
        await drizzleOf(payload)
          .delete(table as never)
          .where(eq(table.visitorId, batch.v))
      }, payload)
      return respond({ ok: 1, off: 1 })
    }

    const rows = buildRows(batch, userAgent)
    later(
      async () =>
        drizzleOf(payload)
          .insert(eventsTable(payload) as never)
          .values(rows as never),
      payload,
    )
    return respond({ ok: 1 })
  },
}

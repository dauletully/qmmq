import type { Endpoint, PayloadRequest } from 'payload'

import { type FormResult, handleFormCompletion, handleFormSubmission } from '../lib/forms/submit'
import { clientIp } from '../lib/rateLimit'

// POST /api/forms/:type — registration | school | regulations;
// PATCH /api/forms/registration/:id — второй шаг регистрации. См. docs/ARCHITECTURE.md, «API форм».

async function respond(req: PayloadRequest, run: (rawBody: string) => Promise<FormResult>) {
  try {
    const result = await run((await req.text?.()) ?? '')
    return Response.json(result.body, {
      status: result.status,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: 'forms: ошибка обработки формы' })
    return Response.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

export const formsEndpoint: Endpoint = {
  path: '/forms/:type',
  method: 'post',
  handler: (req) =>
    respond(req, (rawBody) =>
      handleFormSubmission({
        payload: req.payload,
        type: req.routeParams?.type as string | undefined,
        rawBody,
        ip: clientIp(req.headers),
      }),
    ),
}

export const formsCompleteEndpoint: Endpoint = {
  path: '/forms/registration/:id',
  method: 'patch',
  handler: (req) =>
    respond(req, (rawBody) =>
      handleFormCompletion({
        payload: req.payload,
        leadId: req.routeParams?.id as string | undefined,
        rawBody,
        ip: clientIp(req.headers),
      }),
    ),
}

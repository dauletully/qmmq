import type { Endpoint } from 'payload'

import { handleFormSubmission } from '../lib/forms/submit'
import { clientIp } from '../lib/rateLimit'

// POST /api/forms/:type — registration | school | regulations. См. docs/ARCHITECTURE.md, «API форм».
export const formsEndpoint: Endpoint = {
  path: '/forms/:type',
  method: 'post',
  handler: async (req) => {
    try {
      const rawBody = (await req.text?.()) ?? ''
      const result = await handleFormSubmission({
        payload: req.payload,
        type: req.routeParams?.type as string | undefined,
        rawBody,
        ip: clientIp(req.headers),
      })
      return Response.json(result.body, {
        status: result.status,
        headers: { 'Cache-Control': 'no-store' },
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'forms: ошибка обработки формы' })
      return Response.json({ ok: false, error: 'server_error' }, { status: 500 })
    }
  },
}

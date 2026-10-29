import type { Endpoint } from 'payload'

import { roleOf } from '../access'
import { labelOf, REGIONS, SUBJECTS } from '../lib/constants'

// GET /api/subscribers/export.csv — активные подписчики рассылки в CSV для Excel.
// Только для сотрудников (любая роль). Разделитель «;» и BOM — чтобы Excel на русской
// локали открывал файл двойным щелчком без мастера импорта.

const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const subscribersExportEndpoint: Endpoint = {
  path: '/subscribers/export.csv',
  method: 'get',
  handler: async (req) => {
    if (!roleOf(req.user)) {
      return Response.json({ ok: false, error: 'Недостаточно прав' }, { status: 403 })
    }
    const { docs } = await req.payload.find({
      collection: 'subscribers',
      where: { active: { equals: true } },
      sort: 'createdAt',
      limit: 0,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    const header = ['E-mail', 'Предмет', 'Регион', 'Язык', 'Откуда', 'Дата подписки']
    const rows = docs.map((d) => [
      d.email,
      labelOf(SUBJECTS, d.subject),
      labelOf(REGIONS, d.region),
      d.locale ?? 'ru',
      d.source ?? '',
      d.consentAt ? d.consentAt.slice(0, 10) : d.createdAt.slice(0, 10),
    ])
    const csv =
      '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
    const date = new Date().toISOString().slice(0, 10)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscribers-${date}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}

'use client'

import { Button } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import { callApi, muted, Note, Panel } from '../shared'

type Stats = { counts: Record<string, number>; disabledReason: string | null }

const listUrl = (status: string) =>
  `/admin/collections/leads?where[amo.syncStatus][equals]=${encodeURIComponent(status)}`

export function AmoQueue() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    const res = await callApi('/amocrm/queue')
    if (res.ok) setStats(res as unknown as Stats)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const waiting = (stats?.counts.disabled ?? 0) + (stats?.counts.failed ?? 0)

  const resendAll = async () => {
    setBusy(true)
    setMessage(null)
    const res = await callApi('/amocrm/resend', { body: { all: true } })
    setBusy(false)
    setMessage(
      res.ok
        ? {
            type: 'success',
            text: `Поставлено в очередь: ${String(res.queued)}. Отправка займёт до минуты.`,
          }
        : { type: 'error', text: res.error ?? 'Не удалось поставить в очередь' },
    )
    void load()
  }

  return (
    <Panel title="Отправка заявок">
      {stats ? (
        <ul style={{ margin: '0 0 12px', paddingLeft: 20, lineHeight: 1.7 }}>
          <li>
            Отправлены: <a href={listUrl('sent')}>{stats.counts.sent ?? 0}</a>
          </li>
          <li>
            В очереди: <a href={listUrl('pending')}>{stats.counts.pending ?? 0}</a>
          </li>
          <li>
            С ошибкой: <a href={listUrl('failed')}>{stats.counts.failed ?? 0}</a>
          </li>
          <li>
            Не отправлялись (amoCRM не была подключена):{' '}
            <a href={listUrl('disabled')}>{stats.counts.disabled ?? 0}</a>
          </li>
        </ul>
      ) : (
        <p style={muted}>Загружаем…</p>
      )}
      {stats?.disabledReason ? (
        <Note type="warning">Сейчас заявки не уходят в amoCRM: {stats.disabledReason}.</Note>
      ) : null}
      <Button
        buttonStyle="primary"
        size="medium"
        onClick={resendAll}
        disabled={busy || waiting === 0 || Boolean(stats?.disabledReason)}
        margin={false}
      >
        {busy ? 'Ставим в очередь…' : `Отправить неотправленные заявки (${waiting})`}
      </Button>
      <p style={muted}>
        Отправляет заявки со статусами «Ошибка» и «Не отправлялась». Сначала сохраните настройки.
      </p>
      {message ? <Note type={message.type}>{message.text}</Note> : null}
    </Panel>
  )
}

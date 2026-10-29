'use client'

import { Button, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { callApi, muted, Note } from '../shared'

const STATUS_TEXT: Record<
  string,
  { text: string; type: 'success' | 'error' | 'warning' | 'info' }
> = {
  sent: { text: 'Отправлена в amoCRM', type: 'success' },
  pending: { text: 'В очереди на отправку', type: 'info' },
  failed: { text: 'Не удалось отправить', type: 'error' },
  disabled: { text: 'Не отправлялась: amoCRM не подключена', type: 'warning' },
}

type Info = {
  dealUrl: string | null
  pipelineName: string | null
  statusName: string | null
  disabledReason: string | null
  canResend: boolean
}

// Сводка по отправке в amoCRM и кнопка повторной отправки — в боковой панели заявки.
export function AmoLeadPanel() {
  const { id } = useDocumentInfo()
  const syncStatus = useFormFields(([f]) => f['amo.syncStatus']?.value as string | undefined)
  const leadId = useFormFields(([f]) => f['amo.leadId']?.value as number | undefined)
  const pipelineId = useFormFields(([f]) => f['amo.pipelineId']?.value as number | undefined)
  const statusId = useFormFields(([f]) => f['amo.statusId']?.value as number | undefined)
  const [info, setInfo] = useState<Info | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (leadId) params.set('leadId', String(leadId))
    if (pipelineId) params.set('pipelineId', String(pipelineId))
    if (statusId) params.set('statusId', String(statusId))
    void callApi(`/amocrm/lead-info?${params}`).then((res) => {
      if (res.ok) setInfo(res as unknown as Info)
    })
  }, [leadId, pipelineId, statusId])

  const resend = async () => {
    setBusy(true)
    setMessage(null)
    const res = await callApi('/amocrm/resend', { body: { id } })
    setBusy(false)
    if (res.ok) {
      setMessage({ type: 'success', text: 'Поставлено в очередь. Обновляем страницу…' })
      setTimeout(() => window.location.reload(), 6000)
    } else {
      setMessage({ type: 'error', text: res.error ?? 'Не удалось поставить в очередь' })
    }
  }

  const status = STATUS_TEXT[syncStatus ?? ''] ?? STATUS_TEXT.pending
  const canResend = Boolean(info?.canResend) && syncStatus !== 'sent' && id

  return (
    <div style={{ marginBottom: 16 }}>
      <Note type={status.type}>
        <b>{status.text}</b>
      </Note>
      {info?.dealUrl ? (
        <p style={{ margin: '4px 0' }}>
          <a href={info.dealUrl} target="_blank" rel="noreferrer">
            Открыть сделку №{leadId} в amoCRM ↗
          </a>
        </p>
      ) : null}
      {info?.statusName ? (
        <p style={{ margin: '4px 0' }}>
          Этап: <b>{info.statusName}</b>
          {info.pipelineName ? <span style={muted}> · {info.pipelineName}</span> : null}
        </p>
      ) : null}
      {syncStatus === 'disabled' && info?.disabledReason ? (
        <p style={muted}>{info.disabledReason}</p>
      ) : null}
      {canResend ? (
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={resend}
          disabled={busy}
          margin={false}
        >
          {busy ? 'Ставим в очередь…' : 'Отправить в amoCRM повторно'}
        </Button>
      ) : null}
      {message ? <Note type={message.type}>{message.text}</Note> : null}
    </div>
  )
}

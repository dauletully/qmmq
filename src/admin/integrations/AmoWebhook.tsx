'use client'

import { Button, CopyToClipboard, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { callApi, muted, Note, Panel } from '../shared'

export function AmoWebhook({ siteUrl }: { siteUrl?: string }) {
  const secretField = useFormFields(([fields]) => fields['amocrm.webhookSecret'])
  const [origin, setOrigin] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => setOrigin(window.location.origin), [])

  const secret = (secretField?.value as string | undefined) ?? ''
  const savedSecret = (secretField?.initialValue as string | undefined) ?? ''
  const base = (siteUrl || origin).replace(/\/+$/, '')
  const url = secret ? `${base}/api/amocrm/webhook?secret=${encodeURIComponent(secret)}` : ''
  const isPublic = base.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(base)

  const register = async () => {
    setBusy(true)
    setMessage(null)
    const res = await callApi('/amocrm/register-webhook', { body: {} })
    setBusy(false)
    setMessage(
      res.ok
        ? { type: 'success', text: `Вебхук подключён: ${String(res.destination)}` }
        : { type: 'error', text: res.error ?? 'Не удалось подключить вебхук' },
    )
  }

  return (
    <Panel title="Вебхук: оплаты из amoCRM">
      <p style={muted}>
        amoCRM сообщает сайту о смене этапа сделки. Так заявка отмечается оплаченной, а отчёты
        аналитики считают оплаты по источникам.
      </p>
      {url ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            padding: '8px 12px',
            background: 'var(--theme-elevation-50)',
            borderRadius: 'var(--style-radius-s, 3px)',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          <span style={{ flex: 1 }}>{url}</span>
          <CopyToClipboard value={url} defaultMessage="Скопировать" successMessage="Скопировано" />
        </div>
      ) : (
        <Note type="warning">Сохраните настройки — будет создан секрет и адрес вебхука.</Note>
      )}
      {secret && secret !== savedSecret ? (
        <Note type="warning">
          Секрет изменён, но не сохранён — адрес заработает после сохранения.
        </Note>
      ) : null}
      {!siteUrl ? (
        <Note type="warning">
          На сервере не задана переменная SITE_URL — адрес собран из текущего адреса админки.
        </Note>
      ) : null}
      {!isPublic ? (
        <Note type="warning">
          amoCRM принимает только публичный адрес https — подключайте вебхук на рабочем сайте.
        </Note>
      ) : null}
      <p style={{ margin: '12px 0 8px' }}>
        Куда вставить: amoCRM → амоМаркет → «⋯» вверху справа → <b>«Web hooks»</b> → «Добавить хук»
        → вставьте адрес и отметьте событие смены этапа (статуса) сделки → «Сохранить».
      </p>
      <Button
        buttonStyle="secondary"
        size="medium"
        onClick={register}
        disabled={busy || !url}
        margin={false}
      >
        {busy ? 'Подключаем…' : 'Подключить автоматически'}
      </Button>
      {message ? <Note type={message.type}>{message.text}</Note> : null}
    </Panel>
  )
}

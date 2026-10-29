'use client'

import { Button, useFormFields } from '@payloadcms/ui'
import React, { useState } from 'react'

import { callApi, Note } from '../shared'

export function AmoConnection() {
  const baseUrl = useFormFields(([fields]) => fields['amocrm.baseUrl']?.value as string | undefined)
  const accessToken = useFormFields(
    ([fields]) => fields['amocrm.accessToken']?.value as string | undefined,
  )
  const [state, setState] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const check = async () => {
    setBusy(true)
    setState(null)
    const res = await callApi('/amocrm/check', { body: { baseUrl, accessToken } })
    setBusy(false)
    if (res.ok) {
      const account = res.account as { name?: string; subdomain?: string }
      setState({
        type: 'success',
        text: `Подключено: аккаунт «${account?.name ?? ''}» (${account?.subdomain ?? ''}). Не забудьте сохранить настройки.`,
      })
    } else {
      setState({ type: 'error', text: res.error ?? 'Не удалось подключиться' })
    }
  }

  return (
    <div style={{ marginBottom: 'var(--base, 20px)' }}>
      <Button buttonStyle="secondary" size="medium" onClick={check} disabled={busy} margin={false}>
        {busy ? 'Проверяем…' : 'Проверить подключение'}
      </Button>
      {state ? <Note type={state.type}>{state.text}</Note> : null}
    </div>
  )
}

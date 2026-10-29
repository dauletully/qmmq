'use client'

import { Button, useField, useFormFields } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import React, { useState } from 'react'

import { AMO_LEAD_FIELDS, AMO_UTM_CODES, type AmoFieldMap } from '../../lib/amocrm/fields'
import { callApi, muted, Note, Panel } from '../shared'

export const AmoFieldsSetup: JSONFieldClientComponent = (props) => {
  const { value, setValue } = useField<AmoFieldMap | null>({
    path: props.path ?? 'amocrm.fieldMap',
  })
  const baseUrl = useFormFields(([fields]) => fields['amocrm.baseUrl']?.value as string | undefined)
  const accessToken = useFormFields(
    ([fields]) => fields['amocrm.accessToken']?.value as string | undefined,
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const mapped = value?.fields ?? {}
  const utmCount = Object.keys(value?.utm ?? {}).length

  const run = async () => {
    setBusy(true)
    setMessage(null)
    const res = await callApi('/amocrm/setup-fields', { body: { baseUrl, accessToken } })
    setBusy(false)
    if (!res.ok) {
      setMessage({ type: 'error', text: res.error ?? 'Не удалось создать поля' })
      return
    }
    setValue(res.fieldMap as AmoFieldMap)
    const created = (res.created as string[]) ?? []
    const existing = (res.existing as string[]) ?? []
    const utm = (res.utmFound as string[]) ?? []
    setMessage({
      type: 'success',
      text: [
        created.length
          ? `Созданы поля: ${created.join(', ')}.`
          : 'Новых полей создавать не пришлось.',
        existing.length ? `Уже были: ${existing.join(', ')}.` : '',
        `Стандартные UTM-поля найдены: ${utm.length} из ${Object.keys(AMO_UTM_CODES).length}.`,
        'Карта полей сохранена.',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  }

  return (
    <Panel title="Поля сделки">
      <p style={muted}>
        Кроме примечания с полным текстом заявки, данные раскладываются по полям сделки — по ним
        удобно фильтровать в amoCRM. Кнопка создаёт недостающие поля и запоминает их номера.
        Повторное нажатие безопасно.
      </p>
      <ul style={{ margin: '8px 0 12px', paddingLeft: 20, lineHeight: 1.6 }}>
        {AMO_LEAD_FIELDS.map((f) => (
          <li key={f.key}>
            {f.name}{' '}
            <span style={muted}>
              {mapped[f.key]?.id ? `— поле №${mapped[f.key]!.id}` : '— ещё не создано'}
            </span>
          </li>
        ))}
        <li>
          UTM-метки{' '}
          <span style={muted}>
            — в стандартные поля сделки{utmCount ? ` (найдено ${utmCount})` : ''}
          </span>
        </li>
      </ul>
      <Button buttonStyle="secondary" size="medium" onClick={run} disabled={busy} margin={false}>
        {busy ? 'Создаём…' : 'Создать поля в amoCRM'}
      </Button>
      {message ? <Note type={message.type}>{message.text}</Note> : null}
    </Panel>
  )
}

'use client'

import { Button, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import React, { useState } from 'react'

import type { CachedPipeline } from '../../lib/integrations'
import { callApi, muted, Note, Panel, selectStyle, siblingPath } from '../shared'

// Системные этапы amoCRM: 142 — «Успешно реализовано», 143 — «Закрыто и не реализовано».
const CLOSED_LOST = 143

export const AmoPipelinePicker: JSONFieldClientComponent = (props) => {
  const path = props.path ?? 'amocrm.pipelinesCache'
  const cache = useField<CachedPipeline[] | null>({ path })
  const pipelineField = useField<number | null>({ path: siblingPath(path, 'pipelineId') })
  const newStatusField = useField<number | null>({ path: siblingPath(path, 'newStatusId') })
  const paidField = useField<number[] | null>({ path: siblingPath(path, 'paidStatusIds') })
  const baseUrl = useFormFields(([fields]) => fields['amocrm.baseUrl']?.value as string | undefined)
  const accessToken = useFormFields(
    ([fields]) => fields['amocrm.accessToken']?.value as string | undefined,
  )

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pipelines = Array.isArray(cache.value) ? cache.value : []
  const pipelineId = pipelineField.value ?? null
  const pipeline = pipelines.find((p) => p.id === pipelineId)
  const statuses = pipeline?.statuses ?? []
  const paid = Array.isArray(paidField.value) ? paidField.value : []

  const load = async () => {
    setBusy(true)
    setError(null)
    const res = await callApi('/amocrm/pipelines', { body: { baseUrl, accessToken } })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Не удалось загрузить воронки')
      return
    }
    const list = (res.pipelines as CachedPipeline[]) ?? []
    cache.setValue(list)
    if (!pipelineId && list.length === 1) choosePipeline(list[0].id, list)
  }

  const choosePipeline = (id: number | null, list = pipelines) => {
    pipelineField.setValue(id)
    const next = list.find((p) => p.id === id)
    // Этап по умолчанию — первый обычный этап воронки (после «Неразобранного»).
    const firstStage =
      next?.statuses.find((s, i) => i > 0 && s.id !== 142 && s.id !== CLOSED_LOST) ??
      next?.statuses[0]
    newStatusField.setValue(firstStage?.id ?? null)
    paidField.setValue(next?.statuses.some((s) => s.id === 142) ? [142] : [])
  }

  const togglePaid = (id: number) => {
    paidField.setValue(paid.includes(id) ? paid.filter((x) => x !== id) : [...paid, id])
  }

  return (
    <Panel title="Воронка и этапы">
      <p style={muted}>
        Сделки с сайта попадают в выбранную воронку на выбранный этап. Когда менеджер переводит
        сделку на этап «Оплачено», заявка на сайте отмечается оплаченной (нужен вебхук ниже).
      </p>
      <Button buttonStyle="secondary" size="medium" onClick={load} disabled={busy} margin={false}>
        {busy ? 'Загружаем…' : pipelines.length ? 'Обновить список воронок' : 'Загрузить воронки'}
      </Button>
      {error ? <Note type="error">{error}</Note> : null}

      {pipelines.length > 0 ? (
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div>
            <FieldLabel label="Воронка" path="amoPipelineSelect" />
            <select
              id="amoPipelineSelect"
              style={selectStyle}
              value={pipelineId ?? ''}
              onChange={(e) => choosePipeline(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— не выбрана (главная воронка аккаунта) —</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.isMain ? ' (главная)' : ''}
                </option>
              ))}
            </select>
          </div>

          {pipeline ? (
            <>
              <div>
                <FieldLabel label="Этап для новых заявок" path="amoNewStatusSelect" />
                <select
                  id="amoNewStatusSelect"
                  style={selectStyle}
                  value={newStatusField.value ?? ''}
                  onChange={(e) =>
                    newStatusField.setValue(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">— первый этап воронки —</option>
                  {statuses
                    .filter((s) => s.id !== 142 && s.id !== CLOSED_LOST)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <FieldLabel label="Этапы, которые означают «оплачено»" path="amoPaidStatuses" />
                <div id="amoPaidStatuses" style={{ display: 'grid', gap: 6 }}>
                  {statuses
                    .filter((s) => s.id !== CLOSED_LOST)
                    .map((s) => (
                      <label
                        key={s.id}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={paid.includes(s.id)}
                          onChange={() => togglePaid(s.id)}
                        />
                        <span>{s.name}</span>
                      </label>
                    ))}
                </div>
                <p style={muted}>
                  Отметьте этап «Оплачено» (если он есть) и все этапы после него, включая «Успешно
                  реализовано».
                </p>
              </div>
            </>
          ) : pipelineId ? (
            <Note type="warning">
              Выбранной воронки (ID {pipelineId}) нет в списке — обновите список.
            </Note>
          ) : null}
        </div>
      ) : pipelineId ? (
        <Note>Сохранена воронка ID {pipelineId}. Загрузите список, чтобы увидеть названия.</Note>
      ) : null}
    </Panel>
  )
}

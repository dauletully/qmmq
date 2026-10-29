'use client'

import { Button } from '@payloadcms/ui'
import React from 'react'

import { muted, Panel } from '../shared'

// Кнопка над списком подписчиков: выгрузка активных подписчиков в CSV для Excel
// (GET /api/subscribers/export.csv — только для сотрудников).
export function ExportButton() {
  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Button
          el="link"
          url="/api/subscribers/export.csv"
          buttonStyle="secondary"
          size="medium"
          margin={false}
        >
          Скачать CSV (Excel)
        </Button>
        <span style={muted}>
          Активные подписчики: e-mail, предмет, регион, язык, дата. Файл открывается в Excel
          двойным щелчком; разделитель — точка с запятой.
        </span>
      </div>
    </Panel>
  )
}

'use client'

import React from 'react'

// Общие мелочи для кастомных компонентов админки.

export type ApiResult = { ok: boolean; error?: string; [key: string]: unknown }

export async function callApi(
  path: string,
  init?: { method?: 'GET' | 'POST'; body?: unknown },
): Promise<ApiResult> {
  try {
    const res = await fetch(`/api${path}`, {
      method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
      credentials: 'include',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
    const data = (await res.json().catch(() => ({}))) as ApiResult
    if (!res.ok && data.ok !== false) return { ok: false, error: `Ошибка сервера (${res.status})` }
    return data
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Нет связи с сервером' }
  }
}

export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m, 4px)',
        padding: '16px 20px',
        marginBottom: 'var(--base, 20px)',
        background: 'var(--theme-elevation-0)',
      }}
    >
      {title ? <h4 style={{ margin: '0 0 8px' }}>{title}</h4> : null}
      {children}
    </div>
  )
}

export function Note({
  type = 'info',
  children,
}: {
  type?: 'info' | 'success' | 'error' | 'warning'
  children: React.ReactNode
}) {
  const colors: Record<string, string> = {
    info: 'var(--theme-elevation-500)',
    success: 'var(--theme-success-500, #2e7d32)',
    error: 'var(--theme-error-500, #c62828)',
    warning: 'var(--theme-warning-500, #b26a00)',
  }
  return (
    <div style={{ color: colors[type], margin: '8px 0', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
      {children}
    </div>
  )
}

export const muted: React.CSSProperties = { color: 'var(--theme-elevation-500)', fontSize: '13px' }

export const selectStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  minHeight: 40,
  padding: '6px 10px',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s, 3px)',
  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
  color: 'var(--theme-text)',
  fontSize: 'inherit',
}

export function siblingPath(path: string, name: string): string {
  const i = path.lastIndexOf('.')
  return i === -1 ? name : `${path.slice(0, i)}.${name}`
}

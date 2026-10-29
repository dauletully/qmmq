'use client'

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import type { z } from 'zod'

import { type EventProps, getAttribution, track } from '@/analytics/client'
import { getDict } from '@/i18n/dictionary'
import type { FormType, Locale } from '@/lib/constants'
import { formErrorMessage } from '@/lib/forms/messages'

type SchemasModule = typeof import('@/lib/forms/schemas')

// Схемы zod (общие с сервером) весят ~90 КБ: грузим их отдельным файлом, когда форма появилась
// на экране или открыт лист, — первый экран их не ждёт.
let schemasPromise: Promise<SchemasModule> | null = null
export function loadSchemas(): Promise<SchemasModule> {
  schemasPromise ??= import('@/lib/forms/schemas')
  return schemasPromise
}

// Сервер отсекает формы, отправленные быстрее чем через 3 с после открытия (MIN_FILL_MS).
const MIN_FILL_MS = 3200

export type FieldValues = Record<string, unknown>

// Что именно отправляем: схема для проверки, метод и адрес, дополнительные поля тела.
export type Submission = {
  schema: z.ZodType
  method: 'POST' | 'PATCH'
  path: string
  body?: Record<string, unknown>
}

type Options<V extends FieldValues> = {
  kind: FormType
  landing: string
  locale: Locale
  initial: V
  // Порядок полей — для сводки ошибок.
  order: string[]
  // Значения формы → поля API (например, телефон: 10 цифр → +7XXXXXXXXXX).
  toFields: (values: V) => Record<string, unknown>
  // По умолчанию — POST /api/forms/:kind со схемой формы. Регистрация в два шага подменяет.
  prepare?: (mod: SchemasModule, values: V) => Submission
  // Дополнительные свойства событий аналитики (например, step).
  eventProps?: () => EventProps
  onSuccess: (json: Record<string, unknown>) => void
}

export type ErrorMap = Record<string, string>

// Текст ошибки по ключу из схемы; тексты — в словаре вёрстки, остальное — src/lib/forms/messages.ts.
export function errorText(field: string, key: string, values: FieldValues, locale: Locale): string {
  const e = getDict(locale).form.errors
  if (field === 'consent') return e.consent_required
  if (field === 'phone') {
    const digits = String(values.phone ?? '').replace(/\D/g, '')
    if (key === 'required' || digits.length < 10) return digits ? e.phoneIncomplete : e.required
    return formErrorMessage('invalid_phone', locale)
  }
  if (field === 'subject' || field === 'region' || field === 'subjects') return e[field]
  if (field === 'participantsCount') return e.participantsCount
  if (field === 'fullName' && key === 'too_short') return e.fullNameShort
  if (key === 'required') return e.required
  if (e[key]) return e[key]
  return formErrorMessage(key, locale)
}

export function useLeadForm<V extends FieldValues>(opts: Options<V>) {
  const { kind, landing, locale, order, toFields } = opts
  const [values, setValues] = useState<V>(opts.initial)
  const [errors, setErrors] = useState<ErrorMap>({})
  const [summary, setSummary] = useState<string[] | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [summaryNonce, setSummaryNonce] = useState(0)
  const startedAt = useRef(0)
  // Нажатие на «Отправить»: не показываем ошибку от ухода с поля — иначе форма сдвигается
  // под пальцем и нажатие не попадает в кнопку. Всё проверит отправка.
  const holdBlurAt = useRef(0)
  const started = useRef(false)
  const hpRef = useRef<HTMLInputElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const optsRef = useRef(opts)
  const schemas = useRef<SchemasModule | null>(null)
  useEffect(() => {
    optsRef.current = opts
  })

  const ensureSchemas = useCallback(async () => {
    schemas.current ??= await loadSchemas()
    return schemas.current
  }, [])

  const prepare = useCallback(
    (mod: SchemasModule, vals: V): Submission =>
      optsRef.current.prepare?.(mod, vals) ?? {
        schema: mod.formSchemas[kind],
        method: 'POST',
        path: `/api/forms/${kind}`,
      },
    [kind],
  )

  const eventProps = (): EventProps => ({ form: kind, ...optsRef.current.eventProps?.() })

  // Синхронная проверка — когда схемы уже загружены (после первого касания формы).
  const validate = useCallback(
    (vals: V, mod: SchemasModule | null = schemas.current): ErrorMap => {
      if (!mod) return {}
      const res = prepare(mod, vals).schema.safeParse(toFields(vals))
      if (res.success) return {}
      const keys = mod.fieldErrors(res.error)
      const out: ErrorMap = {}
      for (const [field, key] of Object.entries(keys))
        out[field] = errorText(field, key, vals, locale)
      return out
    },
    [prepare, toFields, locale],
  )

  const begin = useCallback(() => {
    startedAt.current = Date.now()
    started.current = false
  }, [])

  // Лист открыли — заодно подгружаем схемы.
  const open = useCallback(() => {
    begin()
    void ensureSchemas()
  }, [begin, ensureSchemas])

  const reset = useCallback(() => {
    setValues(optsRef.current.initial)
    setErrors({})
    setSummary(null)
    setFormError(null)
    setSending(false)
    begin()
  }, [begin])

  // Новый этап той же формы (второй шаг): form_start сработает снова, время открытия не сбрасываем.
  const nextStage = useCallback(() => {
    started.current = false
    setErrors({})
    setSummary(null)
    setFormError(null)
    setSending(false)
  }, [])

  useEffect(() => {
    begin()
  }, [begin])

  useEffect(() => {
    if (summaryNonce) summaryRef.current?.focus()
  }, [summaryNonce])

  function markStarted() {
    if (started.current) return
    started.current = true
    track('form_start', eventProps())
    void ensureSchemas()
  }

  function setMany(patch: Partial<V>) {
    markStarted()
    const next = { ...values, ...patch }
    setValues(next)
    // Уже показанную ошибку пересчитываем на лету — исчезает, как только поле исправлено.
    const shown = Object.keys(patch).filter((f) => errors[f])
    if (!shown.length) return
    const errs = validate(next)
    setErrors((cur) => {
      const copy = { ...cur }
      for (const f of shown) {
        if (errs[f]) copy[f] = errs[f]
        else delete copy[f]
      }
      return copy
    })
  }

  function set<K extends keyof V & string>(field: K, value: V[K]) {
    setMany({ [field]: value } as unknown as Partial<V>)
  }

  // Ошибка — при уходе с поля (если в нём что-то есть) и при отправке, не на каждый символ.
  async function blur(field: string) {
    if (Date.now() - holdBlurAt.current < 800) return
    const v = values[field]
    const empty = v === '' || v === undefined || v === null || v === false
    if (empty && !errors[field]) return
    const errs = validate(values, await ensureSchemas())
    setErrors((cur) => {
      const copy = { ...cur }
      if (errs[field]) copy[field] = errs[field]
      else delete copy[field]
      return copy
    })
  }

  function showErrors(errs: ErrorMap) {
    setErrors(errs)
    const list = order.filter((f) => errs[f])
    for (const f of Object.keys(errs)) if (!list.includes(f)) list.push(f)
    setSummary(list)
    setSummaryNonce((n) => n + 1)
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (sending) return
    setFormError(null)
    let mod: SchemasModule
    try {
      mod = await ensureSchemas()
    } catch {
      setFormError(getDict(locale).form.errors.network)
      setSummaryNonce((n) => n + 1)
      return
    }
    const errs = validate(values, mod)
    if (Object.keys(errs).length) {
      showErrors(errs)
      for (const field of Object.keys(errs)) track('form_error', { ...eventProps(), field })
      return
    }
    setSummary(null)
    setSending(true)
    const wait = startedAt.current + MIN_FILL_MS - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    const t = getDict(locale)
    const sub = prepare(mod, values)
    try {
      const res = await fetch(sub.path, {
        method: sub.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing,
          locale,
          fields: toFields(values),
          attribution: getAttribution(),
          hp: hpRef.current?.value ?? '',
          startedAt: startedAt.current,
          ...sub.body,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (res.ok && json.ok) {
        track('form_submit', { ...eventProps(), leadId: json.leadId as number | undefined })
        optsRef.current.onSuccess(json)
        return
      }
      setSending(false)
      if (res.status === 400 && json.errors && typeof json.errors === 'object') {
        const out: ErrorMap = {}
        for (const [field, key] of Object.entries(json.errors as Record<string, string>)) {
          out[field] = errorText(field, key, values, locale)
          track('form_error', { ...eventProps(), field })
        }
        showErrors(out)
        return
      }
      const key = typeof json.error === 'string' ? json.error : 'server_error'
      track('form_error', { ...eventProps(), field: key })
      setFormError(
        key === 'rate_limited'
          ? t.form.errors.rate_limited
          : formErrorMessage(key === 'too_fast' ? key : 'server_error', locale),
      )
      setSummaryNonce((n) => n + 1)
    } catch {
      setSending(false)
      track('form_error', { ...eventProps(), field: 'network' })
      setFormError(t.form.errors.network)
      setSummaryNonce((n) => n + 1)
    }
  }

  function holdBlur() {
    holdBlurAt.current = Date.now()
  }

  return {
    holdBlur,
    values,
    errors,
    summary,
    formError,
    sending,
    set,
    setMany,
    blur,
    submit,
    reset,
    begin,
    open,
    nextStage,
    hpRef,
    summaryRef,
  }
}

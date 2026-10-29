'use client'

import { Check, ChevronDown, CircleAlert } from 'lucide-react'
import {
  type ChangeEvent,
  type ClipboardEvent,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
} from 'react'

import type { Dict } from '@/i18n/dictionary'

export function ErrorText({ id, text }: { id: string; text?: string }) {
  if (!text) return null
  return (
    <p className="q-error" id={id}>
      <CircleAlert className="q-icon" aria-hidden="true" />
      {text}
    </p>
  )
}

export function Field({
  id,
  label,
  required,
  optional,
  error,
  hint,
  hintId,
  children,
  className,
}: {
  id: string
  label: ReactNode
  required?: boolean
  optional?: string
  error?: string
  hint?: ReactNode
  hintId?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`q-field${className ? ` ${className}` : ''}`}>
      <label className="q-label" htmlFor={id}>
        {label}
        {required && (
          <span className="q-req" aria-hidden="true">
            *
          </span>
        )}
        {optional && (
          <>
            {' '}
            <span className="q-opt">{optional}</span>
          </>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="q-hint" id={hintId}>
          {hint}
        </p>
      )}
      <ErrorText id={`${id}-e`} text={error} />
    </div>
  )
}

// aria-describedby: ошибка или подсказка
export function describedBy(id: string, error?: string, hintId?: string) {
  return error ? `${id}-e` : hintId
}

export function Select({
  id,
  value,
  placeholder,
  options,
  error,
  onChange,
  onBlur,
  required,
  describedById,
}: {
  id: string
  value: string
  placeholder: string
  options: Array<{ value: string; label: string }>
  error?: string
  onChange: (v: string) => void
  onBlur?: () => void
  required?: boolean
  describedById?: string
}) {
  return (
    <div className="q-select">
      <select
        id={id}
        className={`q-input${value ? '' : ' is-placeholder'}${error ? ' is-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="q-icon q-select__chev" aria-hidden="true" />
    </div>
  )
}

// ---------- Телефон: «+7» неизменяемым префиксом, 10 цифр, маска (7XX) XXX-XX-XX ----------

export function maskPhone(d: string): string {
  if (!d) return ''
  let out = `(${d.slice(0, 3)}`
  if (d.length > 3) out += `) ${d.slice(3, 6)}`
  if (d.length > 6) out += `-${d.slice(6, 8)}`
  if (d.length > 8) out += `-${d.slice(8, 10)}`
  return out
}

// Вставка «+7 701…», «8 701…», «8(701)…»: лишняя 7/8 в начале отбрасывается.
export function normalizePhoneDigits(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.length > 10 && (d[0] === '7' || d[0] === '8')) d = d.slice(1)
  if (d[0] === '8') d = d.slice(1)
  return d.slice(0, 10)
}

function caretAfterDigits(masked: string, n: number): number {
  if (n <= 0) return masked ? 1 : 0
  let count = 0
  for (let i = 0; i < masked.length; i++) {
    if (/\d/.test(masked[i]!)) count++
    if (count === n) return i + 1
  }
  return masked.length
}

export function PhoneInput({
  id,
  digits,
  error,
  onChange,
  onBlur,
  describedById,
}: {
  id: string
  digits: string
  error?: string
  onChange: (digits: string) => void
  onBlur?: () => void
  describedById?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)
  const masked = maskPhone(digits)

  useLayoutEffect(() => {
    const el = ref.current
    if (caret.current === null || !el || document.activeElement !== el) return
    const pos = caretAfterDigits(el.value, caret.current)
    el.setSelectionRange(pos, pos)
    caret.current = null
  }, [digits])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const at = e.target.selectionStart ?? raw.length
    let before = raw.slice(0, at).replace(/\D/g, '').length
    let d = raw.replace(/\D/g, '')
    const inserted = raw.length - masked.length
    if (d.length > 10) {
      if (!digits || inserted > 1) {
        // автозаполнение или вставка целого номера
        d = normalizePhoneDigits(raw)
        before = d.length
      } else {
        // больше 10 цифр ввести нельзя
        d = digits
        before = Math.min(before, 10) - 1
      }
    } else if (d === digits && raw.length < masked.length && before > 0) {
      // стёрли скобку, пробел или дефис — стираем цифру перед ними
      d = d.slice(0, before - 1) + d.slice(before)
      before -= 1
    }
    if (!digits && d[0] === '8') {
      // ведущая 8 (привычка «8 701…») — после +7 номер начинается с 7
      d = d.slice(1)
      before = Math.max(0, before - 1)
    }
    caret.current = before
    onChange(d.slice(0, 10))
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (!text) return
    e.preventDefault()
    const d = normalizePhoneDigits(text)
    caret.current = d.length
    onChange(d)
  }

  return (
    <div className={`q-phone${error ? ' is-error' : ''}`}>
      <span className="q-phone__code" aria-hidden="true">
        +7
      </span>
      <input
        ref={ref}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(___) ___-__-__"
        value={masked}
        maxLength={15}
        onChange={handleChange}
        onPaste={handlePaste}
        onBlur={onBlur}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
      />
    </div>
  )
}

export function Checkbox({
  id,
  checked,
  error,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  error?: string
  onChange: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="q-field" style={{ gap: 0 }}>
      <label className={`q-check${checked ? ' is-checked' : ''}${error ? ' is-error' : ''}`}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : undefined}
        />
        <span className="q-check__box" aria-hidden="true">
          <Check className="q-icon" />
        </span>
        <span>{children}</span>
      </label>
      <ErrorText id={`${id}-e`} text={error} />
    </div>
  )
}

// Сводка ошибок над формой: число полей и ссылки к ним. Фокус переходит сюда при отправке.
export function Summary({
  t,
  summaryRef,
  fields,
  ids,
  formError,
}: {
  t: Dict
  summaryRef: RefObject<HTMLDivElement | null>
  fields: string[] | null
  ids: Record<string, string>
  formError: string | null
}) {
  if (!formError && !fields?.length) return null
  return (
    <div className="q-summary" role="alert" tabIndex={-1} ref={summaryRef}>
      <CircleAlert className="q-icon" aria-hidden="true" />
      {formError ? (
        <p>{formError}</p>
      ) : (
        <p>
          <b style={{ fontWeight: 600 }}>{t.form.summary(fields!.length)}</b>{' '}
          {fields!.map((f, i) => (
            <span key={f}>
              <a
                href={`#${ids[f] ?? f}`}
                onClick={(e) => {
                  const el = document.getElementById(ids[f] ?? f)
                  if (!el) return
                  e.preventDefault()
                  el.scrollIntoView({ block: 'center' })
                  el.focus({ preventScroll: true })
                }}
              >
                {t.form.fieldNames[f] ?? f}
              </a>
              {i < fields!.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

export function Honeypot({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  return (
    <div className="lp-hp" aria-hidden="true">
      <label>
        Website
        <input ref={inputRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

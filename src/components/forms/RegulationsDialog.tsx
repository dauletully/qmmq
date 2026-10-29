'use client'

import { CircleCheck, Download, FileText } from 'lucide-react'
import { useState } from 'react'

import { track } from '@/analytics/client'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/lib/constants'

import { type DocLinks, renderConsent } from './consent'
import { Checkbox, describedBy, ErrorText, Field, Honeypot, PhoneInput, Summary } from './fields'
import { Sheet } from './Sheet'
import { useLeadForm } from './useLeadForm'

type Props = {
  landing: string
  locale: Locale
  docs: DocLinks
}

type Values = { fullName: string; phone: string; email: string; consent: boolean }

const ORDER = ['fullName', 'phone', 'email', 'consent']
const IDS: Record<string, string> = {
  fullName: 'd-name',
  phone: 'd-phone',
  email: 'd-email',
  consent: 'd-consent',
}

const toFields = (v: Values) => ({ ...v, phone: v.phone ? `+7${v.phone}` : '' })

// «Скачать положение» в обмен на контакт. После ответа API — кнопка-ссылка на PDF:
// window.open после асинхронного запроса во встроенных браузерах блокируется.
export function RegulationsDialog({ landing, locale, docs }: Props) {
  const t = getDict(locale)
  const r = t.regulations
  const [result, setResult] = useState<{ pdfUrl: string | null } | null>(null)
  const form = useLeadForm<Values>({
    kind: 'regulations',
    landing,
    locale,
    initial: { fullName: '', phone: '', email: '', consent: false },
    order: ORDER,
    toFields,
    onSuccess: (json) => {
      setResult({ pdfUrl: typeof json.pdfUrl === 'string' ? json.pdfUrl : null })
      requestAnimationFrame(() => document.getElementById('reg-ready')?.focus())
    },
  })
  const { values: v, errors: e } = form

  return (
    <Sheet
      name="regulations"
      titleId="reg-title"
      closeLabel={t.close}
      className="lp-sheet--short"
      onOpen={() => {
        if (!result) form.open()
        track('form_open', { form: 'regulations' })
      }}
      head={
        <div className="lp-doc-title">
          <span className="lp-iconbox">
            <FileText className="q-icon q-icon--lg" aria-hidden="true" />
          </span>
          <div>
            <h2 id="reg-title" className="lp-sheet__title" tabIndex={-1}>
              {r.title}
            </h2>
            <p className="q-small" style={{ marginTop: 2 }}>
              {r.sub}
            </p>
          </div>
        </div>
      }
    >
      {result ? (
        <div className="lp-success" id="reg-ready" tabIndex={-1} role="status">
          <div className="q-note" style={{ background: 'var(--success-tint)' }}>
            <CircleCheck
              className="q-icon"
              aria-hidden="true"
              style={{ color: 'var(--success)' }}
            />
            <span>
              <b style={{ fontWeight: 600 }}>{result.pdfUrl ? r.readyTitle : r.pendingTitle}.</b>{' '}
              {result.pdfUrl ? r.readyText : r.pendingText}
            </span>
          </div>
          {result.pdfUrl && (
            <a
              className="q-btn q-btn--primary q-btn--block"
              href={result.pdfUrl}
              target="_blank"
              rel="noopener"
              onClick={() => track('regulations_download')}
            >
              <Download className="q-icon" aria-hidden="true" />
              {r.open}
            </a>
          )}
        </div>
      ) : (
        <>
          <p className="lp-sheet__intro" style={{ marginTop: 16 }}>
            {r.intro}
          </p>
          <form className="q-form" noValidate onSubmit={form.submit} aria-labelledby="reg-title">
            <Summary
              t={t}
              summaryRef={form.summaryRef}
              fields={form.summary}
              ids={IDS}
              formError={form.formError}
            />
            <Honeypot inputRef={form.hpRef} />
            <Field id="d-name" label={r.name} required error={e.fullName}>
              <input
                id="d-name"
                className={`q-input${e.fullName ? ' is-error' : ''}`}
                placeholder={r.namePh}
                autoComplete="name"
                value={v.fullName}
                onChange={(ev) => form.set('fullName', ev.target.value)}
                onBlur={() => form.blur('fullName')}
                required
                aria-invalid={e.fullName ? true : undefined}
                aria-describedby={describedBy('d-name', e.fullName)}
              />
            </Field>
            <div className="q-field">
              <label className="q-label" htmlFor="d-phone">
                {t.form.phonePlain}
                <span className="q-req" aria-hidden="true">
                  *
                </span>
              </label>
              <PhoneInput
                id="d-phone"
                digits={v.phone}
                error={e.phone}
                onChange={(d) => form.set('phone', d)}
                onBlur={() => form.blur('phone')}
                describedById={e.phone ? 'd-phone-e' : undefined}
              />
              <ErrorText id="d-phone-e" text={e.phone} />
            </div>
            <Field id="d-email" label={t.form.email} required error={e.email}>
              <input
                id="d-email"
                type="email"
                inputMode="email"
                className={`q-input${e.email ? ' is-error' : ''}`}
                placeholder="name@example.kz"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={v.email}
                onChange={(ev) => form.set('email', ev.target.value)}
                onBlur={() => form.blur('email')}
                required
                aria-invalid={e.email ? true : undefined}
                aria-describedby={describedBy('d-email', e.email)}
              />
            </Field>
            <Checkbox
              id="d-consent"
              checked={v.consent}
              error={e.consent}
              onChange={(val) => form.set('consent', val)}
            >
              {renderConsent(t.form.consentShort, docs)}
            </Checkbox>
            <button
              type="submit"
              className="q-btn q-btn--primary q-btn--block"
              disabled={form.sending}
              onPointerDown={form.holdBlur}
            >
              {form.sending ? (
                t.form.sending
              ) : (
                <>
                  <Download className="q-icon" aria-hidden="true" />
                  {r.submit}
                </>
              )}
            </button>
          </form>
        </>
      )}
    </Sheet>
  )
}

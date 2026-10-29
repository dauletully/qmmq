'use client'

import { Check, Minus, Phone, Plus } from 'lucide-react'

import { track } from '@/analytics/client'
import { useRouter } from 'next/navigation'

import { getDict } from '@/i18n/dictionary'
import { type Locale, optionsFor, SUBJECTS } from '@/lib/constants'

import { type DocLinks, renderConsent } from './consent'
import { Checkbox, describedBy, ErrorText, Field, Honeypot, PhoneInput, Summary } from './fields'
import { Sheet } from './Sheet'
import { useLeadForm } from './useLeadForm'

type Props = {
  landing: string
  locale: Locale
  base: string
  groupMinSize: number
  note: string
  docs: DocLinks
}

type Values = {
  organization: string
  contactPerson: string
  phone: string
  participantsCount: string
  subjects: string[]
  consent: boolean
}

const ORDER = ['organization', 'contactPerson', 'phone', 'participantsCount', 'subjects', 'consent']
const IDS: Record<string, string> = {
  organization: 's-org',
  contactPerson: 's-person',
  phone: 's-phone',
  participantsCount: 's-count',
  subjects: 's-subj-math',
  consent: 's-consent',
}

const toFields = (v: Values) => ({
  ...v,
  phone: v.phone ? `+7${v.phone}` : '',
  participantsCount: v.participantsCount === '' ? undefined : Number(v.participantsCount),
})

export function SchoolDialog({ landing, locale, base, groupMinSize, note, docs }: Props) {
  const t = getDict(locale)
  const router = useRouter()
  const s = t.school
  const form = useLeadForm<Values>({
    kind: 'school',
    landing,
    locale,
    initial: {
      organization: '',
      contactPerson: '',
      phone: '',
      participantsCount: String(groupMinSize),
      subjects: [],
      consent: false,
    },
    order: ORDER,
    toFields,
    onSuccess: (json) => {
      const redirect = typeof json.redirect === 'string' ? json.redirect : '/spasibo?type=school'
      setTimeout(() => router.push(`${base}${redirect}`), 300)
    },
  })
  const { values: v, errors: e } = form
  const count = Number(v.participantsCount) || 0

  function step(delta: number) {
    form.set('participantsCount', String(Math.max(1, Math.min(1000, count + delta))))
  }

  function toggleSubject(value: string) {
    const list = v.subjects.includes(value)
      ? v.subjects.filter((x) => x !== value)
      : [...v.subjects, value]
    form.set('subjects', list)
  }

  return (
    <Sheet
      name="school"
      titleId="school-title"
      closeLabel={t.close}
      onOpen={() => {
        form.open()
        track('form_open', { form: 'school' })
      }}
      head={
        <div className="lp-sheet__titles">
          <p className="q-overline">{s.overline}</p>
          <h2 id="school-title" className="lp-sheet__title" tabIndex={-1}>
            {s.title}
          </h2>
        </div>
      }
    >
      <p className="lp-sheet__intro">{s.intro(groupMinSize)}</p>
      {note && (
        <div className="q-note">
          <Phone className="q-icon" aria-hidden="true" />
          <span>{note}</span>
        </div>
      )}
      <form className="q-form" noValidate onSubmit={form.submit} aria-labelledby="school-title">
        <Summary
          t={t}
          summaryRef={form.summaryRef}
          fields={form.summary}
          ids={IDS}
          formError={form.formError}
        />
        <Honeypot inputRef={form.hpRef} />
        <Field id="s-org" label={s.organization} required error={e.organization}>
          <input
            id="s-org"
            className={`q-input${e.organization ? ' is-error' : ''}`}
            placeholder={s.organizationPh}
            autoComplete="organization"
            value={v.organization}
            onChange={(ev) => form.set('organization', ev.target.value)}
            onBlur={() => form.blur('organization')}
            required
            aria-invalid={e.organization ? true : undefined}
            aria-describedby={describedBy('s-org', e.organization)}
          />
        </Field>
        <Field id="s-person" label={s.contactPerson} required error={e.contactPerson}>
          <input
            id="s-person"
            className={`q-input${e.contactPerson ? ' is-error' : ''}`}
            placeholder={s.contactPersonPh}
            autoComplete="name"
            value={v.contactPerson}
            onChange={(ev) => form.set('contactPerson', ev.target.value)}
            onBlur={() => form.blur('contactPerson')}
            required
            aria-invalid={e.contactPerson ? true : undefined}
            aria-describedby={describedBy('s-person', e.contactPerson)}
          />
        </Field>
        <div className="q-field">
          <label className="q-label" htmlFor="s-phone">
            {t.form.phonePlain}
            <span className="q-req" aria-hidden="true">
              *
            </span>
          </label>
          <PhoneInput
            id="s-phone"
            digits={v.phone}
            error={e.phone}
            onChange={(d) => form.set('phone', d)}
            onBlur={() => form.blur('phone')}
            describedById={e.phone ? 's-phone-e' : undefined}
          />
          <ErrorText id="s-phone-e" text={e.phone} />
        </div>
        <Field
          id="s-count"
          label={s.count}
          required
          error={e.participantsCount}
          hint={s.countHint(groupMinSize)}
          hintId="s-count-h"
        >
          <div className="lp-stepper">
            <button
              className="q-btn q-btn--secondary"
              type="button"
              aria-label={s.less}
              aria-controls="s-count"
              onClick={() => step(-1)}
            >
              <Minus className="q-icon" aria-hidden="true" />
            </button>
            <input
              id="s-count"
              className={`q-input q-num${e.participantsCount ? ' is-error' : ''}`}
              inputMode="numeric"
              pattern="[0-9]*"
              value={v.participantsCount}
              onChange={(ev) =>
                form.set('participantsCount', ev.target.value.replace(/\D/g, '').slice(0, 4))
              }
              onBlur={() => form.blur('participantsCount')}
              required
              aria-invalid={e.participantsCount ? true : undefined}
              aria-describedby={describedBy('s-count', e.participantsCount, 's-count-h')}
            />
            <button
              className="q-btn q-btn--secondary"
              type="button"
              aria-label={s.more}
              aria-controls="s-count"
              onClick={() => step(1)}
            >
              <Plus className="q-icon" aria-hidden="true" />
            </button>
          </div>
        </Field>
        <fieldset
          className="q-field"
          style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
          aria-describedby={e.subjects ? 's-subj-e' : undefined}
        >
          <legend className="q-label" style={{ padding: 0, marginBottom: 8 }}>
            {s.subjects}
            <span className="q-req" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="q-chips">
            {optionsFor(SUBJECTS, locale).map((opt) => {
              const on = v.subjects.includes(opt.value)
              return (
                <label key={opt.value} className={`q-chip${on ? ' is-selected' : ''}`}>
                  <input
                    type="checkbox"
                    id={`s-subj-${opt.value}`}
                    checked={on}
                    onChange={() => toggleSubject(opt.value)}
                  />
                  {on && <Check className="q-icon" aria-hidden="true" />}
                  {opt.label}
                </label>
              )
            })}
          </div>
          <ErrorText id="s-subj-e" text={e.subjects} />
        </fieldset>
        <Checkbox
          id="s-consent"
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
          {form.sending ? t.form.sending : s.submit}
        </button>
      </form>
    </Sheet>
  )
}

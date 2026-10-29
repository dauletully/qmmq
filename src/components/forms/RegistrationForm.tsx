'use client'

import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { track } from '@/analytics/client'
import { useRouter } from 'next/navigation'

import { getDict } from '@/i18n/dictionary'
import { EXPERIENCE, type Locale, optionsFor, REGIONS, SUBJECTS } from '@/lib/constants'

import { CtaLabel } from '../landing/CtaLabel'
import { type DocLinks, renderConsent } from './consent'
import {
  Checkbox,
  describedBy,
  ErrorText,
  Field,
  Honeypot,
  PhoneInput,
  Select,
  Summary,
} from './fields'
import { loadSchemas, useLeadForm } from './useLeadForm'

type Props = {
  landing: string
  locale: Locale
  base: string
  price: number
  howHeardOptions: string[]
  consentText: string
  docs: DocLinks
}

type Values = {
  fullName: string
  subject: string
  region: string
  city: string
  school: string
  experience: string
  phone: string
  email: string
  howHeard: string
  consent: boolean
}

const INITIAL: Values = {
  fullName: '',
  subject: '',
  region: '',
  city: '',
  school: '',
  experience: '',
  phone: '',
  email: '',
  howHeard: '',
  consent: false,
}

const ORDER = [
  'fullName',
  'subject',
  'experience',
  'region',
  'city',
  'school',
  'phone',
  'email',
  'howHeard',
  'consent',
]

const IDS: Record<string, string> = {
  fullName: 'r-name',
  subject: 'r-subject',
  experience: 'r-exp-lt5',
  region: 'r-region',
  city: 'r-city',
  school: 'r-school',
  phone: 'r-phone',
  email: 'r-email',
  howHeard: 'r-how',
  consent: 'r-consent',
}

// Города республиканского значения: город подставляем сам.
const CITY_REGIONS = new Set(['astana', 'almaty', 'shymkent'])

const toFields = (v: Values) => ({
  ...v,
  phone: v.phone ? `+7${v.phone}` : '',
  experience: v.experience || undefined,
  howHeard: v.howHeard || undefined,
})

export function RegistrationForm({
  landing,
  locale,
  base,
  price,
  howHeardOptions,
  consentText,
  docs,
}: Props) {
  const t = getDict(locale)
  const router = useRouter()
  const f = t.form
  const formRef = useRef<HTMLFormElement>(null)
  const form = useLeadForm<Values>({
    kind: 'registration',
    landing,
    locale,
    initial: INITIAL,
    order: ORDER,
    toFields,
    onSuccess: (json) => {
      const redirect = typeof json.redirect === 'string' ? json.redirect : '/spasibo'
      // Небольшая пауза — пиксели успевают отправить конверсию.
      setTimeout(() => router.push(`${base}${redirect}`), 300)
    },
  })
  const { values: v, errors: e } = form

  // form_open — когда форма появилась на экране.
  useEffect(() => {
    const el = formRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          track('form_open', { form: 'registration' })
          void loadSchemas()
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  function onRegion(region: string) {
    const label = REGIONS.find((r) => r.value === region)?.label[locale]
    const autoCity = CITY_REGIONS.has(region) && label ? label : ''
    const prevAuto = REGIONS.some((r) => CITY_REGIONS.has(r.value) && r.label[locale] === v.city)
    form.setMany({ region, city: autoCity || (prevAuto ? '' : v.city) })
  }

  const consent = consentText || f.consentShort

  return (
    <form
      ref={formRef}
      className="q-form lp-card lp-form"
      id="register"
      noValidate
      onSubmit={form.submit}
      aria-labelledby="register-title"
    >
      <div className="lp-form__head">
        <h3 className="q-h3" id="register-title">
          <span className="if-open">{f.registrationTitle}</span>
          <span className="if-closed">{f.waitlistTitle}</span>
        </h3>
        <p className="lp-form__legend">
          <span aria-hidden="true">*</span> {f.requiredLegend}
        </p>
      </div>

      <Summary
        t={t}
        summaryRef={form.summaryRef}
        fields={form.summary}
        ids={IDS}
        formError={form.formError}
      />
      <Honeypot inputRef={form.hpRef} />

      <Field id="r-name" label={f.fullName} required error={e.fullName}>
        <input
          id="r-name"
          className={`q-input${e.fullName ? ' is-error' : ''}`}
          placeholder={f.fullNamePh}
          autoComplete="name"
          value={v.fullName}
          onChange={(ev) => form.set('fullName', ev.target.value)}
          onBlur={() => form.blur('fullName')}
          required
          aria-invalid={e.fullName ? true : undefined}
          aria-describedby={describedBy('r-name', e.fullName)}
        />
      </Field>

      <div className="lp-form__pair">
        <Field id="r-subject" label={f.subject} required error={e.subject}>
          <Select
            id="r-subject"
            value={v.subject}
            placeholder={f.subjectPh}
            options={optionsFor(SUBJECTS, locale)}
            error={e.subject}
            onChange={(val) => form.set('subject', val)}
            onBlur={() => form.blur('subject')}
            required
            describedById={describedBy('r-subject', e.subject)}
          />
        </Field>
        <fieldset className="q-field" style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
          <legend className="q-label" style={{ padding: 0, marginBottom: 8 }}>
            {f.experience}
          </legend>
          <div className="q-chips lp-chips3">
            {EXPERIENCE.map((opt) => {
              const on = v.experience === opt.value
              return (
                <label key={opt.value} className={`q-chip${on ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="experience"
                    id={`r-exp-${opt.value}`}
                    value={opt.value}
                    checked={on}
                    onChange={() => form.set('experience', opt.value)}
                    onClick={() => on && form.set('experience', '')}
                  />
                  {on && <Check className="q-icon" aria-hidden="true" />}
                  {f.experienceChips[opt.value]}
                </label>
              )
            })}
          </div>
        </fieldset>
      </div>

      <div className="lp-form__pair">
        <Field id="r-region" label={f.region} required error={e.region}>
          <Select
            id="r-region"
            value={v.region}
            placeholder={f.regionPh}
            options={optionsFor(REGIONS, locale)}
            error={e.region}
            onChange={onRegion}
            onBlur={() => form.blur('region')}
            required
            describedById={describedBy('r-region', e.region)}
          />
        </Field>
        <Field id="r-city" label={f.city} required error={e.city}>
          <input
            id="r-city"
            className={`q-input${e.city ? ' is-error' : ''}`}
            placeholder={v.region ? f.cityPh : f.cityPhDisabled}
            autoComplete="address-level2"
            disabled={!v.region}
            value={v.city}
            onChange={(ev) => form.set('city', ev.target.value)}
            onBlur={() => form.blur('city')}
            required
            aria-invalid={e.city ? true : undefined}
            aria-describedby={describedBy('r-city', e.city)}
          />
        </Field>
      </div>

      <Field id="r-school" label={f.school} required error={e.school}>
        <input
          id="r-school"
          className={`q-input${e.school ? ' is-error' : ''}`}
          placeholder={f.schoolPh}
          autoComplete="organization"
          value={v.school}
          onChange={(ev) => form.set('school', ev.target.value)}
          onBlur={() => form.blur('school')}
          required
          aria-invalid={e.school ? true : undefined}
          aria-describedby={describedBy('r-school', e.school)}
        />
      </Field>

      <div className="lp-form__pair">
        <div className="q-field">
          <label className="q-label" htmlFor="r-phone">
            {f.phone}
            <span className="q-req" aria-hidden="true">
              *
            </span>
          </label>
          <PhoneInput
            id="r-phone"
            digits={v.phone}
            error={e.phone}
            onChange={(d) => form.set('phone', d)}
            onBlur={() => form.blur('phone')}
            describedById={e.phone ? 'r-phone-e' : 'r-phone-h r-phone-h2'}
          />
          {!e.phone && (
            <p className="q-hint only-m" id="r-phone-h">
              {f.phoneHint}
            </p>
          )}
          <ErrorText id="r-phone-e" text={e.phone} />
        </div>
        <Field id="r-email" label={f.email} required error={e.email}>
          <input
            id="r-email"
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
            aria-describedby={describedBy('r-email', e.email)}
          />
        </Field>
      </div>
      <p className="q-hint only-d lp-phone-hint" id="r-phone-h2">
        {f.phoneHint}
      </p>

      {howHeardOptions.length > 0 && (
        <Field id="r-how" label={f.howHeard} optional={f.optional}>
          <Select
            id="r-how"
            value={v.howHeard}
            placeholder={f.howHeardPh}
            options={howHeardOptions.map((o) => ({ value: o, label: o }))}
            onChange={(val) => form.set('howHeard', val)}
          />
        </Field>
      )}

      <Checkbox
        id="r-consent"
        checked={v.consent}
        error={e.consent}
        onChange={(val) => form.set('consent', val)}
      >
        {renderConsent(consent, docs)}
      </Checkbox>

      <div className="lp-form__submit">
        <button
          type="submit"
          className="q-btn q-btn--primary q-btn--block"
          data-cta="pricing"
          disabled={form.sending}
          onPointerDown={form.holdBlur}
        >
          {form.sending ? f.sending : <CtaLabel t={t} price={price} />}
        </button>
        <p className="q-small">
          <span className="if-open">{f.submitNote}</span>
          <span className="if-closed">{f.waitlistNote}</span>
        </p>
      </div>
    </form>
  )
}

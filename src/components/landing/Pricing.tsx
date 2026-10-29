import { Building, Check } from 'lucide-react'

import { Countdown } from '@/components/client/Countdown'
import { RegistrationForm } from '@/components/forms/RegistrationForm'
import { formatPrice } from '@/i18n/format'

import type { Ctx } from './context'
import { WaitlistBox } from './Hero'
import { SectionHead } from './ui'

export function Pricing({ ctx }: { ctx: Ctx }) {
  const { view, t, locale } = ctx
  const p = view.pricing
  const ev = view.event
  return (
    <section className="lp-sec lp-sec--alt" id="pricing" data-section="pricing">
      <div className="lp-wrap">
        <SectionHead overline={t.overline.pricing} title={p.heading || t.nav.pricing} />
        <div className="lp-pricing">
          <div className="lp-pricing__side">
            <div className="lp-card lp-price-card">
              <div>
                <p className="lp-price-card__label">{t.pricing.perTeacher}</p>
                <p className="lp-price">{formatPrice(ev.price)}</p>
              </div>
              {p.includes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p className="q-label" style={{ margin: 0 }}>
                    {t.pricing.includes}
                  </p>
                  <ul className="lp-includes">
                    {p.includes.map((it, i) => (
                      <li key={i}>
                        <Check className="q-icon" aria-hidden="true" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                  {p.documentNote && <p className="q-small">{p.documentNote}</p>}
                </div>
              )}
              {ev.deadline && (
                <div>
                  <div className="if-open">
                    <Countdown
                      deadline={ev.deadline}
                      renderedAt={ctx.renderedAt}
                      locale={locale}
                      variant="cells"
                    />
                    {p.deadlineNote && (
                      <p className="q-small" style={{ marginTop: 12 }}>
                        {p.deadlineNote}
                      </p>
                    )}
                  </div>
                  <div className="if-closed">
                    <WaitlistBox ctx={ctx} />
                  </div>
                </div>
              )}
            </div>
            <div className="lp-school-card">
              <div className="lp-school-card__head">
                <span className="lp-school-card__icon">
                  <Building className="q-icon q-icon--lg" aria-hidden="true" />
                </span>
                <h3 className="q-h3">{t.pricing.schoolTitle(ev.groupMinSize)}</h3>
              </div>
              <div className="lp-school-card__body">
                {p.groupTerms && <p>{p.groupTerms}</p>}
                <button
                  type="button"
                  className="q-btn q-btn--secondary q-btn--block"
                  data-dialog="school"
                >
                  {t.pricing.schoolButton}
                </button>
              </div>
            </div>
          </div>
          <RegistrationForm
            landing={view.slug}
            locale={locale}
            base={view.base}
            price={ev.price}
            howHeardOptions={view.forms.howHeardOptions}
            consentText={view.forms.consentText}
            docs={{ offer: view.docs.offer, privacy: view.docs.privacy }}
          />
        </div>
      </div>
    </section>
  )
}

import { Calendar, Check, Download, MapPin, MessageCircle } from 'lucide-react'
import { notFound } from 'next/navigation'

import { getLandingView } from '@/app/(frontend)/_lib/data'
import { pagePath } from '@/app/(frontend)/_lib/site'
import { AnalyticsTracker } from '@/analytics/client'
import { TrackedLink } from '@/components/client/TrackedLink'
import { getDict } from '@/i18n/dictionary'
import { formatMonthYear } from '@/i18n/format'
import type { Locale } from '@/lib/constants'

import { venueLine } from './Bottom'
import { langHrefs, makeCtx } from './context'
import { Header } from './Header'
import { Construction } from './ui'

export type ThanksType = 'registration' | 'waitlist' | 'school'

export function thanksType(value: unknown): ThanksType {
  return value === 'waitlist' || value === 'school' ? value : 'registration'
}

export async function ThanksPage({
  routeSlug,
  locale,
  type,
}: {
  routeSlug: string
  locale: Locale
  type: ThanksType
}) {
  const view = await getLandingView(routeSlug, locale)
  if (!view) notFound()
  const t = getDict(locale)
  const th = t.thanks
  const ctx = makeCtx(view, t)
  const ev = view.event
  const dateLabel = view.hero.subheading || formatMonthYear(ev.startDate, locale)

  const heading =
    type === 'waitlist'
      ? th.waitlistHeading
      : type === 'school'
        ? th.schoolHeading
        : view.thankYou.heading || th.metaTitle
  const body =
    type === 'waitlist' ? th.waitlistBody : type === 'school' ? th.schoolBody : view.thankYou.body

  const steps: Array<[string, string]> =
    type === 'waitlist'
      ? [th.steps.waitlist as [string, string]]
      : type === 'school'
        ? [th.steps.schoolCall as [string, string], th.steps.schoolDocs as [string, string]]
        : [
            th.steps.contact as [string, string],
            ...(ev.chatUrl ? [th.steps.chat as [string, string]] : []),
            [th.steps.event(dateLabel, ev.city), th.steps.eventText],
          ]

  const query = type === 'registration' ? '' : `?type=${type}`
  const phone = view.contacts.phones[0]

  return (
    <div className="lp" data-reg={ctx.closed ? 'closed' : 'open'}>
      <a className="lp-skip" href="#main">
        {t.skip}
      </a>
      <Header
        t={t}
        locale={locale}
        name={view.association.name}
        logo={view.association.logo}
        home={pagePath(view.base, locale)}
        hrefs={langHrefs(view, '/spasibo', query)}
      />
      <main id="main" className="lp-simple">
        <section className="q-grid-bg q-grid-bg--light lp-thanks__hero">
          <div className="lp-wrap" style={{ position: 'relative' }}>
            <span className="lp-thanks__check" aria-hidden="true">
              <Check className="q-icon" />
            </span>
            <p className="q-overline lp-thanks__overline">{th.overline}</p>
            <h1 className="lp-thanks__title">{heading}</h1>
            {body && <p className="q-lead lp-thanks__lead">{body}</p>}
          </div>
          <Construction className="lp-thanks__construct" variant="light" animate={false} />
        </section>

        <div className="lp-wrap lp-thanks__body">
          <section className="lp-thanks__next" aria-labelledby="next-title">
            <p className="q-overline" id="next-title">
              {th.next}
            </p>
            <ol className="lp-steps">
              {steps.map(([title, text], i) => (
                <li className="lp-step" key={i}>
                  <span className="lp-step__num q-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <p className="lp-step__title">{title}</p>
                    <p className="lp-step__text">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="lp-thanks__side">
            <div className="lp-facts">
              <div className="lp-fact">
                <Calendar className="q-icon q-icon--lg" aria-hidden="true" />
                <div>
                  <p className="lp-fact__label">{th.dates}</p>
                  <p className="lp-fact__value">{dateLabel}</p>
                </div>
              </div>
              <div className="lp-fact">
                <MapPin className="q-icon q-icon--lg" aria-hidden="true" />
                <div>
                  <p className="lp-fact__label">{th.place}</p>
                  <p className="lp-fact__value">{venueLine(view, th.placeTbd)}</p>
                </div>
              </div>
            </div>

            <div className="lp-thanks__actions">
              {ev.chatUrl && type === 'registration' && (
                <a
                  className="q-btn q-btn--brand q-btn--block"
                  href={ev.chatUrl}
                  target="_blank"
                  rel="noopener"
                >
                  <MessageCircle className="q-icon" aria-hidden="true" />
                  {th.chat}
                </a>
              )}
              {view.docs.regulations && (
                <TrackedLink
                  className="q-btn q-btn--secondary q-btn--block"
                  href={view.docs.regulations}
                  event="regulations_download"
                >
                  <Download className="q-icon" aria-hidden="true" />
                  {th.regulations}
                </TrackedLink>
              )}
              <a className="q-btn q-btn--text" href={pagePath(view.base, locale)}>
                {th.back}
              </a>
              {(phone || ctx.whatsappHref) && (
                <p className="q-small lp-thanks__contact">
                  {th.questions} {phone && <b className="q-num">{phone.display}</b>}
                  {phone && ctx.whatsappHref && ' · '}
                  {ctx.whatsappHref && (
                    <a className="q-link" href={ctx.whatsappHref} target="_blank" rel="noopener">
                      WhatsApp
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <AnalyticsTracker locale={locale} landing={view.slug} pixels={view.pixels} />
    </div>
  )
}

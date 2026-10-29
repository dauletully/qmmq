import { Calendar, CalendarClock, Download, Landmark, MapPin } from 'lucide-react'
import Image from 'next/image'

import { Countdown } from '@/components/client/Countdown'
import { formatMonthYear } from '@/i18n/format'

import type { Ctx } from './context'
import { CtaLabel } from './CtaLabel'
import { Construction, highlightRoman } from './ui'

export function WaitlistBox({ ctx }: { ctx: Ctx }) {
  return (
    <div className="q-waitlist">
      <span className="q-waitlist__status">
        <CalendarClock className="q-icon q-icon--sm" aria-hidden="true" />
        {ctx.t.countdown.closedStatus}
      </span>
      <p>{ctx.t.countdown.closedText}</p>
    </div>
  )
}

export function Hero({ ctx }: { ctx: Ctx }) {
  const { view, t, locale } = ctx
  const { hero, event } = view
  const [org, since] = hero.eyebrow.split(/\s+·\s+/)
  const dateLabel = hero.subheading || formatMonthYear(event.startDate, locale)
  const hasDeadline = Boolean(event.deadline)

  return (
    <section className="q-dark q-grid-bg lp-hero" data-section="hero" id="top">
      <div className="lp-wrap lp-hero__grid">
        <div className="lp-hero__main">
          <Construction className="lp-hero__construct-m" variant="mobile" />
          {org && (
            <p className="lp-hero__eyebrow">
              <span className="lp-hero__org">{org}</span>
              {since && (
                <span className="lp-hero__since">
                  <span className="lp-hero__sep"> · </span>
                  {since}
                </span>
              )}
            </p>
          )}
          <h1 className="lp-hero__title">{highlightRoman(hero.heading)}</h1>
          <div className="lp-hero__meta">
            <span className="lp-hero__chip">
              <Calendar className="q-icon" aria-hidden="true" />
              {dateLabel}
            </span>
            {event.city && (
              <span className="lp-hero__chip">
                <MapPin className="q-icon" aria-hidden="true" />
                {event.city}
              </span>
            )}
            {hero.partnerNote && (
              <span className="lp-hero__partner">
                {hero.partnerLogo ? (
                  <Image
                    src={hero.partnerLogo.src}
                    alt=""
                    width={Math.round((hero.partnerLogo.width / hero.partnerLogo.height) * 32)}
                    height={32}
                    unoptimized={hero.partnerLogo.svg}
                  />
                ) : (
                  <Landmark className="q-icon" aria-hidden="true" />
                )}
                {hero.partnerNote}
              </span>
            )}
          </div>
          {hasDeadline && (
            <div className="lp-hero__status">
              <div className="if-open">
                <Countdown
                  deadline={event.deadline}
                  renderedAt={ctx.renderedAt}
                  locale={locale}
                  variant="inline"
                />
              </div>
              <div className="if-closed">
                <WaitlistBox ctx={ctx} />
              </div>
            </div>
          )}
          <div className="lp-hero__actions">
            <a className="q-btn q-btn--primary q-btn--block" href="#register" data-cta="hero">
              <CtaLabel t={t} label={hero.primaryCta} price={event.price} />
            </a>
            <button
              type="button"
              className="q-btn q-btn--secondary q-btn--block"
              data-dialog="regulations"
            >
              <Download className="q-icon" aria-hidden="true" />
              {hero.secondaryCta || t.thanks.regulations}
            </button>
          </div>
        </div>
        <div className="lp-hero__aside" aria-hidden={hasDeadline ? undefined : true}>
          <Construction variant="desktop" />
          {hasDeadline && (
            <div className="lp-panel">
              <div className="if-open">
                <Countdown
                  deadline={event.deadline}
                  renderedAt={ctx.renderedAt}
                  locale={locale}
                  variant="cells"
                />
              </div>
              <div className="if-closed">
                <WaitlistBox ctx={ctx} />
              </div>
            </div>
          )}
        </div>
      </div>
      {hero.stats.length > 0 && (
        <div className="lp-wrap">
          <div className="q-stats lp-hero__stats">
            {hero.stats.map((s, i) => (
              <div className="q-stat q-stat--row" key={i}>
                <span className="q-stat__value" data-count={s.value}>
                  {s.value}
                </span>
                <span className="q-stat__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

import { ArrowRight, ChevronDown, Landmark, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import type { Img } from '@/app/(frontend)/_lib/data'
import { Countdown } from '@/components/client/Countdown'
import { MapEmbed } from '@/components/client/MapEmbed'

import type { Ctx } from './context'
import { CtaLabel } from './CtaLabel'
import { WaitlistBox } from './Hero'
import { highlightRoman, Logo, SectionHead } from './ui'

// ---------- 10. Партнёры ----------
function PartnerLogo({ logo, wide }: { logo: Img; wide?: boolean }) {
  const h = wide ? 52 : 48
  return (
    <Image
      className="lp-partner__logo"
      src={logo.src}
      alt={logo.alt}
      width={Math.round((logo.width / logo.height) * h)}
      height={h}
      sizes="200px"
      unoptimized={logo.svg}
    />
  )
}

export function Partners({ ctx }: { ctx: Ctx }) {
  const { view, t } = ctx
  return (
    <section className="lp-sec" id="partners" data-section="partners">
      <div className="lp-wrap lp-reveal">
        <div className="lp-partners__head">
          <div className="lp-head">
            <p className="q-overline">{t.overline.partners}</p>
            <h2 className="q-h2">{view.partners.heading || t.overline.partners}</h2>
          </div>
          <a className="q-btn q-btn--text lp-textbtn lp-partners__more only-d" href="#contacts">
            {t.partners.become}
            <ArrowRight className="q-icon" aria-hidden="true" />
          </a>
        </div>
        <div className="lp-partners">
          {view.partners.items.map((p) => {
            const wide = p.kind === 'ministry'
            const kind = t.partners.kinds[p.kind as keyof typeof t.partners.kinds] ?? ''
            const long = p.name.length > 14
            const inner = wide ? (
              <>
                {p.logo ? (
                  <PartnerLogo logo={p.logo} wide />
                ) : (
                  <span className="lp-partner__icon">
                    <Landmark className="q-icon q-icon--lg" aria-hidden="true" />
                  </span>
                )}
                <div>
                  {kind && <p className="lp-partner__kind">{kind}</p>}
                  <p className="lp-partner__name">{p.name}</p>
                </div>
              </>
            ) : (
              <>
                {kind && <p className="lp-partner__kind">{kind}</p>}
                {p.logo ? (
                  <PartnerLogo logo={p.logo} />
                ) : (
                  <p className={`lp-partner__name${long ? ' lp-partner__name--long' : ''}`}>
                    {p.name}
                  </p>
                )}
              </>
            )
            const cls = `lp-partner${wide ? ' lp-partner--wide' : ''}`
            return p.url ? (
              <a
                key={p.id}
                className={cls}
                href={p.url}
                target="_blank"
                rel="noopener"
                aria-label={p.logo ? p.name : undefined}
              >
                {inner}
              </a>
            ) : (
              <div key={p.id} className={cls}>
                {inner}
              </div>
            )
          })}
        </div>
        <a className="q-btn q-btn--text lp-textbtn lp-partners__more only-m" href="#contacts">
          {t.partners.become}
          <ArrowRight className="q-icon" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}

// ---------- 11. FAQ ----------
export function Faq({ ctx }: { ctx: Ctx }) {
  const { view, t, whatsappHref } = ctx
  return (
    <section className="lp-sec lp-sec--alt" id="faq" data-section="faq">
      <div className="lp-wrap lp-faq">
        <SectionHead overline={t.overline.faq} title={view.faq.heading || t.nav.faq} />
        <div className="q-acc lp-faq__acc">
          {view.faq.items.map((q, i) => (
            <details className="q-acc__item lp-acc" id={`faq-${i + 1}`} open={i === 0} key={i}>
              <summary className="q-acc__head">
                <span className="q-acc__title">{q.question}</span>
                <span className="q-acc__chev" aria-hidden="true">
                  <ChevronDown className="q-icon" />
                </span>
              </summary>
              <div className="q-acc__panel">{q.answer}</div>
            </details>
          ))}
        </div>
        {whatsappHref && (
          <div className="lp-faq__help">
            <p className="only-m">{t.faq.notFound}</p>
            <a
              className="q-btn q-btn--text lp-textbtn only-m"
              href={whatsappHref}
              target="_blank"
              rel="noopener"
            >
              {t.whatsappWrite}
              <ArrowRight className="q-icon" aria-hidden="true" />
            </a>
            <p className="only-d">{t.faq.notFoundLong}</p>
            <a
              className="q-btn q-btn--secondary only-d"
              href={whatsappHref}
              target="_blank"
              rel="noopener"
            >
              <MessageCircle className="q-icon" aria-hidden="true" />
              {t.whatsappWrite}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- 12. Финальный призыв и контакты ----------
function ContactRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: ReactNode
  label: string
  value: string
  href?: string
  external?: boolean
}) {
  const body = (
    <>
      <span className="lp-contact__icon">{icon}</span>
      <span>
        <span className="lp-contact__label">{label}</span>
        <span className="lp-contact__value q-num">{value}</span>
      </span>
    </>
  )
  return href ? (
    <a
      className="lp-contact"
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
    >
      {body}
    </a>
  ) : (
    <div className="lp-contact">{body}</div>
  )
}

export function venueLine(view: Ctx['view'], tbd: string): string {
  const { city, venue, venueAddress } = view.event
  const place = [venue, venueAddress].filter(Boolean).join(', ')
  return [city, place || tbd].filter(Boolean).join(' · ')
}

export function FinalAndContacts({ ctx }: { ctx: Ctx }) {
  const { view, t, locale, whatsappHref } = ctx
  const c = view.contacts
  const ev = view.event
  return (
    <div data-section="contacts">
      <section className="q-dark q-grid-bg lp-sec lp-final" aria-labelledby="final-title">
        <div className="lp-wrap lp-final__grid">
          <div className="lp-final__main">
            <div className="lp-final__text">
              <p className="q-overline">
                <span className="if-open">{t.overline.finalOpen}</span>
                <span className="if-closed">{t.overline.finalClosed}</span>
              </p>
              <h2 className="q-h2" id="final-title">
                {highlightRoman(view.contactsBlock.finalCta || view.hero.heading)}
              </h2>
              <p className="q-lead">
                <span className="if-open">{t.final.open}</span>
                <span className="if-closed">{t.countdown.closedText}</span>
              </p>
            </div>
            {ev.deadline && (
              <div className="lp-final__status if-open">
                <Countdown
                  deadline={ev.deadline}
                  renderedAt={ctx.renderedAt}
                  locale={locale}
                  variant="inline"
                />
              </div>
            )}
            <div className="lp-final__actions">
              <a className="q-btn q-btn--primary q-btn--block" href="#register" data-cta="final">
                <CtaLabel t={t} label={view.hero.primaryCta} price={ev.price} />
              </a>
              <button
                type="button"
                className="q-btn q-btn--secondary q-btn--block"
                data-dialog="school"
              >
                {t.schoolLink}
              </button>
            </div>
          </div>
          {ev.deadline && (
            <div className="lp-final__aside">
              <div className="lp-panel">
                <div className="if-open">
                  <Countdown
                    deadline={ev.deadline}
                    renderedAt={ctx.renderedAt}
                    locale={locale}
                    variant="cells"
                  />
                </div>
                <div className="if-closed">
                  <WaitlistBox ctx={ctx} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="lp-sec" id="contacts" aria-labelledby="contacts-title">
        <div className="lp-wrap lp-contacts">
          <div className="lp-contacts__main">
            <SectionHead
              overline={t.overline.contacts}
              title={view.contactsBlock.heading || t.nav.contacts}
              id="contacts-title"
            />
            <div className="lp-contacts__list">
              {c.phones.map((p) => (
                <ContactRow
                  key={p.href}
                  icon={<Phone className="q-icon" aria-hidden="true" />}
                  label={p.label || t.contacts.phone}
                  value={p.display}
                  href={p.href}
                />
              ))}
              {whatsappHref && (
                <ContactRow
                  icon={<MessageCircle className="q-icon" aria-hidden="true" />}
                  label={t.contacts.whatsapp}
                  value={t.contacts.writeManager}
                  href={whatsappHref}
                  external
                />
              )}
              {c.email && (
                <ContactRow
                  icon={<Mail className="q-icon" aria-hidden="true" />}
                  label={t.contacts.email}
                  value={c.email}
                  href={`mailto:${c.email}`}
                />
              )}
              <ContactRow
                icon={<MapPin className="q-icon" aria-hidden="true" />}
                label={t.contacts.venue}
                value={venueLine(view, t.contacts.addressTbd)}
                href={ev.mapUrl ?? undefined}
                external
              />
            </div>
            {c.socials.length > 0 && (
              <p className="lp-socials">
                {t.contacts.community}{' '}
                {c.socials.map((s, i) => (
                  <span key={s.url}>
                    <a className="q-link" href={s.url} target="_blank" rel="noopener">
                      {s.label}
                    </a>
                    {i < c.socials.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </p>
            )}
          </div>
          <MapEmbed
            url={ev.mapUrl}
            labels={{
              later: t.contacts.mapLater,
              show: t.contacts.showMap,
              open: t.contacts.openMap,
              title: t.contacts.mapTitle,
            }}
          />
        </div>
      </section>
    </div>
  )
}

// ---------- Подвал ----------
export function Footer({ ctx }: { ctx: Ctx }) {
  const { view, t, whatsappHref } = ctx
  const c = view.contacts
  const year = new Date(ctx.renderedAt).getFullYear()
  const hasContacts = c.phones.length > 0 || whatsappHref || c.email
  return (
    <footer className="q-footer q-dark lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer__top">
          <div className="lp-footer__brand">
            <Logo img={view.association.logo} size="lg" />
            {view.association.name && <p className="lp-footer__name">{view.association.name}</p>}
            <p className="q-footer__muted lp-footer__about">{t.footer.about}</p>
          </div>
          <hr className="q-footer__rule" />
          <div className="lp-footer__cols">
            {hasContacts && (
              <div className="lp-footer__col">
                <p className="lp-footer__title">{t.footer.contacts}</p>
                <ul className="lp-footer__links">
                  {c.phones.map((p) => (
                    <li key={p.href}>
                      <a href={p.href}>{p.display}</a>
                    </li>
                  ))}
                  {whatsappHref && (
                    <li>
                      <a href={whatsappHref} target="_blank" rel="noopener">
                        WhatsApp
                      </a>
                    </li>
                  )}
                  {c.email && (
                    <li>
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                    </li>
                  )}
                </ul>
              </div>
            )}
            <div className="lp-footer__col">
              <p className="lp-footer__title">{t.footer.docs}</p>
              <ul className="lp-footer__links">
                <li>
                  <button type="button" className="lp-footer__link" data-dialog="regulations">
                    {t.footer.regulations}
                  </button>
                </li>
                {view.docs.offer && (
                  <li>
                    <a href={view.docs.offer} target="_blank" rel="noopener">
                      {t.footer.offer}
                    </a>
                  </li>
                )}
                {view.docs.privacy && (
                  <li>
                    <a href={view.docs.privacy} target="_blank" rel="noopener">
                      {t.footer.privacy}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <hr className="q-footer__rule lp-footer__rule2" />
        <div className="lp-footer__bottom">
          {c.requisites && <p className="q-footer__muted lp-footer__req">{c.requisites}</p>}
          <p className="q-footer__muted">
            © 2012–{year} {view.association.name}
          </p>
        </div>
      </div>
    </footer>
  )
}

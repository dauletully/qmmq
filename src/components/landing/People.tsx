import { RichText } from '@payloadcms/richtext-lexical/react'
import { Quote, User } from 'lucide-react'
import Image from 'next/image'

import type { PersonView } from '@/app/(frontend)/_lib/data'
import { Carousel } from '@/components/client/Carousel'
import { labelOf, SUBJECTS } from '@/lib/constants'

import type { Ctx } from './context'
import { CtaLabel } from './CtaLabel'
import { SectionHead } from './ui'

function Portrait({ person, sizes }: { person: PersonView; sizes: string }) {
  if (person.photo) {
    return (
      <Image
        src={person.photo.src}
        alt={person.photo.alt || person.name}
        width={person.photo.width}
        height={person.photo.height}
        sizes={sizes}
      />
    )
  }
  return (
    <div className="q-placeholder" aria-hidden="true">
      {person.initials ? (
        <span className="q-placeholder__initials">{person.initials}</span>
      ) : (
        <User className="q-icon" />
      )}
    </div>
  )
}

function roleOf(p: PersonView): string | undefined {
  return p.roles.includes('jury') && !p.roles.includes('speaker') ? 'jury' : p.roles[0]
}

function RoleTag({ role, t }: { role: string | undefined; t: Ctx['t'] }) {
  if (!role) return null
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <span className={`q-tag ${role === 'speaker' ? 'q-tag--accent' : 'q-tag--outline'}`}>
        {t.roles[role as keyof typeof t.roles] ?? role}
      </span>
    </div>
  )
}

// Один человек — не карусель из одной карточки, а крупный блок: портрет, регалии, вклад, цитата.
function FeaturedPerson({ person, t }: { person: PersonView; t: Ctx['t'] }) {
  return (
    <article className="lp-featured">
      <div className="lp-featured__photo q-speaker__photo">
        <Portrait person={person} sizes="(min-width: 1024px) 420px, 100vw" />
      </div>
      <div className="lp-featured__body">
        <RoleTag role={roleOf(person)} t={t} />
        <h3 className="lp-featured__name">{person.name}</h3>
        {person.position && <p className="lp-featured__role">{person.position}</p>}
        {person.contribution && <p className="lp-featured__note">{person.contribution}</p>}
        {person.quote && (
          <figure className="lp-featured__quote">
            <Quote className="q-icon lp-featured__mark" aria-hidden="true" />
            <blockquote>{person.quote}</blockquote>
          </figure>
        )}
      </div>
    </article>
  )
}

// ---------- 6. Спикеры и жюри ----------
export function Speakers({ ctx }: { ctx: Ctx }) {
  const { view, t } = ctx
  const people = view.speakers.people
  const n = people.length
  return (
    <section className="lp-sec lp-speakers" id="speakers" data-section="speakers">
      <div className="lp-wrap lp-reveal">
        <SectionHead
          overline={t.overline.speakers}
          title={view.speakers.heading || t.carousel.speakers}
          lead={view.speakers.lead}
          split
        />
        {n === 1 ? (
          <FeaturedPerson person={people[0]!} t={t} />
        ) : (
          <Carousel
            label={t.carousel.speakers}
            count={n}
            desktop={n > 8 ? 'scroll' : 'grid'}
            cols={4}
            labels={{ prev: t.carousel.prev, next: t.carousel.next }}
          >
            {people.map((p, i) => (
              <article
                className="q-speaker"
                key={p.id}
                role="group"
                aria-roledescription="slide"
                aria-label={t.carousel.slide(i + 1, n)}
              >
                <div className="q-speaker__photo">
                  <Portrait
                    person={p}
                    sizes="(min-width: 1440px) 300px, (min-width: 1024px) 23vw, 264px"
                  />
                </div>
                <RoleTag role={roleOf(p)} t={t} />
                <h3 className="q-speaker__name">{p.name}</h3>
                {p.position && <p className="q-speaker__role">{p.position}</p>}
                {p.contribution && <p className="q-speaker__note">{p.contribution}</p>}
              </article>
            ))}
          </Carousel>
        )}
      </div>
    </section>
  )
}

// ---------- 8. Истории участников ----------
export function Stories({ ctx }: { ctx: Ctx }) {
  const { view, t, locale } = ctx
  const items = view.stories.items
  const n = items.length
  return (
    <section className="lp-sec lp-stories" id="stories" data-section="stories">
      <div className="lp-wrap lp-reveal">
        <SectionHead
          overline={t.overline.stories}
          title={view.stories.heading || t.carousel.stories}
          lead={view.stories.lead}
        />
        <Carousel
          label={t.carousel.stories}
          count={n}
          desktop={n > 3 ? 'scroll' : 'grid'}
          cols={3}
          labels={{ prev: t.carousel.prev, next: t.carousel.next }}
        >
          {items.map((it, i) => {
            const meta = [
              it.person.school,
              it.person.firstYear ? t.stories.since(it.person.firstYear) : '',
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <figure
                className="q-story"
                key={i}
                style={{ margin: 0 }}
                role="group"
                aria-roledescription="slide"
                aria-label={t.carousel.slide(i + 1, n)}
              >
                <Quote className="q-icon q-story__mark" aria-hidden="true" />
                <blockquote className="q-story__quote" style={{ margin: 0 }}>
                  {it.quote}
                </blockquote>
                {(it.person.subjects.length > 0 || it.achievement) && (
                  <div className="q-story__tags">
                    {it.person.subjects.map((s) => (
                      <span key={s} className={`q-tag q-tag--${s}`}>
                        {labelOf(SUBJECTS, s, locale)}
                      </span>
                    ))}
                    {it.achievement && (
                      <span className="q-tag q-tag--outline">{it.achievement}</span>
                    )}
                  </div>
                )}
                <figcaption className="q-story__person">
                  <div className="q-story__photo">
                    <Portrait person={it.person} sizes="56px" />
                  </div>
                  <div>
                    <p className="q-story__name">{it.person.name}</p>
                    {meta && <p className="q-story__meta">{meta}</p>}
                  </div>
                </figcaption>
              </figure>
            )
          })}
        </Carousel>
        <div className="lp-stories__foot">
          <div className="lp-stories__cta">
            <a className="q-btn q-btn--primary q-btn--block" href="#register" data-cta="stories">
              <CtaLabel t={t} label={view.hero.primaryCta} price={view.event.price} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------- 9. Обращение вице-президента ----------
export function Address({ ctx }: { ctx: Ctx }) {
  const { view, t } = ctx
  const a = view.address
  const author = a.author
  return (
    <section className="q-dark q-grid-bg lp-sec lp-address" id="address" data-section="address">
      <div className="lp-wrap lp-address__grid lp-reveal">
        <div className="lp-head lp-address__head">
          <p className="q-overline">{t.overline.address}</p>
          {a.heading && <h2 className="q-h2">{a.heading}</h2>}
        </div>
        {author && (
          <div className="lp-address__author">
            <div className="lp-address__photo">
              <Portrait person={author} sizes="(min-width: 1024px) 400px, 72px" />
            </div>
            <div>
              <p className="lp-address__name">{author.name}</p>
              {author.position && <p className="lp-address__role">{author.position}</p>}
            </div>
          </div>
        )}
        <div className="lp-address__body">
          {a.body && <RichText data={a.body} disableContainer />}
          {a.signature && <p className="lp-address__sign">{a.signature}</p>}
        </div>
      </div>
    </section>
  )
}

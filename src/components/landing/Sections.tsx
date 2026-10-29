import { ArrowRight, ChevronDown, Download, Info } from 'lucide-react'
import Image from 'next/image'

import { LazyMount } from '@/components/client/LazyMount'

import { formatDay } from '@/i18n/format'

import type { Ctx } from './context'
import { AdminIcon, SectionHead, SUBJECT_ICONS } from './ui'

// ---------- 2. Для кого ----------
export function Audience({ ctx }: { ctx: Ctx }) {
  const { view, t } = ctx
  const a = view.audience
  return (
    <section className="lp-sec" id="about" data-section="audience">
      <div className="lp-wrap lp-reveal">
        <SectionHead
          overline={t.overline.audience}
          title={a.heading || t.nav.about}
          lead={a.lead}
          split
        />
        <div className="lp-subjects">
          {a.cards.map((c, i) => {
            const Icon = SUBJECT_ICONS[c.subject]
            return (
              <article
                className={`q-subject${c.subject ? ` q-subject--${c.subject}` : ''}`}
                key={i}
              >
                {Icon && (
                  <span className="q-subject__icon">
                    <Icon className="q-icon q-icon--lg" aria-hidden="true" />
                  </span>
                )}
                <h3 className="q-subject__title">{c.title}</h3>
                {c.text && <p className="q-subject__text">{c.text}</p>}
              </article>
            )
          })}
        </div>
        {a.notes.length > 0 && (
          <div className={`lp-notes${a.notes.length === 1 ? ' lp-notes--single' : ''}`}>
            {a.notes.map((n, i) => (
              <div className="lp-note" key={i}>
                <AdminIcon name={n.icon} />
                <div>
                  <p>
                    {n.title && <b>{n.title}</b>} {n.text}
                  </p>
                  {n.action === 'school' && (
                    <button
                      type="button"
                      className="q-btn q-btn--text lp-textbtn"
                      data-dialog="school"
                    >
                      {t.schoolLink}
                      <ArrowRight className="q-icon" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- 3. Что получает участник ----------
export function Benefits({ ctx }: { ctx: Ctx }) {
  const { view, t } = ctx
  const b = view.benefits
  return (
    <section className="lp-sec lp-sec--alt" id="benefits" data-section="benefits">
      <div className="lp-wrap lp-reveal">
        <SectionHead overline={t.overline.benefits} title={b.heading} lead={b.lead} split />
        <div className="lp-benefits">
          {b.items.map((it, i) => (
            <div className="q-benefit" key={i}>
              <span className="q-benefit__icon">
                <AdminIcon name={it.icon} />
              </span>
              <div>
                <h3 className="q-benefit__title">{it.title}</h3>
                {it.text && <p className="q-benefit__text">{it.text}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- Фотографии с прошлого конкурса ----------

// На 1024+: сетка 4 колонки, первое фото 2×2. Чтобы последний ряд был полным,
// несколько горизонтальных фото с конца растягиваются на 2 колонки.
function galleryLayout(images: Ctx['view']['gallery']['images']): string[] {
  const n = images.length
  const classes: string[] = images.map((_, i) => (i === 0 && n > 2 ? 'big' : ''))
  const cells = n > 2 ? n + 3 : n
  let missing = (4 - (cells % 4)) % 4
  for (let i = n - 1; i > 0 && missing > 0; i--) {
    const img = images[i]!.image
    if (img.width >= img.height) {
      classes[i] = 'wide'
      missing--
    }
  }
  return classes
}

export function Gallery({ ctx }: { ctx: Ctx }) {
  const { view, t } = ctx
  const g = view.gallery
  const layout = galleryLayout(g.images)
  return (
    <section className="lp-sec lp-sec--alt" id="gallery" data-section="gallery">
      <div className="lp-wrap lp-reveal">
        <SectionHead
          overline={t.overline.gallery}
          title={g.heading || t.gallery.label}
          lead={g.lead}
          split
        />
        <div className="lp-gallery" role="list" aria-label={t.gallery.label} tabIndex={0}>
          {g.images.map(({ image, caption }, i) => {
            const kind = layout[i]
            const ratio = image.width / image.height
            return (
              <figure
                className={`lp-gallery__item${kind ? ` lp-gallery__item--${kind}` : ''}`}
                role="listitem"
                key={i}
              >
                <LazyMount className="lp-gallery__img" style={{ aspectRatio: `${ratio}` }}>
                  <Image
                    src={image.src}
                    alt={image.alt || caption}
                    width={image.width}
                    height={image.height}
                    sizes={
                      kind === 'big' || kind === 'wide'
                        ? '(min-width: 1440px) 640px, (min-width: 1024px) 50vw, 360px'
                        : '(min-width: 1440px) 320px, (min-width: 1024px) 25vw, 360px'
                    }
                    style={{ objectPosition: image.position }}
                  />
                </LazyMount>
                {caption && <figcaption>{caption}</figcaption>}
              </figure>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------- 4. Программа ----------
export function Program({ ctx }: { ctx: Ctx }) {
  const { view, t, locale } = ctx
  const days = view.event.program
  const pdf = view.docs.regulations
  return (
    <section className="lp-sec" id="program" data-section="program">
      <div className="lp-wrap lp-program">
        <SectionHead overline={t.overline.program} title={view.program.heading || t.nav.program} />
        {view.program.note && (
          <div className="q-note lp-program__note">
            <Info className="q-icon" aria-hidden="true" />
            <span>{view.program.note}</span>
          </div>
        )}
        <div className="q-acc lp-program__days">
          {days.map((day, i) => (
            <details className="q-acc__item lp-acc" id={`program-${i + 1}`} open={i === 0} key={i}>
              <summary className="q-acc__head">
                <span className="q-acc__title">
                  <span className="q-acc__meta">
                    {t.program.day(i + 1)} ·{' '}
                    {day.date ? formatDay(day.date, locale) : t.program.dateTbd}
                  </span>
                  {day.title}
                </span>
                <span className="q-acc__chev" aria-hidden="true">
                  <ChevronDown className="q-icon" />
                </span>
              </summary>
              {day.items.length > 0 && (
                <div className="q-acc__panel">
                  <div className="q-sched">
                    {day.items.map((it, j) => (
                      <div className="q-sched__row" key={j}>
                        <span className="q-sched__time">{it.time || '—:—'}</span>
                        <div>
                          <div className="q-sched__title">{it.title}</div>
                          {it.description && <div className="q-sched__text">{it.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </details>
          ))}
        </div>
        {pdf && (
          <button
            type="button"
            className="q-btn q-btn--text lp-textbtn lp-program__pdf"
            data-dialog="regulations"
          >
            <Download className="q-icon" aria-hidden="true" />
            {t.program.pdf}
          </button>
        )}
      </div>
    </section>
  )
}

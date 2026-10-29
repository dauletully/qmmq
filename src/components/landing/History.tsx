import { Car, Trophy } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { Ctx } from './context'
import { SectionHead } from './ui'

// «~130» → 130, «10 000+» → 10000
function amount(value: string): number {
  const n = Number(value.replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const isCar = (text: string) => /автомоб|машин|көлік|changan|car/i.test(text)

export function History({ ctx }: { ctx: Ctx }) {
  const { view, t } = ctx
  const h = view.history
  const [big, ...parts] = h.figures
  const total = parts.reduce((sum, f) => sum + amount(f.value), 0)
  const kindClass = (kind: string) =>
    kind === 'pause' ? ' is-pause' : kind === 'current' ? ' is-now' : ''

  return (
    <section className="lp-sec lp-sec--alt" id="history" data-section="history">
      <div className="lp-wrap">
        <SectionHead overline={t.overline.history} title={h.heading} lead={h.lead} split />
        <div className="lp-history">
          {big && (
            <div className="lp-card lp-history__card lp-reveal">
              <div className="lp-history__bigrow">
                <p className="lp-history__big" data-count={big.value}>
                  {big.value}
                </p>
                {big.label && <p className="lp-history__biglabel">{big.label}</p>}
              </div>
              {parts.length > 0 && (
                <>
                  <p className="q-label lp-history__chartlabel">{t.history.chartLabel}</p>
                  {total > 0 && (
                    <div
                      className="lp-bar"
                      role="img"
                      aria-label={parts.map((f) => `${f.value} ${f.label}`).join(', ')}
                    >
                      {parts.map((f, i) => (
                        <span
                          key={i}
                          className={`lp-c${i % 4}`}
                          style={{ flex: `${Math.max(amount(f.value), 1)} 1 0` }}
                        />
                      ))}
                    </div>
                  )}
                  <ul
                    className="lp-legend"
                    style={{ '--legend-cols': Math.min(parts.length, 4) } as CSSProperties}
                  >
                    {parts.map((f, i) => (
                      <li key={i}>
                        <span className="lp-legend__head">
                          <span className={`lp-swatch lp-c${i % 4}`} aria-hidden="true" />
                          <span className="lp-legend__value" data-count={f.value}>
                            {f.value}
                          </span>
                        </span>
                        <span className="lp-legend__label">{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          {h.milestones.length > 0 && (
            <ol
              className="q-tl lp-tl lp-reveal"
              style={{ '--tl-cols': h.milestones.length } as CSSProperties}
            >
              {h.milestones.map((m, i) => (
                <li className={`q-tl__item${kindClass(m.kind)}`} key={i}>
                  <span className="q-tl__dot" aria-hidden="true" />
                  <div>
                    {m.period && <div className="q-tl__period">{m.period}</div>}
                    {m.title && <p className="q-tl__title">{m.title}</p>}
                    {m.text && <p className="q-tl__text">{m.text}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {h.prizes.length > 0 && (
            <div className="lp-prizes">
              <p className="q-overline">{t.history.prizes}</p>
              <div className="lp-prizes__list">
                {h.prizes.map((p, i) => {
                  const Icon = isCar(`${p.value} ${p.title}`) ? Car : Trophy
                  const main = p.value || p.title
                  const sub = p.value ? p.title : p.text
                  return (
                    <div className="lp-card lp-prize" key={i}>
                      <span className="lp-prize__icon">
                        <Icon className="q-icon q-icon--lg" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="lp-prize__value">{main}</p>
                        {sub && <p className="lp-prize__text">{sub}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

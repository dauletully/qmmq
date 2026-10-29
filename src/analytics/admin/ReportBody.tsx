import React from 'react'

import type { Report } from '../server/reports'
import { DailyChart } from './DailyChart'
import { fmt, pct } from './format'
import { Bars, Card, FunnelTable, PlanProgress, Tile } from './parts'

const DASH = '—'

type Item = { key: string; label: string; leads: number; paid: number }

// Длинный хвост (регионы) сворачиваем в одну строку «Остальные».
function foldTail(items: Item[], keep: number): Item[] {
  if (items.length <= keep + 1) return items
  const rest = items.slice(keep)
  return [
    ...items.slice(0, keep),
    {
      key: 'rest',
      label: `Остальные (${rest.length})`,
      leads: rest.reduce((s, i) => s + i.leads, 0),
      paid: rest.reduce((s, i) => s + i.paid, 0),
    },
  ]
}

export function ReportBody({ report: r }: { report: Report }) {
  const t = r.totals
  const leadsOk = r.hasLeads
  const noData = t.visits === 0 && t.leads === 0

  return (
    <>
      {!r.hasLeads ? (
        <div className="qa-alert">
          Коллекция заявок ещё не подключена — показаны только данные трекера. Заявки и оплаты
          появятся автоматически.
        </div>
      ) : null}
      {r.leadsError ? (
        <div className="qa-alert">
          Часть данных по заявкам не загрузилась. Подробности — в журнале сервера.
        </div>
      ) : null}

      <div className="qa-tiles">
        <Tile
          label="Посетители"
          color="visitors"
          value={fmt(t.visitors)}
          sub="уникальные браузеры"
        />
        <Tile label="Визиты" value={fmt(t.visits)} sub="перерыв 30 минут — новый визит" />
        <Tile
          label="Заявки"
          color="leads"
          value={leadsOk ? fmt(t.leads) : DASH}
          sub={
            leadsOk
              ? `${fmt(t.registrations)} регистраций · ${fmt(t.schoolLeads)} от школ`
              : undefined
          }
        />
        <Tile
          label="Конверсия"
          value={leadsOk ? pct(t.leads, t.visits) : DASH}
          sub="визит → заявка"
        />
        <Tile
          label="Оплаты за период"
          color="paid"
          value={leadsOk ? fmt(t.paidInPeriod) : DASH}
          sub={leadsOk ? `из заявок периода оплачено ${fmt(t.paidOfLeads)}` : undefined}
        />
      </div>

      {leadsOk ? (
        <section className="qa-card qa-section">
          <header>
            <h2>План оплат</h2>
            <p>
              Все оплаты кампании{r.landing ? ' по выбранному лендингу' : ''}, независимо от периода
            </p>
          </header>
          <PlanProgress steps={r.plan.steps} paid={r.plan.paid} />
        </section>
      ) : null}

      {noData ? (
        <section className="qa-card qa-section">
          <div className="qa-empty">
            За этот период событий нет. Проверьте, что на лендинге подключён трекер
            (src/analytics/README.md), или выберите другой период.
          </div>
        </section>
      ) : null}

      <Card
        className="qa-section"
        title={r.bucket === 'hour' ? 'По часам' : 'По дням'}
        note="Посетители и заявки — на отдельных шкалах"
      >
        <DailyChart
          data={r.series}
          hasLeads={leadsOk}
          totals={{ visitors: t.visitors, leads: t.leads }}
        />
        <details className="qa-details">
          <summary>Таблица</summary>
          <div className="qa-table-wrap">
            <table className="qa-table">
              <thead>
                <tr>
                  <th scope="col">{r.bucket === 'hour' ? 'Час' : 'День'}</th>
                  <th scope="col">Посетители</th>
                  <th scope="col">Визиты</th>
                  {leadsOk ? <th scope="col">Заявки</th> : null}
                </tr>
              </thead>
              <tbody>
                {[...r.series].reverse().map((p) => (
                  <tr key={p.key}>
                    <td>{p.label}</td>
                    <td>{fmt(p.visitors)}</td>
                    <td>{fmt(p.visits)}</td>
                    {leadsOk ? <td>{fmt(p.leads)}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Card>

      <div className="qa-grid qa-grid--2">
        <Card title="Воронка регистрации" note="Посетители, дошедшие до шага; % — от зашедших">
          <Bars
            base={r.funnel[0]?.value || 0}
            items={r.funnel
              .filter((s) => leadsOk || s.key !== 'paid')
              .map((s, i, list) => ({
                key: s.key,
                label: (
                  <>
                    {s.label}
                    {i > 0 && list[i - 1].value ? (
                      <span className="qa-tag" title="Переход с предыдущего шага">
                        {pct(s.value, list[i - 1].value)} от пред.
                      </span>
                    ) : null}
                  </>
                ),
                value: s.value,
              }))}
          />
        </Card>
        <Card title="Досмотр блоков" note="Доля визитов, в которых блок был виден на 40 %">
          <Bars
            base={t.visits}
            max={t.visits || 1}
            items={r.sections.map((s) => ({ key: s.key, label: s.label, value: s.sessions }))}
          />
        </Card>
      </div>

      <Card
        className="qa-section"
        title="Источники"
        note="По первому заходу посетителя. Конверсия — заявки / посетители"
      >
        <FunnelTable
          rows={r.sources.map((s) => ({ ...s, label: s.label }))}
          firstColumn="Источник"
          hasLeads={leadsOk}
          footer
          totalVisitors={t.visitors}
        />
        <p className="qa-note" style={{ marginTop: 10 }}>
          WhatsApp и Telegram часто не передают, откуда пришёл человек, — такие заходы попадают в
          «Прямые». Ссылки, которые рассылаете сами, размечайте: ?utm_source=whatsapp
        </p>
      </Card>

      <Card
        className="qa-section"
        title="UTM-кампании"
        note="utm_campaign · utm_source / utm_medium"
      >
        <FunnelTable
          rows={r.campaigns.map((c) => ({
            ...c,
            label: c.campaign || <span className="qa-muted">без кампании</span>,
            sub: [c.source || '—', c.medium || '—'].join(' / '),
          }))}
          firstColumn="Кампания"
          hasLeads={leadsOk}
        />
      </Card>

      <div className="qa-grid qa-grid--2">
        <Card title="Устройства">
          <FunnelTable rows={r.devices} firstColumn="Тип" hasLeads={leadsOk} showPaid={false} />
          <h3 className="qa-note" style={{ margin: '16px 0 8px', fontWeight: 600 }}>
            Операционные системы
          </h3>
          <Bars
            base={t.visitors}
            items={r.systems
              .slice(0, 6)
              .map((s) => ({ key: s.key, label: s.label, value: s.visitors }))}
          />
        </Card>
        <Card title="Браузеры" note="«в приложении» — встроенный браузер Instagram, WhatsApp и др.">
          <FunnelTable
            rows={r.browsers.slice(0, 12).map((b) => ({
              ...b,
              label: (
                <>
                  {b.label}
                  {b.inApp ? <span className="qa-tag">в приложении</span> : null}
                </>
              ),
            }))}
            firstColumn="Браузер"
            hasLeads={leadsOk}
            showPaid={false}
          />
        </Card>
      </div>

      {leadsOk ? (
        <Card
          className="qa-section"
          title="Заявки за период"
          note="Регионы, предметы и «Как узнали» — по заявкам участников"
        >
          <div className="qa-cols">
            {(
              [
                ['type', 'По типам'],
                ['subject', 'По предметам'],
                ['region', 'По регионам'],
                ['howHeard', 'Как узнали'],
              ] as const
            ).map(([key, title]) => {
              const all = r.leadsBy[key]
              const total = all.reduce((s, i) => s + i.leads, 0)
              const items = foldTail(all, 8)
              return (
                <div key={key}>
                  <h3>{title}</h3>
                  {items.length ? (
                    <Bars
                      color="leads"
                      base={total}
                      items={items.map((i) => ({
                        key: i.key || 'none',
                        label: (
                          <>
                            {i.label}
                            {i.paid ? <span className="qa-tag">оплачено {fmt(i.paid)}</span> : null}
                          </>
                        ),
                        value: i.leads,
                      }))}
                    />
                  ) : (
                    <div className="qa-empty">Нет заявок</div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}
    </>
  )
}

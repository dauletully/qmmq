'use client'

import React from 'react'
import { Area, Bar, CartesianGrid, ComposedChart, Tooltip, XAxis, YAxis } from 'recharts'

type Point = { key: string; label: string; visitors: number; visits: number; leads: number }

const nf = new Intl.NumberFormat('ru-RU')
const compact = (v: number) =>
  v >= 1000 ? `${nf.format(Math.round(v / 100) / 10)}K` : nf.format(v)

function Readout(props: { active?: boolean; payload?: { payload: Point }[]; hasLeads: boolean }) {
  const p = props.payload?.[0]?.payload
  if (!props.active || !p) return null
  return (
    <div className="qa-tooltip">
      <div className="qa-tooltip__title">{p.label}</div>
      <div className="qa-tooltip__row">
        <span
          className="qa-key qa-key--line"
          style={{ '--qa-c': 'var(--qa-visitors)' } as React.CSSProperties}
        />
        <b>{nf.format(p.visitors)}</b> посетителей · {nf.format(p.visits)} визитов
      </div>
      {props.hasLeads ? (
        <div className="qa-tooltip__row">
          <span className="qa-key" style={{ '--qa-c': 'var(--qa-leads)' } as React.CSSProperties} />
          <b>{nf.format(p.leads)}</b> заявок
        </div>
      ) : null}
    </div>
  )
}

const axisTick = { fontSize: 11, fill: 'var(--theme-elevation-500)' }

function MiniChart({
  data,
  dataKey,
  kind,
  color,
  height,
  hasLeads,
}: {
  data: Point[]
  dataKey: 'visitors' | 'leads'
  kind: 'area' | 'bar'
  color: string
  height: number
  hasLeads: boolean
}) {
  return (
    <ComposedChart
      responsive
      data={data}
      style={{ width: '100%', height }}
      margin={{ top: 6, right: 8, bottom: 0, left: 0 }}
      accessibilityLayer
    >
      <CartesianGrid vertical={false} stroke="var(--qa-grid)" />
      <XAxis
        dataKey="label"
        scale="band"
        tick={axisTick}
        tickLine={false}
        axisLine={{ stroke: 'var(--theme-elevation-200)' }}
        interval="preserveStartEnd"
        minTickGap={18}
      />
      <YAxis
        allowDecimals={false}
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        width={36}
        tickFormatter={compact}
      />
      <Tooltip
        cursor={{
          stroke: 'var(--theme-elevation-300)',
          strokeWidth: 1,
          fill: 'var(--theme-elevation-50)',
        }}
        content={(p) => <Readout {...(p as object)} hasLeads={hasLeads} />}
        isAnimationActive={false}
      />
      {kind === 'area' ? (
        <Area
          dataKey={dataKey}
          type="monotone"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4, stroke: 'var(--qa-card)', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      ) : (
        <Bar
          dataKey={dataKey}
          fill={color}
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      )}
    </ComposedChart>
  )
}

export function DailyChart({
  data,
  hasLeads,
  totals,
}: {
  data: Point[]
  hasLeads: boolean
  totals: { visitors: number; leads: number }
}) {
  return (
    <div>
      <div className="qa-chart">
        <div className="qa-chart__title">
          <span
            className="qa-key qa-key--line"
            style={{ '--qa-c': 'var(--qa-visitors)' } as React.CSSProperties}
          />
          Посетители <b>{nf.format(totals.visitors)}</b>
        </div>
        <MiniChart
          data={data}
          dataKey="visitors"
          kind="area"
          color="var(--qa-visitors)"
          height={170}
          hasLeads={hasLeads}
        />
      </div>
      {hasLeads ? (
        <div className="qa-chart">
          <div className="qa-chart__title">
            <span
              className="qa-key"
              style={{ '--qa-c': 'var(--qa-leads)' } as React.CSSProperties}
            />
            Заявки <b>{nf.format(totals.leads)}</b>
          </div>
          <MiniChart
            data={data}
            dataKey="leads"
            kind="bar"
            color="var(--qa-leads)"
            height={130}
            hasLeads={hasLeads}
          />
        </div>
      ) : null}
    </div>
  )
}

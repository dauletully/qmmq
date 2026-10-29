import {
  Atom,
  Award,
  BookOpen,
  Brain,
  Building,
  Calculator,
  CircleCheck,
  Clock,
  Code,
  CodeXml,
  FileBadge,
  GraduationCap,
  Handshake,
  Hourglass,
  Lightbulb,
  type LucideIcon,
  MessagesSquare,
  Mic,
  Sigma,
  Star,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import type { Img } from '@/app/(frontend)/_lib/data'

// Иконки, которые можно выбрать в админке (BENEFIT_ICONS в lib/constants).
const ICONS: Record<string, LucideIcon> = {
  Award,
  FileBadge,
  Hourglass,
  Building,
  GraduationCap,
  BookOpen,
  Brain,
  Calculator,
  Clock,
  Lightbulb,
  MessagesSquare,
  Mic,
  Sigma,
  Atom,
  Code,
  Trophy,
  Users,
  Handshake,
  Star,
  Target,
}

export function AdminIcon({
  name,
  className = 'q-icon q-icon--lg',
}: {
  name: string
  className?: string
}) {
  const Cmp = ICONS[name] ?? CircleCheck
  return <Cmp className={className} aria-hidden="true" />
}

export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  math: Sigma,
  physics: Atom,
  informatics: CodeXml,
}

export function SectionHead({
  overline,
  title,
  lead,
  split,
  side,
  id,
  dark,
}: {
  overline: string
  title: string
  lead?: string
  split?: boolean
  side?: ReactNode
  id?: string
  dark?: boolean
}) {
  const Titles = (
    <div className="lp-head__titles">
      <p className="q-overline">{overline}</p>
      <h2 className="q-h2" id={id}>
        {title}
      </h2>
    </div>
  )
  const hasSide = Boolean(lead || side)
  if (split && hasSide) {
    return (
      <div className={`lp-head lp-head--split${dark ? ' q-dark' : ''}`}>
        {Titles}
        <div className="lp-head__side">
          {lead ? <p className="q-lead">{lead}</p> : <span />}
          {side}
        </div>
      </div>
    )
  }
  return (
    <div className="lp-head">
      <p className="q-overline">{overline}</p>
      <h2 className="q-h2" id={id}>
        {title}
      </h2>
      {lead && <p className="q-lead">{lead}</p>}
    </div>
  )
}

// Выделить римский номер конкурса (XII) золотом.
export function highlightRoman(text: string): ReactNode {
  const m = /(^|[\s«(])([IVXLC]{1,7})(?=[\s,.»)]|$)/.exec(text)
  if (!m) return text
  const start = m.index + m[1].length
  const end = start + m[2].length
  return (
    <>
      {text.slice(0, start)}
      <span className="lp-accent">{m[2]}</span>
      {text.slice(end)}
    </>
  )
}

export function Logo({ img, size = 'md' }: { img: Img | null; size?: 'md' | 'lg' }) {
  const h = size === 'lg' ? 44 : 32
  if (img && !img.svg) {
    const w = Math.round((img.width / img.height) * h)
    return (
      <span className={`lp-logo${size === 'lg' ? ' lp-logo--lg' : ''}`}>
        <Image
          src={img.src}
          alt=""
          width={w}
          height={h}
          sizes={`${w}px`}
          style={{ width: 'auto', height: h }}
        />
      </span>
    )
  }
  return (
    <span className={`lp-logo${size === 'lg' ? ' lp-logo--lg' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img?.src || '/brand/qmmq-logo.png'}
        alt=""
        width={Math.round((159 / 120) * h)}
        height={h}
        loading="lazy"
      />
    </span>
  )
}

// Мотив: первое предложение «Начал» Евклида — треугольник на отрезке AB двумя окружностями.
export function Construction({
  className,
  variant = 'mobile',
  animate = true,
}: {
  className?: string
  variant?: 'mobile' | 'desktop' | 'light'
  animate?: boolean
}) {
  const draw = animate ? 'lp-draw' : ''
  const late = animate ? 'lp-draw lp-draw--late' : ''
  const fade = animate ? 'lp-fade' : ''
  if (variant === 'light') {
    return (
      <svg viewBox="0 0 480 400" aria-hidden="true" className={`lp-construct ${className ?? ''}`}>
        <circle
          className="q-construct q-construct--ink-faint"
          cx="150"
          cy="250"
          r="180"
          strokeOpacity="0.5"
        />
        <circle
          className="q-construct q-construct--ink-faint"
          cx="330"
          cy="250"
          r="180"
          strokeOpacity="0.5"
        />
        <path
          className="q-construct q-construct--ink"
          d="M150 250 L330 250 L240 94.12 Z"
          strokeOpacity="0.6"
        />
        <circle cx="150" cy="250" r="4" style={{ fill: 'var(--brand)' }} />
        <circle cx="330" cy="250" r="4" style={{ fill: 'var(--brand)' }} />
        <circle cx="240" cy="94.12" r="5" style={{ fill: 'var(--accent)' }} />
      </svg>
    )
  }
  const label = variant === 'desktop' ? 16 : 20
  return (
    <svg viewBox="0 0 480 400" aria-hidden="true" className={`lp-construct ${className ?? ''}`}>
      <circle
        className={`q-construct q-construct--faint ${draw}`}
        pathLength={1}
        cx="150"
        cy="250"
        r="180"
      />
      <circle
        className={`q-construct q-construct--faint ${draw}`}
        pathLength={1}
        cx="330"
        cy="250"
        r="180"
      />
      <line
        className={`q-construct q-construct--faint ${fade}`}
        x1="240"
        y1="40"
        x2="240"
        y2="430"
        strokeDasharray="4 6"
      />
      {variant === 'desktop' && (
        <line
          className={`q-construct q-construct--faint ${fade}`}
          x1="-40"
          y1="250"
          x2="520"
          y2="250"
          strokeDasharray="4 6"
        />
      )}
      <path
        className={`q-construct ${late}`}
        pathLength={1}
        d="M150 250 L330 250 L240 94.12 Z"
        style={variant === 'desktop' ? { strokeWidth: 1.5 } : undefined}
      />
      <g className={fade}>
        <path className="q-construct" d="M174 250 A24 24 0 0 0 162 229.22" />
        <line className="q-construct" x1="240" y1="245" x2="240" y2="255" />
        <line className="q-construct" x1="190.67" y1="169.56" x2="199.33" y2="174.56" />
        <line className="q-construct" x1="280.67" y1="174.56" x2="289.33" y2="169.56" />
        <circle className="q-construct-dot" cx="150" cy="250" r="4" />
        <circle className="q-construct-dot" cx="330" cy="250" r="4" />
        <circle className="q-construct-dot" cx="240" cy="94.12" r="4" />
        <text className="q-construct-label" x="128" y="276" style={{ fontSize: label }}>
          A
        </text>
        <text className="q-construct-label" x="340" y="276" style={{ fontSize: label }}>
          B
        </text>
        <text
          className="q-construct-label"
          x={variant === 'desktop' ? 233 : 232}
          y={variant === 'desktop' ? 78 : 74}
          style={{ fontSize: label }}
        >
          C
        </text>
      </g>
    </svg>
  )
}

// Абзацы из многострочного текста админки.
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {p}
          </p>
        ))}
    </>
  )
}

import { LangSwitch } from '@/components/client/LangSwitch'
import { MobileMenu } from '@/components/client/MobileMenu'

import type { Img } from '@/app/(frontend)/_lib/data'
import type { Dict } from '@/i18n/dictionary'
import type { Locale } from '@/lib/constants'

import { CtaLabel } from './CtaLabel'
import { Logo } from './ui'

type Props = {
  t: Dict
  locale: Locale
  name: string
  logo: Img | null
  home: string
  hrefs: Record<Locale, string>
  // Пункты меню (только на видимые блоки). Пусто — шапка без меню (страница «Спасибо», 404).
  nav?: Array<{ href: string; label: string }>
  withCta?: boolean
  price?: number
}

export function Header({ t, locale, name, logo, home, hrefs, nav = [], withCta, price }: Props) {
  const lang = <LangSwitch locale={locale} hrefs={hrefs} label={t.langLabel} />
  return (
    <header className="q-header q-dark lp-header">
      <div className="lp-header__inner">
        <a className="lp-brand" href={home} aria-label={`${name || 'QMMQ'} — ${t.homeLabel}`}>
          <Logo img={logo} />
          {name && (
            <span className="lp-brand__name" aria-hidden="true">
              {name}
            </span>
          )}
        </a>
        {nav.length > 0 && (
          <nav className="q-header__nav lp-nav" aria-label={t.navLabel}>
            {nav.map((it) => (
              <a key={it.href} href={it.href}>
                {it.label}
              </a>
            ))}
          </nav>
        )}
        <span className="q-header__spacer" />
        {lang}
        {withCta && (
          <a
            className="q-btn q-btn--primary q-btn--sm lp-header__cta"
            href="#register"
            data-cta="header"
          >
            <CtaLabel t={t} short />
          </a>
        )}
        {nav.length > 0 && (
          <MobileMenu
            items={nav}
            labels={{ open: t.menu, close: t.closeMenu, nav: t.navLabel }}
            logo={<Logo img={logo} />}
            lang={lang}
            cta={
              withCta ? (
                <a className="q-btn q-btn--primary q-btn--block" href="#register" data-cta="header">
                  <CtaLabel t={t} price={price} />
                </a>
              ) : null
            }
          />
        )}
      </div>
    </header>
  )
}

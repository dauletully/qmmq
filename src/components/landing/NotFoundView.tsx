import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/lib/constants'

import { Header } from './Header'
import { Construction } from './ui'

// Стилизованная 404. Без обращения к базе — страница собирается при next build.
export function NotFoundView({ locale }: { locale: Locale }) {
  const t = getDict(locale)
  const other = getDict(locale === 'kk' ? 'ru' : 'kk')
  const home = locale === 'kk' ? '/kz' : '/'
  return (
    <div className="lp">
      <Header
        t={t}
        locale={locale}
        name=""
        logo={null}
        home={home}
        hrefs={{ ru: '/', kk: '/kz' }}
      />
      <main id="main" className="q-dark q-grid-bg lp-404">
        <Construction className="lp-404__construct" variant="desktop" animate={false} />
        <div className="lp-wrap" style={{ position: 'relative' }}>
          <p className="lp-404__code">404</p>
          <h1 className="q-h1">{t.notFound.title}</h1>
          <p className="q-lead">{t.notFound.text}</p>
          <p className="q-small" lang={other.htmlLang} style={{ marginTop: 8 }}>
            {other.notFound.title}. {other.notFound.text}
          </p>
          <div className="lp-404__actions">
            <a className="q-btn q-btn--primary" href={home}>
              {t.notFound.back}
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

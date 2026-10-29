import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'

import { getLandingView } from '@/app/(frontend)/_lib/data'
import { pagePath } from '@/app/(frontend)/_lib/site'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/lib/constants'

import { langHrefs } from './context'
import { Header } from './Header'

export type DocKind = 'offer' | 'privacy'

export function docKind(value: string): DocKind | null {
  return value === 'offer' || value === 'privacy' ? value : null
}

// Договор-оферта и политика, если в «Настройках сайта» вставлен текст, а не PDF.
export async function DocPage({
  routeSlug,
  locale,
  kind,
}: {
  routeSlug: string
  locale: Locale
  kind: DocKind
}) {
  const view = await getLandingView(routeSlug, locale)
  const text = view?.docTexts[kind]
  if (!view || !text) notFound()
  const t = getDict(locale)
  return (
    <div className="lp">
      <Header
        t={t}
        locale={locale}
        name={view.association.name}
        logo={view.association.logo}
        home={pagePath(view.base, locale)}
        hrefs={langHrefs(view, `/doc/${kind}`)}
      />
      <main id="main" className="lp-simple">
        <div className="lp-wrap lp-doc">
          <a className="q-btn q-btn--text lp-textbtn" href={pagePath(view.base, locale)}>
            {t.doc.back}
          </a>
          <h1 className="q-h1" style={{ marginTop: 16, color: 'var(--brand)' }}>
            {kind === 'offer' ? t.footer.offer : t.footer.privacy}
          </h1>
          <div className="lp-doc__body">
            <RichText data={text} />
          </div>
        </div>
      </main>
    </div>
  )
}

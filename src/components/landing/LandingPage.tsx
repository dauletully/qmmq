import { notFound } from 'next/navigation'

import { getLandingView } from '@/app/(frontend)/_lib/data'
import { eventJsonLd } from '@/app/(frontend)/_lib/seo'
import { pagePath } from '@/app/(frontend)/_lib/site'
import { AnalyticsTracker } from '@/analytics/client'
import { Motion } from '@/components/client/Motion'
import { StickyBar } from '@/components/client/StickyBar'
import { RegulationsDialog } from '@/components/forms/RegulationsDialog'
import { SchoolDialog } from '@/components/forms/SchoolDialog'
import { getDict } from '@/i18n/dictionary'
import type { Locale } from '@/lib/constants'

import { Faq, FinalAndContacts, Footer, Partners } from './Bottom'
import { langHrefs, makeCtx, visibleSections } from './context'
import { CtaLabel } from './CtaLabel'
import { Header } from './Header'
import { Hero } from './Hero'
import { History } from './History'
import { Address, Speakers, Stories } from './People'
import { Pricing } from './Pricing'
import { Audience, Benefits, Gallery, Program } from './Sections'

// После дедлайна страница из кеша сама переключается на «Лист ожидания» ещё до отрисовки.
function regScript(deadlineMs: number | null) {
  return `(function(s){var d=${deadlineMs ?? 0};if(d&&Date.now()>=d)s.parentNode.setAttribute('data-reg','closed')})(document.currentScript)`
}

export async function LandingPage({ routeSlug, locale }: { routeSlug: string; locale: Locale }) {
  const view = await getLandingView(routeSlug, locale)
  if (!view) notFound()
  const t = getDict(locale)
  const ctx = makeCtx(view, t)
  const vis = visibleSections(view)
  const deadlineMs = view.event.deadline ? new Date(view.event.deadline).getTime() : null

  const nav = [
    vis.audience && { href: '#about', label: t.nav.about },
    vis.program && { href: '#program', label: t.nav.program },
    vis.speakers && { href: '#speakers', label: t.nav.speakers },
    { href: '#pricing', label: t.nav.pricing },
    vis.faq && { href: '#faq', label: t.nav.faq },
    { href: '#contacts', label: t.nav.contacts },
  ].filter((x): x is { href: string; label: string } => Boolean(x))

  return (
    <div className="lp" data-reg={ctx.closed ? 'closed' : 'open'} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: regScript(deadlineMs) }} />
      <a className="lp-skip" href="#main">
        {t.skip}
      </a>
      <Header
        t={t}
        locale={locale}
        name={view.association.name}
        logo={view.association.logo}
        home={pagePath(view.base, locale)}
        hrefs={langHrefs(view)}
        nav={nav}
        withCta
        price={view.event.price}
      />
      <main id="main">
        <Hero ctx={ctx} />
        {vis.gallery && <Gallery ctx={ctx} />}
        {vis.audience && <Audience ctx={ctx} />}
        {vis.benefits && <Benefits ctx={ctx} />}
        {vis.program && <Program ctx={ctx} />}
        <Pricing ctx={ctx} />
        {vis.speakers && <Speakers ctx={ctx} />}
        {vis.history && <History ctx={ctx} />}
        {vis.stories && <Stories ctx={ctx} />}
        {vis.address && <Address ctx={ctx} />}
        {vis.partners && <Partners ctx={ctx} />}
        {vis.faq && <Faq ctx={ctx} />}
        <FinalAndContacts ctx={ctx} />
      </main>
      <Footer ctx={ctx} />
      <StickyBar
        locale={locale}
        deadline={view.event.deadline}
        renderedAt={ctx.renderedAt}
        whatsappHref={ctx.whatsappHref}
        label={<CtaLabel t={t} label={view.hero.primaryCta} price={view.event.price} />}
      />
      <SchoolDialog
        landing={view.slug}
        locale={locale}
        base={view.base}
        groupMinSize={view.event.groupMinSize}
        note={view.forms.schoolNote}
        docs={{ offer: view.docs.offer, privacy: view.docs.privacy }}
      />
      <RegulationsDialog
        landing={view.slug}
        locale={locale}
        docs={{ offer: view.docs.offer, privacy: view.docs.privacy }}
      />
      <Motion />
      <AnalyticsTracker locale={locale} landing={view.slug} pixels={view.pixels} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: eventJsonLd(view, locale, ctx.closed) }}
      />
    </div>
  )
}

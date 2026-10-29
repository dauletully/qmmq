import type { LandingView } from '@/app/(frontend)/_lib/data'
import { pagePath } from '@/app/(frontend)/_lib/site'
import type { Dict } from '@/i18n/dictionary'
import type { Locale } from '@/lib/constants'

export type Ctx = {
  view: LandingView
  t: Dict
  locale: Locale
  closed: boolean
  renderedAt: number
  whatsappHref: string | null
}

// Время рендера: от него считаются счётчик и «Лист ожидания» в HTML (клиент потом уточнит).
export function makeCtx(view: LandingView, t: Dict): Ctx {
  const renderedAt = Date.now()
  const deadline = view.event.deadline ? new Date(view.event.deadline).getTime() : null
  const wa = view.contacts.whatsapp
  return {
    view,
    t,
    locale: view.locale,
    closed: deadline !== null && renderedAt >= deadline,
    renderedAt,
    whatsappHref: wa
      ? `https://wa.me/${wa.number}?text=${encodeURIComponent(t.whatsappMessage)}`
      : null,
  }
}

export function langHrefs(view: LandingView, rest = '', query = ''): Record<Locale, string> {
  return {
    ru: `${pagePath(view.base, 'ru', rest)}${query}`,
    kk: `${pagePath(view.base, 'kk', rest)}${query}`,
  }
}

// Какие блоки показываются (пустые скрыты, пункты меню на них — тоже).
export function visibleSections(view: LandingView) {
  return {
    audience: view.audience.cards.length > 0,
    benefits: view.benefits.items.length > 0,
    gallery: view.gallery.images.length > 0,
    program: view.event.program.length > 0,
    speakers: view.speakers.people.length > 0,
    history:
      view.history.milestones.length > 0 ||
      view.history.figures.length > 0 ||
      view.history.prizes.length > 0,
    stories: view.stories.items.length > 0,
    address: Boolean(view.address.body),
    partners: view.partners.items.length > 0,
    faq: view.faq.items.length > 0,
  }
}

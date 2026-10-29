import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Locale } from '@/lib/constants'
import { labelOf, SOCIAL_NETWORKS } from '@/lib/constants'
import { getPublicIntegrations, type PublicIntegrations } from '@/lib/integrations'
import { normalizePhone } from '@/lib/phone'
import { LANDING_CACHE_TAG } from '@/lib/revalidate'
import type { Event, Landing, Media, Partner, Person, SiteSetting } from '@/payload-types'

import { ACTIVE_SLUG, basePath, localePrefix } from './site'

// Данные лендинга для вёрстки. Читаются из Payload при первом запросе страницы (не при сборке),
// кешируются с тегом LANDING_CACHE_TAG; хуки коллекций сбрасывают кеш при сохранении в админке.

export type Img = {
  src: string
  width: number
  height: number
  alt: string
  // object-position из фокуса Payload
  position: string
  svg: boolean
}

export type RichText = NonNullable<NonNullable<Landing['address']>['body']>

export type PersonView = {
  id: number
  name: string
  initials: string
  photo: Img | null
  roles: string[]
  position: string
  contribution: string
  school: string
  firstYear: number | null
  subjects: string[]
}

export type ProgramDay = {
  date: string | null
  title: string
  items: Array<{ time: string; title: string; description: string }>
}

export type LandingView = {
  slug: string
  routeSlug: string
  base: string
  locale: Locale
  isActive: boolean
  updatedAt: string
  association: { name: string; logo: Img | null }
  contacts: {
    phones: Array<{ display: string; href: string; label: string }>
    whatsapp: { display: string; number: string } | null
    email: string | null
    socials: Array<{ label: string; url: string }>
    requisites: string
  }
  docs: { offer: string | null; privacy: string | null; regulations: string | null }
  docTexts: { offer: RichText | null; privacy: RichText | null }
  pixels: PublicIntegrations
  event: {
    title: string
    startDate: string
    endDate: string | null
    deadline: string | null
    price: number
    groupMinSize: number
    city: string
    venue: string
    venueAddress: string
    mapUrl: string | null
    chatUrl: string | null
    program: ProgramDay[]
  }
  hero: {
    eyebrow: string
    heading: string
    subheading: string
    partnerNote: string
    partnerLogo: Img | null
    stats: Array<{ value: string; label: string }>
    primaryCta: string
    secondaryCta: string
  }
  audience: {
    heading: string
    lead: string
    cards: Array<{ subject: string; title: string; text: string }>
    notes: Array<{ icon: string; title: string; text: string; action: string }>
  }
  benefits: {
    heading: string
    lead: string
    items: Array<{ icon: string; title: string; text: string }>
  }
  gallery: { heading: string; lead: string; images: Array<{ image: Img; caption: string }> }
  program: { heading: string; note: string }
  pricing: {
    heading: string
    includes: string[]
    documentNote: string
    groupTerms: string
    paymentNote: string
    deadlineNote: string
  }
  speakers: { heading: string; lead: string; people: PersonView[] }
  history: {
    heading: string
    lead: string
    milestones: Array<{ period: string; kind: string; title: string; text: string }>
    figures: Array<{ value: string; label: string }>
    prizes: Array<{ title: string; value: string; text: string }>
  }
  stories: {
    heading: string
    lead: string
    items: Array<{ person: PersonView; quote: string; achievement: string }>
  }
  address: {
    heading: string
    body: RichText | null
    author: PersonView | null
    signature: string
  }
  partners: {
    heading: string
    items: Array<{ id: number; name: string; kind: string; url: string | null; logo: Img | null }>
  }
  faq: { heading: string; items: Array<{ question: string; answer: string }> }
  contactsBlock: { heading: string; finalCta: string }
  forms: { howHeardOptions: string[]; schoolNote: string; consentText: string }
  thankYou: { heading: string; body: string }
  seo: { title: string; description: string; ogImage: Img | null }
}

const s = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

// «10 000+», «~5 млн ₸»: неразрывные пробелы внутри числа и перед единицами.
const num = (v: unknown): string =>
  s(v)
    .replace(/(\d)\s+(?=\d)/g, '$1\u00A0')
    .replace(/(\d)\s+(?=[^\s\d])/g, '$1\u00A0')
    .replace(/\s+₸/g, '\u00A0₸')

// +77010000000 → +7 (701) 000-00-00, как в макете
function displayPhone(n: string): string {
  return `+7 (${n.slice(2, 5)}) ${n.slice(5, 8)}-${n.slice(8, 10)}-${n.slice(10, 12)}`
}

function isObj<T>(v: unknown): v is T {
  return Boolean(v) && typeof v === 'object'
}

function relId(v: unknown): number | null {
  if (typeof v === 'number') return v
  if (isObj<{ id: number }>(v) && typeof v.id === 'number') return v.id
  return null
}

type SizeName = 'thumb' | 'card' | 'hero' | 'og'

// Берём размер Payload не меньше нужного (next/image сожмёт дальше), иначе оригинал.
function toImg(media: unknown, prefer: SizeName[] = ['card', 'hero'], alt = ''): Img | null {
  if (!isObj<Media>(media) || !media.url) return null
  const svg = media.mimeType === 'image/svg+xml' || /\.svg$/i.test(media.filename ?? '')
  if (!svg && !media.mimeType?.startsWith('image/')) return null
  let src = media.url
  let width = media.width ?? 0
  let height = media.height ?? 0
  if (!svg) {
    for (const name of prefer) {
      const size = media.sizes?.[name]
      if (size?.url && size.width && size.height) {
        src = size.url
        width = size.width
        height = size.height
        break
      }
    }
  }
  const fx = typeof media.focalX === 'number' ? media.focalX : 50
  const fy = typeof media.focalY === 'number' ? media.focalY : 50
  return {
    src,
    width: width || 400,
    height: height || 400,
    alt: s(media.alt) || alt,
    position: `${fx}% ${fy}%`,
    svg,
  }
}

function fileUrl(media: unknown): string | null {
  return isObj<Media>(media) && media.url ? media.url : null
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

// Только люди с согласием на публикацию.
function toPerson(value: unknown): PersonView | null {
  if (!isObj<Person>(value) || !value.publishConsent || !s(value.name)) return null
  const name = s(value.name)
  return {
    id: value.id,
    name,
    initials: initials(name),
    photo: toImg(value.photo, ['card', 'hero'], name),
    roles: (value.roles ?? []).filter(Boolean) as string[],
    position: s(value.position),
    contribution: s(value.contribution),
    school: s(value.school),
    firstYear: value.firstParticipationYear ?? null,
    subjects: (value.subjects ?? []) as string[],
  }
}

function hasRichText(v: unknown): v is RichText {
  if (!isObj<RichText>(v)) return false
  const children = (v as { root?: { children?: Array<{ children?: unknown[]; text?: string }> } })
    .root?.children
  if (!Array.isArray(children)) return false
  return children.some((c) => JSON.stringify(c).match(/"text":"[^"]*\S/))
}

function docLink(
  group: SiteSetting['offer'] | SiteSetting['privacy'],
  base: string,
  locale: Locale,
  kind: 'offer' | 'privacy',
): { href: string | null; text: RichText | null } {
  const pdf = fileUrl(group?.pdf)
  if (pdf) return { href: pdf, text: null }
  if (hasRichText(group?.text)) {
    return { href: `${base}${localePrefix(locale)}/doc/${kind}`, text: group!.text as RichText }
  }
  return { href: null, text: null }
}

async function loadLanding(routeSlug: string, locale: Locale): Promise<LandingView | null> {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 1,
    locale,
    fallbackLocale: 'ru',
    overrideAccess: false,
    populate: { landings: { slug: true } },
  })
  const activeId = relId(settings.activeLanding)
  const where: Where | null =
    routeSlug === ACTIVE_SLUG
      ? activeId
        ? { id: { equals: activeId } }
        : null
      : { slug: { equals: routeSlug } }
  if (!where) return null

  const { docs } = await payload.find({
    collection: 'landings',
    where,
    depth: 2,
    limit: 1,
    locale,
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  const landing = docs[0]
  const event = landing?.event
  if (!landing || !isObj<Event>(event)) return null

  const base = basePath(routeSlug)
  const pixels = await getPublicIntegrations(payload)
  const offer = docLink(settings.offer, base, locale, 'offer')
  const privacy = docLink(settings.privacy, base, locale, 'privacy')

  const phones = (settings.phones ?? [])
    .map((p) => {
      const n = normalizePhone(p.number)
      if (n) return { display: displayPhone(n), href: `tel:${n}`, label: s(p.label) }
      const digits = s(p.number).replace(/\D/g, '')
      return digits.length >= 10
        ? { display: s(p.number), href: `tel:+${digits}`, label: s(p.label) }
        : null
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const waNorm = normalizePhone(settings.whatsapp)
  const wa = waNorm ? waNorm.slice(1) : s(settings.whatsapp).replace(/\D/g, '')

  const hero = landing.hero ?? {}
  const people = (landing.speakers?.people ?? []).map(toPerson).filter(Boolean) as PersonView[]

  return {
    slug: landing.slug,
    routeSlug,
    base,
    locale,
    isActive: activeId === landing.id,
    updatedAt: landing.updatedAt,
    association: {
      name: s(settings.associationName),
      logo: toImg(settings.logo, ['thumb'], s(settings.associationName)),
    },
    contacts: {
      phones,
      whatsapp:
        wa.length >= 10 ? { display: waNorm ? displayPhone(waNorm) : `+${wa}`, number: wa } : null,
      email: s(settings.email) || null,
      socials: (settings.socials ?? [])
        .filter((x) => s(x.url))
        .map((x) => ({
          url: s(x.url),
          label:
            s((x as { label?: string | null }).label) ||
            labelOf(SOCIAL_NETWORKS, x.network, locale),
        })),
      requisites: s(settings.requisites),
    },
    docs: {
      offer: offer.href,
      privacy: privacy.href,
      regulations: fileUrl(event.regulationsPdf),
    },
    docTexts: { offer: offer.text, privacy: privacy.text },
    pixels,
    event: {
      title: s(event.title),
      startDate: event.startDate,
      endDate: event.endDate ?? null,
      deadline: event.registrationDeadline ?? null,
      price: event.price,
      groupMinSize: event.groupMinSize ?? 5,
      city: s(event.city),
      venue: s(event.venue),
      venueAddress: s(event.venueAddress),
      mapUrl: s(event.mapUrl) || null,
      chatUrl: s(event.participantsChatUrl) || null,
      program: (event.program ?? [])
        .map((day) => ({
          date: day.date ?? null,
          title: s(day.title),
          items: (day.items ?? [])
            .map((it) => ({
              time: s(it.time),
              title: s(it.title),
              description: s(it.description),
            }))
            .filter((it) => it.title),
        }))
        .filter((day) => day.title || day.items.length),
    },
    hero: {
      eyebrow: s(hero.eyebrow),
      heading: s(hero.heading) || s(event.title),
      subheading: s(hero.subheading),
      partnerNote: s(hero.partnerNote),
      partnerLogo: toImg(hero.partnerLogo, ['thumb']),
      stats: (hero.stats ?? [])
        .map((x) => ({ value: num(x.value), label: s(x.label) }))
        .filter((x) => x.value),
      primaryCta: s(hero.primaryCta),
      secondaryCta: s(hero.secondaryCta),
    },
    audience: {
      heading: s(landing.audience?.heading),
      lead: s(landing.audience?.lead),
      cards: (landing.audience?.cards ?? [])
        .map((c) => ({ subject: s(c.subject), title: s(c.title), text: s(c.text) }))
        .filter((c) => c.title || c.text),
      notes: (landing.audience?.notes ?? [])
        .map((n) => ({
          icon: s(n.icon),
          title: s(n.title),
          text: s(n.text),
          action: s(n.action) || 'none',
        }))
        .filter((n) => n.title || n.text),
    },
    benefits: {
      heading: s(landing.benefits?.heading),
      lead: s(landing.benefits?.lead),
      items: (landing.benefits?.items ?? [])
        .map((b) => ({ icon: s(b.icon), title: s(b.title), text: s(b.text) }))
        .filter((b) => b.title),
    },
    gallery: {
      heading: s(landing.gallery?.heading),
      lead: s(landing.gallery?.lead),
      images: (landing.gallery?.images ?? [])
        .map((g) => {
          const image = toImg(g.image, ['hero', 'card'], s(g.caption))
          return image ? { image, caption: s(g.caption) } : null
        })
        .filter((g): g is NonNullable<typeof g> => Boolean(g)),
    },
    program: { heading: s(landing.program?.heading), note: s(landing.program?.note) },
    pricing: {
      heading: s(landing.pricing?.heading),
      includes: (landing.pricing?.includes ?? []).map((i) => s(i.text)).filter(Boolean),
      documentNote: s(landing.pricing?.documentNote),
      groupTerms: s(landing.pricing?.groupTerms),
      paymentNote: s(landing.pricing?.paymentNote),
      deadlineNote: s(landing.pricing?.deadlineNote),
    },
    speakers: {
      heading: s(landing.speakers?.heading),
      lead: s(landing.speakers?.lead),
      people,
    },
    history: {
      heading: s(landing.history?.heading),
      lead: s(landing.history?.lead),
      milestones: (landing.history?.milestones ?? [])
        .map((m) => ({
          period: s(m.period),
          kind: s(m.kind) || 'default',
          title: s(m.title),
          text: s(m.text),
        }))
        .filter((m) => m.period || m.title),
      figures: (landing.history?.figures ?? [])
        .map((f) => ({ value: num(f.value), label: s(f.label) }))
        .filter((f) => f.value),
      prizes: (landing.history?.prizes ?? [])
        .map((p) => ({ title: s(p.title), value: num(p.value), text: s(p.text) }))
        .filter((p) => p.title || p.value),
    },
    stories: {
      heading: s(landing.stories?.heading),
      lead: s(landing.stories?.lead),
      items: (landing.stories?.items ?? [])
        .map((it) => {
          const person = toPerson(it.person)
          const quote = s(it.quote)
          return person && quote ? { person, quote, achievement: s(it.achievement) } : null
        })
        .filter((it): it is NonNullable<typeof it> => Boolean(it)),
    },
    address: {
      heading: s(landing.address?.heading),
      body: hasRichText(landing.address?.body) ? (landing.address!.body as RichText) : null,
      author: toPerson(landing.address?.author),
      signature: s(landing.address?.signature),
    },
    partners: {
      heading: s(landing.partners?.heading),
      items: (landing.partners?.items ?? [])
        .filter((p): p is Partner => isObj<Partner>(p) && Boolean(s(p.name)))
        .map((p) => ({
          id: p.id,
          name: s(p.name),
          kind: p.kind,
          url: s(p.url) || null,
          logo: toImg(p.logo, ['thumb'], s(p.name)),
        })),
    },
    faq: {
      heading: s(landing.faq?.heading),
      items: (landing.faq?.items ?? [])
        .map((q) => ({ question: s(q.question), answer: s(q.answer) }))
        .filter((q) => q.question && q.answer),
    },
    contactsBlock: {
      heading: s(landing.contacts?.heading),
      finalCta: s(landing.contacts?.finalCta),
    },
    forms: {
      howHeardOptions: (landing.forms?.howHeardOptions ?? [])
        .map((o) => s(o.label))
        .filter(Boolean),
      schoolNote: s(landing.forms?.schoolNote),
      consentText: s(landing.forms?.consentText),
    },
    thankYou: { heading: s(landing.thankYou?.heading), body: s(landing.thankYou?.body) },
    seo: {
      title: s(landing.seo?.title),
      description: s(landing.seo?.description),
      ogImage: toImg(landing.seo?.ogImage, ['og']),
    },
  }
}

const cachedLanding = unstable_cache(loadLanding, ['landing-view-v1'], {
  tags: [LANDING_CACHE_TAG],
  revalidate: 3600,
})

// React cache — один запрос к кешу на рендер (страница + generateMetadata).
export const getLandingView = cache(
  async (routeSlug: string, locale: Locale): Promise<LandingView | null> => {
    if (!/^(_active|[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(routeSlug)) return null
    return cachedLanding(routeSlug, locale)
  },
)

// Slug активного лендинга — для страницы «/» на основном домене и sitemap.
export const getActiveSlug = unstable_cache(
  async (): Promise<string | null> => {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
      overrideAccess: false,
      populate: { landings: { slug: true } },
    })
    const active = settings.activeLanding
    return isObj<Landing>(active) && active.slug ? active.slug : null
  },
  ['landing-active-slug-v1'],
  { tags: [LANDING_CACHE_TAG], revalidate: 3600 },
)

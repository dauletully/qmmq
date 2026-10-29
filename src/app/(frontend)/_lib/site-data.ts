import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Locale, SiteLocale } from '@/lib/constants'
import { EN_ENABLED_PAGES, labelOf, SOCIAL_NETWORKS } from '@/lib/constants'
import { computeEventStatus } from '@/lib/eventStatus'
import { normalizePhone } from '@/lib/phone'
import { LANDING_CACHE_TAG, SITE_CACHE_TAGS } from '@/lib/revalidate'
import type {
  AboutPage,
  Document,
  Event,
  HomePage,
  Material,
  Media,
  News,
  Page,
  Partner,
  PartnersPage,
  Person,
  SiteSetting,
} from '@/payload-types'

import { fileUrl, hasRichText, isObj, relId, s, toImg, type Img, type RichText } from './data'

// Данные сайта qmmq.kz для вёрстки (вторая очередь: страницы сайта). Как и для лендинга:
// читаются из Payload при запросе, кешируются unstable_cache с тегами SITE_CACHE_TAGS;
// хуки коллекций (src/lib/revalidate.ts) сбрасывают теги при сохранении в админке.
//
// Локали: ru и kk — весь сайт; en — только «Об ассоциации» и «Партнёрам» (EN_ENABLED_PAGES).
// Хелперы принимают SiteLocale, но содержимое для en отдают только разрешённые страницы;
// остальным при en подставляется ru (и фронтенд не должен давать на них ссылки /en).

const REVALIDATE = 3600

export type { Img, RichText }

export const SITE_LOCALE_PREFIX: Record<SiteLocale, string> = { ru: '', kk: '/kz', en: '/en' }

export function sitePath(locale: SiteLocale, path = ''): string {
  return `${SITE_LOCALE_PREFIX[locale]}${path}` || '/'
}

// Какие страницы есть на английском (ключ — первый сегмент пути без локали).
export function pageHasEn(section: string): boolean {
  return (EN_ENABLED_PAGES as readonly string[]).includes(section)
}

// Локаль Payload: en только у страниц с английской версией, иначе ru.
function dataLocale(locale: SiteLocale, allowEn = false): SiteLocale {
  return locale === 'en' && !allowEn ? 'ru' : locale
}

// Подписи справочников на сайте: для en — русские (справочники RU/KZ).
export function dictLocale(locale: SiteLocale): Locale {
  return locale === 'kk' ? 'kk' : 'ru'
}

type Ref = { id: number; slug: string; title: string }

function eventRef(value: unknown): Ref | null {
  if (!isObj<Event>(value) || !value.slug) return null
  return { id: value.id, slug: value.slug, title: s(value.title) }
}

function mediaFile(media: unknown): { url: string; filename: string; size: number | null } | null {
  if (!isObj<Media>(media) || !media.url) return null
  return { url: media.url, filename: media.filename ?? '', size: media.filesize ?? null }
}

function year(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.getFullYear()
}

// +77010000000 → +7 (701) 000-00-00
function displayPhone(n: string): string {
  return `+7 (${n.slice(2, 5)}) ${n.slice(5, 8)}-${n.slice(8, 10)}-${n.slice(10, 12)}`
}

// ---- Настройки сайта -----------------------------------------------------------------------

export type SiteSettingsView = {
  association: { name: string; logo: Img | null }
  contacts: {
    phones: Array<{ display: string; href: string; label: string }>
    whatsapp: { display: string; number: string } | null
    email: string | null
    address: string
    socials: Array<{ network: string; label: string; url: string }>
    requisites: string
  }
  // Ссылки на оферту и политику: PDF из настроек или null (текстовая версия — на лендинге /doc/…).
  docs: { offer: string | null; privacy: string | null }
  docTexts: { offer: RichText | null; privacy: RichText | null }
  activeLandingSlug: string | null
}

async function loadSiteSettings(locale: SiteLocale): Promise<SiteSettingsView> {
  const payload = await getPayload({ config })
  const settings: SiteSetting = await payload.findGlobal({
    slug: 'site-settings',
    depth: 1,
    locale: dataLocale(locale, true),
    fallbackLocale: 'ru',
    overrideAccess: false,
    populate: { landings: { slug: true } },
  })
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
  const active = settings.activeLanding
  return {
    association: {
      name: s(settings.associationName),
      logo: toImg(settings.logo, ['thumb'], s(settings.associationName)),
    },
    contacts: {
      phones,
      whatsapp:
        wa.length >= 10 ? { display: waNorm ? displayPhone(waNorm) : `+${wa}`, number: wa } : null,
      email: s(settings.email) || null,
      address: s(settings.address),
      socials: (settings.socials ?? [])
        .filter((x) => s(x.url))
        .map((x) => ({
          network: x.network,
          url: s(x.url),
          label: s(x.label) || labelOf(SOCIAL_NETWORKS, x.network, dictLocale(locale)),
        })),
      requisites: s(settings.requisites),
    },
    docs: { offer: fileUrl(settings.offer?.pdf), privacy: fileUrl(settings.privacy?.pdf) },
    docTexts: {
      offer: hasRichText(settings.offer?.text) ? (settings.offer!.text as RichText) : null,
      privacy: hasRichText(settings.privacy?.text) ? (settings.privacy!.text as RichText) : null,
    },
    activeLandingSlug: isObj<{ slug?: string }>(active) && active.slug ? active.slug : null,
  }
}

export const getSiteSettings = cache(
  unstable_cache(loadSiteSettings, ['site-settings-v1'], {
    tags: [SITE_CACHE_TAGS.settings, LANDING_CACHE_TAG],
    revalidate: REVALIDATE,
  }),
)

// ---- Люди ----------------------------------------------------------------------------------

export type SitePerson = {
  id: number
  name: string
  initials: string
  photo: Img | null
  roles: string[]
  position: string
  teamPosition: string
  contribution: string
  bio: string
  quote: string
  subjects: string[]
  region: string | null
  school: string
  firstYear: number | null
  studentAchievements: string
  contact: { email: string | null; phone: string | null; url: string | null }
  order: number
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

function toSitePerson(value: unknown, withContact: boolean): SitePerson | null {
  if (!isObj<Person>(value) || !value.publishConsent || !s(value.name)) return null
  const name = s(value.name)
  return {
    id: value.id,
    name,
    initials: initials(name),
    photo: toImg(value.photo, ['card', 'hero'], name),
    roles: (value.roles ?? []).filter(Boolean) as string[],
    position: s(value.position),
    teamPosition: s(value.teamPosition),
    contribution: s(value.contribution),
    bio: s(value.bio),
    quote: s(value.quote),
    subjects: (value.subjects ?? []) as string[],
    region: value.region ?? null,
    school: s(value.school),
    firstYear: value.firstParticipationYear ?? null,
    studentAchievements: s(value.studentAchievements),
    contact: withContact
      ? {
          email: s(value.contact?.email) || null,
          phone: s(value.contact?.phone) || null,
          url: s(value.contact?.url) || null,
        }
      : { email: null, phone: null, url: null },
    order: value.order ?? 100,
  }
}

async function loadPeople(
  locale: SiteLocale,
  where: Where,
  allowEn: boolean,
  withContact: boolean,
): Promise<SitePerson[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'people',
    where,
    depth: 1,
    limit: 500,
    pagination: false,
    sort: 'order',
    locale: dataLocale(locale, allowEn),
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  return docs.map((d) => toSitePerson(d, withContact)).filter(Boolean) as SitePerson[]
}

// Команда (/about/team) — роль team, с согласием. Есть английская версия.
export const getTeam = cache(
  unstable_cache(
    (locale: SiteLocale) =>
      loadPeople(locale, { roles: { contains: 'team' } }, true, true),
    ['site-team-v1'],
    { tags: [SITE_CACHE_TAGS.people], revalidate: REVALIDATE },
  ),
)

// Каталог педагогов-мастеров (/community/people): роль master + «Показывать в каталоге» + согласие.
// Фильтры по предмету и региону — здесь же (список небольшой, фильтруем после кеша).
export type CatalogFilters = { subject?: string | null; region?: string | null }

const cachedMasters = unstable_cache(
  (locale: SiteLocale) =>
    loadPeople(
      locale,
      { and: [{ roles: { contains: 'master' } }, { showInCatalog: { equals: true } }] },
      false,
      true,
    ),
  ['site-masters-v1'],
  { tags: [SITE_CACHE_TAGS.people], revalidate: REVALIDATE },
)

export const getMastersCatalog = cache(
  async (locale: SiteLocale, filters: CatalogFilters = {}): Promise<SitePerson[]> => {
    const all = await cachedMasters(locale)
    return all.filter(
      (p) =>
        (!filters.subject || p.subjects.includes(filters.subject)) &&
        (!filters.region || p.region === filters.region),
    )
  },
)

// ---- Мероприятия ---------------------------------------------------------------------------

export type EventStatus = 'open' | 'closed' | 'finished'

export type EventCard = {
  id: number
  slug: string
  title: string
  type: string
  level: string | null
  format: string
  subjects: string[]
  region: string | null
  city: string
  startDate: string
  endDate: string | null
  deadline: string | null
  year: number
  price: number
  status: EventStatus
  cover: Img | null
  forWhom: string
  contestSeason: number | null
  updatedAt: string
}

export type Winner = {
  place: string
  name: string
  detail: string
  prize: string
  person: SitePerson | null
}

export type ProgramDay = {
  date: string | null
  title: string
  items: Array<{ time: string; title: string; description: string }>
}

export type EventView = EventCard & {
  venue: string
  venueAddress: string
  mapUrl: string | null
  description: RichText | null
  documentIssued: string
  groupMinSize: number
  program: ProgramDay[]
  regulationsUrl: string | null
  certificateSample: Img | null
  chatUrl: string | null
  // Лендинг, привязанный к мероприятию (кнопка «Регистрация» ведёт на него), если есть.
  landingSlug: string | null
  results: {
    summary: string
    winners: Winner[]
    photos: Array<{ image: Img; caption: string }>
    tasksFile: { url: string; filename: string; size: number | null } | null
    pressRelease: RichText | null
    hasContent: boolean
  }
  materials: MaterialCard[]
  news: NewsCard[]
}

function toEventCard(e: Event, now: number): EventCard {
  return {
    id: e.id,
    slug: e.slug,
    title: s(e.title),
    type: e.type,
    level: e.level ?? null,
    format: e.format ?? 'offline',
    subjects: (e.subjects ?? []) as string[],
    region: e.region ?? null,
    city: s(e.city),
    startDate: e.startDate,
    endDate: e.endDate ?? null,
    deadline: e.registrationDeadline ?? null,
    year: year(e.startDate) ?? new Date(now).getFullYear(),
    price: e.price,
    status: computeEventStatus(e, now),
    cover: toImg(e.cover, ['card', 'hero'], s(e.title)),
    forWhom: s(e.forWhom),
    contestSeason: e.contestSeason ?? null,
    updatedAt: e.updatedAt,
  }
}

async function loadAllEvents(locale: SiteLocale): Promise<Event[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'events',
    depth: 1,
    limit: 500,
    pagination: false,
    sort: '-startDate',
    locale: dataLocale(locale),
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  return docs
}

const cachedEvents = unstable_cache(loadAllEvents, ['site-events-v1'], {
  tags: [SITE_CACHE_TAGS.events],
  revalidate: REVALIDATE,
})

export type EventFilters = {
  subject?: string | null
  type?: string | null
  format?: string | null
  level?: string | null
  region?: string | null
  year?: number | null
  // upcoming — открытые и закрытые, но не прошедшие; archive — завершённые
  scope?: 'upcoming' | 'archive' | 'all'
}

export type EventList = {
  items: EventCard[]
  // Значения для фильтров — по всем мероприятиям выбранного scope
  years: number[]
  subjects: string[]
  types: string[]
  formats: string[]
  levels: string[]
  regions: string[]
}

// Каталог /events (scope upcoming — ближайшие первыми) и архив /events/archive (новые первыми).
// Статус вычисляется по датам, поэтому фильтруем после чтения (мероприятий немного).
export const listEvents = cache(
  async (locale: SiteLocale, filters: EventFilters = {}): Promise<EventList> => {
    const now = Date.now()
    const scope = filters.scope ?? 'all'
    const all = (await cachedEvents(locale))
      .map((e) => toEventCard(e, now))
      .filter((e) =>
        scope === 'archive'
          ? e.status === 'finished'
          : scope === 'upcoming'
            ? e.status !== 'finished'
            : true,
      )
    const uniq = <T>(list: Array<T | null | undefined>) =>
      Array.from(new Set(list.filter((x): x is T => x !== null && x !== undefined)))
    const items = all.filter(
      (e) =>
        (!filters.subject || e.subjects.includes(filters.subject)) &&
        (!filters.type || e.type === filters.type) &&
        (!filters.format || e.format === filters.format) &&
        (!filters.level || e.level === filters.level) &&
        (!filters.region || e.region === filters.region) &&
        (!filters.year || e.year === filters.year),
    )
    if (scope === 'upcoming') items.sort((a, b) => a.startDate.localeCompare(b.startDate))
    return {
      items,
      years: uniq(all.map((e) => e.year)).sort((a, b) => b - a),
      subjects: uniq(all.flatMap((e) => e.subjects)),
      types: uniq(all.map((e) => e.type)),
      formats: uniq(all.map((e) => e.format)),
      levels: uniq(all.map((e) => e.level)),
      regions: uniq(all.map((e) => e.region)),
    }
  },
)

function toProgram(e: Event): ProgramDay[] {
  return (e.program ?? [])
    .map((day) => ({
      date: day.date ?? null,
      title: s(day.title),
      items: (day.items ?? [])
        .map((it) => ({ time: s(it.time), title: s(it.title), description: s(it.description) }))
        .filter((it) => it.title),
    }))
    .filter((day) => day.title || day.items.length)
}

async function loadEvent(slug: string, locale: SiteLocale): Promise<EventView | null> {
  const payload = await getPayload({ config })
  const loc = dataLocale(locale)
  const { docs } = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
    locale: loc,
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  const e = docs[0]
  if (!e) return null
  const now = Date.now()

  const [landings, materials, news] = await Promise.all([
    payload.find({
      collection: 'landings',
      where: { event: { equals: e.id } },
      depth: 0,
      limit: 1,
      select: { slug: true },
      overrideAccess: false,
    }),
    payload.find({
      collection: 'materials',
      where: { event: { equals: e.id } },
      depth: 1,
      limit: 100,
      sort: 'kind',
      locale: loc,
      fallbackLocale: 'ru',
      overrideAccess: false,
    }),
    payload.find({
      collection: 'news',
      where: { relatedEvent: { equals: e.id } },
      depth: 1,
      limit: 12,
      sort: '-publishedAt',
      locale: loc,
      fallbackLocale: 'ru',
      overrideAccess: false,
    }),
  ])

  const winners: Winner[] = (e.results?.winners ?? []).map((w) => {
    const person = toSitePerson(w.person, false)
    return {
      place: w.place,
      name: person?.name || s(w.name),
      detail: s(w.detail) || person?.school || '',
      prize: s(w.prize),
      person,
    }
  })
  const photos = (e.results?.photos ?? [])
    .map((p) => {
      const image = toImg(p.image, ['hero', 'card'], s(p.caption))
      return image ? { image, caption: s(p.caption) } : null
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const pressRelease = hasRichText(e.results?.pressRelease)
    ? (e.results!.pressRelease as RichText)
    : null
  const tasksFile = mediaFile(e.results?.tasksFile)

  return {
    ...toEventCard(e, now),
    venue: s(e.venue),
    venueAddress: s(e.venueAddress),
    mapUrl: s(e.mapUrl) || null,
    description: hasRichText(e.description) ? (e.description as RichText) : null,
    documentIssued: s(e.documentIssued),
    groupMinSize: e.groupMinSize ?? 5,
    program: toProgram(e),
    regulationsUrl: fileUrl(e.regulationsPdf),
    certificateSample: toImg(e.certificateSample, ['card']),
    chatUrl: s(e.participantsChatUrl) || null,
    landingSlug: landings.docs[0]?.slug ?? null,
    results: {
      summary: s(e.results?.summary),
      winners,
      photos,
      tasksFile,
      pressRelease,
      hasContent: Boolean(
        s(e.results?.summary) || winners.length || photos.length || tasksFile || pressRelease,
      ),
    },
    materials: materials.docs.map((m) => toMaterialCard(m, locale)),
    news: news.docs.map(toNewsCard),
  }
}

export const getEvent = cache(
  unstable_cache(loadEvent, ['site-event-v1'], {
    tags: [SITE_CACHE_TAGS.events, SITE_CACHE_TAGS.materials, SITE_CACHE_TAGS.news, LANDING_CACHE_TAG],
    revalidate: REVALIDATE,
  }),
)

// ---- Конкурс учителей: сезоны (/contest, /contest/[год]) ----------------------------------

export type ContestSeason = EventCard & { winners: Winner[]; resultsSummary: string }

async function loadContestSeasons(locale: SiteLocale): Promise<ContestSeason[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'events',
    where: { contestSeason: { exists: true } },
    depth: 2,
    limit: 100,
    pagination: false,
    sort: '-startDate',
    locale: dataLocale(locale),
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  const now = Date.now()
  return docs
    .filter((e) => typeof e.contestSeason === 'number')
    .map((e) => ({
      ...toEventCard(e, now),
      resultsSummary: s(e.results?.summary),
      winners: (e.results?.winners ?? []).map((w) => {
        const person = toSitePerson(w.person, false)
        return {
          place: w.place,
          name: person?.name || s(w.name),
          detail: s(w.detail) || person?.school || '',
          prize: s(w.prize),
          person,
        }
      }),
    }))
}

// Все сезоны, новые первыми. Текущий (не finished) — первый элемент с status !== 'finished'.
export const listContestSeasons = cache(
  unstable_cache(loadContestSeasons, ['site-contest-seasons-v1'], {
    tags: [SITE_CACHE_TAGS.events, SITE_CACHE_TAGS.people],
    revalidate: REVALIDATE,
  }),
)

// Сезон по году (/contest/2023). Если в одном году два конкурса — первый по дате.
export const getContestSeason = cache(
  async (yearValue: number, locale: SiteLocale): Promise<EventView | null> => {
    const seasons = await listContestSeasons(locale)
    const season = seasons.filter((x) => x.year === yearValue).at(-1)
    return season ? getEvent(season.slug, locale) : null
  },
)

// ---- Новости -------------------------------------------------------------------------------

export type NewsCard = {
  id: number
  slug: string
  title: string
  excerpt: string
  cover: Img | null
  publishedAt: string
  tags: string[]
  event: Ref | null
  updatedAt: string
}

export type NewsView = NewsCard & {
  body: RichText | null
  gallery: Array<{ image: Img; caption: string }>
  source: { name: string; url: string } | null
  seo: { title: string; description: string; ogImage: Img | null }
}

function toNewsCard(n: News): NewsCard {
  return {
    id: n.id,
    slug: n.slug,
    title: s(n.title),
    excerpt: s(n.excerpt),
    cover: toImg(n.cover, ['card', 'hero'], s(n.title)),
    publishedAt: n.publishedAt ?? n.createdAt,
    tags: (n.tags ?? []).map((t) => s(t)).filter(Boolean),
    event: eventRef(n.relatedEvent),
    updatedAt: n.updatedAt,
  }
}

export const NEWS_PAGE_SIZE = 12

export type NewsList = {
  items: NewsCard[]
  page: number
  totalPages: number
  total: number
  tags: string[]
}

async function loadNewsList(locale: SiteLocale, page: number, tag: string | null): Promise<NewsList> {
  const payload = await getPayload({ config })
  const where: Where = tag
    ? { and: [{ _status: { equals: 'published' } }, { tags: { contains: tag } }] }
    : { _status: { equals: 'published' } }
  const [result, allTags] = await Promise.all([
    payload.find({
      collection: 'news',
      where,
      depth: 1,
      limit: NEWS_PAGE_SIZE,
      page,
      sort: '-publishedAt',
      locale: dataLocale(locale),
      fallbackLocale: 'ru',
      overrideAccess: false,
    }),
    payload.find({
      collection: 'news',
      where: { _status: { equals: 'published' } },
      depth: 0,
      limit: 500,
      pagination: false,
      select: { tags: true },
      overrideAccess: false,
    }),
  ])
  const tags = Array.from(
    new Set(allTags.docs.flatMap((n) => (n.tags ?? []).map((t) => s(t)).filter(Boolean))),
  ).sort((a, b) => a.localeCompare(b, 'ru'))
  return {
    items: result.docs.map(toNewsCard),
    page: result.page ?? page,
    totalPages: result.totalPages,
    total: result.totalDocs,
    tags,
  }
}

export const listNews = cache(
  unstable_cache(
    (locale: SiteLocale, opts: { page?: number; tag?: string | null } = {}) =>
      loadNewsList(locale, Math.max(1, opts.page ?? 1), opts.tag ?? null),
    ['site-news-list-v1'],
    { tags: [SITE_CACHE_TAGS.news], revalidate: REVALIDATE },
  ),
)

async function loadNewsItem(slug: string, locale: SiteLocale): Promise<NewsView | null> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'news',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 2,
    limit: 1,
    locale: dataLocale(locale),
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  const n = docs[0]
  if (!n) return null
  return {
    ...toNewsCard(n),
    body: hasRichText(n.body) ? (n.body as RichText) : null,
    gallery: (n.gallery ?? [])
      .map((g) => {
        const image = toImg(g.image, ['hero', 'card'], s(g.caption))
        return image ? { image, caption: s(g.caption) } : null
      })
      .filter((g): g is NonNullable<typeof g> => Boolean(g)),
    source: s(n.sourceUrl) ? { name: s(n.sourceName) || s(n.sourceUrl), url: s(n.sourceUrl) } : null,
    seo: {
      title: s(n.seo?.title) || s(n.title),
      description: s(n.seo?.description) || s(n.excerpt),
      ogImage: toImg(n.seo?.ogImage, ['og']) ?? toImg(n.cover, ['og', 'hero']),
    },
  }
}

export const getNewsItem = cache(
  unstable_cache(loadNewsItem, ['site-news-item-v1'], {
    tags: [SITE_CACHE_TAGS.news],
    revalidate: REVALIDATE,
  }),
)

// Последние новости для RSS (/news/rss.xml) и главной.
export const getNewsFeed = cache(
  unstable_cache(
    async (locale: SiteLocale, limit = 30): Promise<NewsCard[]> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'news',
        where: { _status: { equals: 'published' } },
        depth: 1,
        limit,
        sort: '-publishedAt',
        locale: dataLocale(locale),
        fallbackLocale: 'ru',
        overrideAccess: false,
      })
      return docs.map(toNewsCard)
    },
    ['site-news-feed-v1'],
    { tags: [SITE_CACHE_TAGS.news], revalidate: REVALIDATE },
  ),
)

// ---- Материалы -----------------------------------------------------------------------------

export type MaterialCard = {
  id: number
  title: string
  kind: string
  subject: string | null
  year: number | null
  access: 'public' | 'registered' | 'participants'
  // Файл/видео отдаются только для access = public (поле скрыто правами доступа для остальных).
  available: boolean
  file: { url: string; filename: string; size: number | null } | null
  videoUrl: string | null
  description: string
  event: Ref | null
  // Текст-пометка для закрытых материалов (RU/KK); null — материал открыт.
  lockedNote: string | null
}

const LOCKED_NOTE: Record<Locale, string> = {
  ru: 'Доступно после запуска личного кабинета',
  kk: 'Жеке кабинет іске қосылғаннан кейін қолжетімді',
}

function toMaterialCard(m: Material, locale: SiteLocale): MaterialCard {
  const file = mediaFile(m.file)
  const videoUrl = s(m.videoUrl) || null
  const available = m.access === 'public' && Boolean(file || videoUrl)
  const event = eventRef(m.event)
  return {
    id: m.id,
    title: s(m.title),
    kind: m.kind,
    subject: m.subject ?? null,
    year: m.year ?? (isObj<Event>(m.event) ? year(m.event.startDate) : null),
    access: m.access,
    available,
    file: available ? file : null,
    videoUrl: available ? videoUrl : null,
    description: s(m.description),
    event,
    lockedNote: m.access === 'public' ? null : LOCKED_NOTE[dictLocale(locale)],
  }
}

export type MaterialFilters = {
  kind?: string | null
  subject?: string | null
  year?: number | null
  eventSlug?: string | null
}

export type MaterialList = {
  items: MaterialCard[]
  years: number[]
  kinds: string[]
  subjects: string[]
}

const cachedMaterials = unstable_cache(
  async (locale: SiteLocale): Promise<MaterialCard[]> => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'materials',
      depth: 1,
      limit: 1000,
      pagination: false,
      sort: '-year',
      locale: dataLocale(locale),
      fallbackLocale: 'ru',
      overrideAccess: false,
    })
    return docs.map((m) => toMaterialCard(m, locale))
  },
  ['site-materials-v1'],
  { tags: [SITE_CACHE_TAGS.materials, SITE_CACHE_TAGS.events], revalidate: REVALIDATE },
)

// Библиотека /materials. Закрытые материалы тоже в списке — с lockedNote и без файла.
export const listMaterials = cache(
  async (locale: SiteLocale, filters: MaterialFilters = {}): Promise<MaterialList> => {
    const all = await cachedMaterials(locale)
    const uniq = <T>(list: Array<T | null>) =>
      Array.from(new Set(list.filter((x): x is T => x !== null)))
    return {
      items: all.filter(
        (m) =>
          (!filters.kind || m.kind === filters.kind) &&
          (!filters.subject || m.subject === filters.subject) &&
          (!filters.year || m.year === filters.year) &&
          (!filters.eventSlug || m.event?.slug === filters.eventSlug),
      ),
      years: uniq(all.map((m) => m.year)).sort((a, b) => b - a),
      kinds: uniq(all.map((m) => m.kind)),
      subjects: uniq(all.map((m) => m.subject)),
    }
  },
)

// ---- Документы (/about/documents) ---------------------------------------------------------

export type DocumentView = {
  id: number
  title: string
  kind: string
  description: string
  file: { url: string; filename: string; size: number | null }
}

export const getDocuments = cache(
  unstable_cache(
    async (locale: SiteLocale): Promise<DocumentView[]> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'documents',
        depth: 1,
        limit: 200,
        pagination: false,
        sort: 'order',
        locale: dataLocale(locale, true),
        fallbackLocale: 'ru',
        overrideAccess: false,
      })
      return docs
        .map((d: Document): DocumentView | null => {
          const file = mediaFile(d.file)
          return file
            ? { id: d.id, title: s(d.title), kind: d.kind, description: s(d.description), file }
            : null
        })
        .filter((d): d is DocumentView => d !== null)
    },
    ['site-documents-v1'],
    { tags: [SITE_CACHE_TAGS.documents], revalidate: REVALIDATE },
  ),
)

// ---- Партнёры ------------------------------------------------------------------------------

export type PartnerCard = {
  id: number
  name: string
  kind: string
  url: string | null
  logo: Img | null
  years: string
  description: string
}

function toPartnerCard(p: Partner): PartnerCard {
  return {
    id: p.id,
    name: s(p.name),
    kind: p.kind,
    url: s(p.url) || null,
    logo: toImg(p.logo, ['thumb'], s(p.name)),
    years: s(p.years),
    description: s(p.description),
  }
}

// Прошлые партнёры для /partners — только с отметкой «Показывать в блоке».
export const getPastPartners = cache(
  unstable_cache(
    async (locale: SiteLocale): Promise<PartnerCard[]> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'partners',
        where: { showOnPartnersPage: { equals: true } },
        depth: 1,
        limit: 200,
        pagination: false,
        sort: 'order',
        locale: dataLocale(locale, true),
        fallbackLocale: 'ru',
        overrideAccess: false,
      })
      return docs.filter((p) => s(p.name)).map(toPartnerCard)
    },
    ['site-past-partners-v1'],
    { tags: [SITE_CACHE_TAGS.partners], revalidate: REVALIDATE },
  ),
)

// ---- Глобалы страниц -----------------------------------------------------------------------

export type HomeView = {
  hero: {
    heading: string
    lead: string
    primaryCta: string
    secondaryCta: string
    featuredEvent: EventCard | null
  }
  about: { heading: string; text: string }
  community: { heading: string; text: string }
  upcoming: EventCard[]
  news: NewsCard[]
  partners: PartnerCard[]
  seo: { title: string; description: string; ogImage: Img | null }
}

async function loadHome(locale: SiteLocale): Promise<HomeView> {
  const payload = await getPayload({ config })
  const home: HomePage = await payload.findGlobal({
    slug: 'home-page',
    depth: 1,
    locale: dataLocale(locale),
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  const [events, news, partners] = await Promise.all([
    listEvents(locale, { scope: 'upcoming' }),
    getNewsFeed(locale, 3),
    getPastPartners(locale),
  ])
  const featuredId = relId(home.hero?.featuredEvent)
  const featured =
    (featuredId ? events.items.find((e) => e.id === featuredId) : null) ?? events.items[0] ?? null
  return {
    hero: {
      heading: s(home.hero?.heading),
      lead: s(home.hero?.lead),
      primaryCta: s(home.hero?.primaryCta),
      secondaryCta: s(home.hero?.secondaryCta),
      featuredEvent: featured,
    },
    about: { heading: s(home.about?.heading), text: s(home.about?.text) },
    community: { heading: s(home.community?.heading), text: s(home.community?.text) },
    upcoming: events.items.slice(0, 6),
    news,
    partners,
    seo: {
      title: s(home.seo?.title),
      description: s(home.seo?.description),
      ogImage: toImg(home.seo?.ogImage, ['og']),
    },
  }
}

export const getHome = cache(
  unstable_cache(loadHome, ['site-home-v1'], {
    tags: [SITE_CACHE_TAGS.home, SITE_CACHE_TAGS.events, SITE_CACHE_TAGS.news, SITE_CACHE_TAGS.partners],
    revalidate: REVALIDATE,
  }),
)

export type TimelineItem = {
  year: number
  period: string
  title: string
  text: string
  event: Ref | null
}

export type AboutView = {
  heading: string
  lead: string
  cover: Img | null
  mission: RichText | null
  figures: Array<{ value: string; label: string }>
  history: { heading: string; lead: string; timeline: TimelineItem[] }
  team: { heading: string; lead: string; members: SitePerson[] }
  documents: { heading: string; lead: string; items: DocumentView[] }
  seo: { title: string; description: string }
}

async function loadAbout(locale: SiteLocale): Promise<AboutView> {
  const payload = await getPayload({ config })
  const about: AboutPage = await payload.findGlobal({
    slug: 'about-page',
    depth: 1,
    locale: dataLocale(locale, true),
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  const [members, documents] = await Promise.all([getTeam(locale), getDocuments(locale)])
  return {
    heading: s(about.heading),
    lead: s(about.lead),
    cover: toImg(about.cover, ['hero', 'card']),
    mission: hasRichText(about.mission) ? (about.mission as RichText) : null,
    figures: (about.figures ?? [])
      .map((f) => ({ value: s(f.value), label: s(f.label) }))
      .filter((f) => f.value),
    history: {
      heading: s(about.historyHeading),
      lead: s(about.historyLead),
      timeline: (about.timeline ?? [])
        .map((t) => ({
          year: t.year,
          period: s(t.period) || String(t.year),
          title: s(t.title),
          text: s(t.text),
          event: eventRef(t.event),
        }))
        .sort((a, b) => a.year - b.year),
    },
    team: { heading: s(about.teamHeading), lead: s(about.teamLead), members },
    documents: { heading: s(about.documentsHeading), lead: s(about.documentsLead), items: documents },
    seo: { title: s(about.seoTitle), description: s(about.seoDescription) },
  }
}

// «Об ассоциации» — есть английская версия.
export const getAbout = cache(
  unstable_cache(loadAbout, ['site-about-v1'], {
    tags: [SITE_CACHE_TAGS.about, SITE_CACHE_TAGS.people, SITE_CACHE_TAGS.documents],
    revalidate: REVALIDATE,
  }),
)

export type PartnersView = {
  heading: string
  lead: string
  formats: Array<{ icon: string; title: string; text: string }>
  sponsorPack: { url: string; filename: string; size: number | null } | null
  pastPartnersHeading: string
  pastPartners: PartnerCard[]
  contactHeading: string
  contactNote: string
  seo: { title: string; description: string }
}

async function loadPartnersPage(locale: SiteLocale): Promise<PartnersView> {
  const payload = await getPayload({ config })
  const page: PartnersPage = await payload.findGlobal({
    slug: 'partners-page',
    depth: 1,
    locale: dataLocale(locale, true),
    fallbackLocale: 'ru',
    overrideAccess: false,
  })
  return {
    heading: s(page.heading),
    lead: s(page.lead),
    formats: (page.formats ?? [])
      .map((f) => ({ icon: s(f.icon), title: s(f.title), text: s(f.text) }))
      .filter((f) => f.title),
    sponsorPack: mediaFile(page.sponsorPack),
    pastPartnersHeading: s(page.pastPartnersHeading),
    pastPartners: await getPastPartners(locale),
    contactHeading: s(page.contactHeading),
    contactNote: s(page.contactNote),
    seo: { title: s(page.seo?.title), description: s(page.seo?.description) },
  }
}

// «Партнёрам» — есть английская версия.
export const getPartnersPage = cache(
  unstable_cache(loadPartnersPage, ['site-partners-page-v1'], {
    tags: [SITE_CACHE_TAGS.partnersPage, SITE_CACHE_TAGS.partners],
    revalidate: REVALIDATE,
  }),
)

// ---- Текстовые страницы (/[slug]) ---------------------------------------------------------

export type PageView = {
  slug: string
  title: string
  body: RichText | null
  hasEn: boolean
  seo: { title: string; description: string }
  updatedAt: string
}

export const getPage = cache(
  unstable_cache(
    async (slug: string, locale: SiteLocale): Promise<PageView | null> => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'pages',
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
        depth: 0,
        limit: 1,
        locale: dataLocale(locale, true),
        fallbackLocale: 'ru',
        overrideAccess: false,
      })
      const p: Page | undefined = docs[0]
      if (!p) return null
      if (locale === 'en' && !p.showInEn) return null
      return {
        slug: p.slug,
        title: s(p.title),
        body: hasRichText(p.body) ? (p.body as RichText) : null,
        hasEn: Boolean(p.showInEn),
        seo: { title: s(p.seo?.title) || s(p.title), description: s(p.seo?.description) },
        updatedAt: p.updatedAt,
      }
    },
    ['site-page-v1'],
    { tags: [SITE_CACHE_TAGS.pages], revalidate: REVALIDATE },
  ),
)

// ---- Sitemap -------------------------------------------------------------------------------

export type SitemapEntry = {
  // Путь без локали, например '/events/contest-2026'
  path: string
  locales: SiteLocale[]
  lastModified: string | null
  priority: number
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

const STATIC_PAGES: Array<[string, number, SitemapEntry['changeFrequency']]> = [
  ['', 1, 'weekly'],
  ['/about', 0.8, 'monthly'],
  ['/about/history', 0.6, 'yearly'],
  ['/about/team', 0.6, 'monthly'],
  ['/about/documents', 0.4, 'yearly'],
  ['/events', 0.9, 'weekly'],
  ['/events/archive', 0.6, 'monthly'],
  ['/contest', 0.8, 'monthly'],
  ['/community', 0.6, 'monthly'],
  ['/community/people', 0.6, 'weekly'],
  ['/community/join', 0.5, 'yearly'],
  ['/news', 0.8, 'daily'],
  ['/materials', 0.6, 'weekly'],
  ['/partners', 0.6, 'monthly'],
  ['/contacts', 0.5, 'yearly'],
]

const RU_KK: SiteLocale[] = ['ru', 'kk']
const ALL: SiteLocale[] = ['ru', 'kk', 'en']

export const getSitemapEntries = cache(
  unstable_cache(
    async (): Promise<SitemapEntry[]> => {
      const payload = await getPayload({ config })
      const entries: SitemapEntry[] = STATIC_PAGES.map(([path, priority, changeFrequency]) => ({
        path,
        locales: pageHasEn(path.split('/')[1] ?? '') ? ALL : RU_KK,
        lastModified: null,
        priority,
        changeFrequency,
      }))
      const [events, news, pages] = await Promise.all([
        payload.find({
          collection: 'events',
          depth: 0,
          limit: 500,
          pagination: false,
          select: { slug: true, updatedAt: true, contestSeason: true, startDate: true },
          overrideAccess: false,
        }),
        payload.find({
          collection: 'news',
          where: { _status: { equals: 'published' } },
          depth: 0,
          limit: 1000,
          pagination: false,
          select: { slug: true, updatedAt: true },
          overrideAccess: false,
        }),
        payload.find({
          collection: 'pages',
          where: { _status: { equals: 'published' } },
          depth: 0,
          limit: 200,
          pagination: false,
          select: { slug: true, updatedAt: true, showInEn: true },
          overrideAccess: false,
        }),
      ])
      const seasonYears = new Set<number>()
      for (const e of events.docs) {
        entries.push({
          path: `/events/${e.slug}`,
          locales: RU_KK,
          lastModified: e.updatedAt,
          priority: 0.7,
          changeFrequency: 'weekly',
        })
        const y = year(e.startDate)
        if (typeof e.contestSeason === 'number' && y && !seasonYears.has(y)) {
          seasonYears.add(y)
          entries.push({
            path: `/contest/${y}`,
            locales: RU_KK,
            lastModified: e.updatedAt,
            priority: 0.6,
            changeFrequency: 'monthly',
          })
        }
      }
      for (const n of news.docs) {
        entries.push({
          path: `/news/${n.slug}`,
          locales: RU_KK,
          lastModified: n.updatedAt,
          priority: 0.6,
          changeFrequency: 'monthly',
        })
      }
      for (const p of pages.docs) {
        entries.push({
          path: `/${p.slug}`,
          locales: p.showInEn ? ALL : RU_KK,
          lastModified: p.updatedAt,
          priority: 0.3,
          changeFrequency: 'yearly',
        })
      }
      return entries
    },
    ['site-sitemap-v1'],
    {
      tags: [SITE_CACHE_TAGS.events, SITE_CACHE_TAGS.news, SITE_CACHE_TAGS.pages],
      revalidate: REVALIDATE,
    },
  ),
)

import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

// Тег кеша данных лендинга (src/app/(frontend)/_lib/data.ts).
export const LANDING_CACHE_TAG = 'landing'

// Теги кеша данных сайта (src/app/(frontend)/_lib/site-data.ts). Один тег на коллекцию/глобал:
// хук коллекции сбрасывает свой тег, хелперы сайта подписаны на теги тех коллекций, которые читают.
export const SITE_CACHE_TAGS = {
  settings: 'site-settings',
  home: 'site-home',
  about: 'site-about',
  partnersPage: 'site-partners-page',
  events: 'site-events',
  people: 'site-people',
  partners: 'site-partners',
  news: 'site-news',
  materials: 'site-materials',
  documents: 'site-documents',
  pages: 'site-pages',
} as const

export type SiteCacheTag = (typeof SITE_CACHE_TAGS)[keyof typeof SITE_CACHE_TAGS]

// Вне запроса Next (pnpm seed, payload run) кеша нет — вызовы бросают ошибку, её молча пропускаем.
function safeRevalidateTags(tags: string[]) {
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 })
  } catch {}
}

// Сбросить кеш страниц лендинга и данных под ними.
export function revalidateLanding() {
  safeRevalidateTags([LANDING_CACHE_TAG])
  try {
    revalidatePath('/', 'layout')
  } catch {}
}

// Сбросить кеш данных сайта по тегам (страницы сайта кешируют только данные, не HTML).
export function revalidateSite(...tags: SiteCacheTag[]) {
  safeRevalidateTags(tags)
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  revalidateLanding()
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateLanding()
  return doc
}

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc }) => {
  revalidateLanding()
  return doc
}

// Хуки для коллекций сайта: сбрасывают указанные теги сайта; withLanding — ещё и кеш лендинга
// (для общих сущностей: мероприятия, люди, партнёры, настройки).
export function siteRevalidateHooks(tags: SiteCacheTag[], opts: { withLanding?: boolean } = {}) {
  const run = () => {
    revalidateSite(...tags)
    if (opts.withLanding) revalidateLanding()
  }
  const afterChange: CollectionAfterChangeHook = ({ doc }) => {
    run()
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = ({ doc }) => {
    run()
    return doc
  }
  const globalAfterChange: GlobalAfterChangeHook = ({ doc }) => {
    run()
    return doc
  }
  return { afterChange, afterDelete, globalAfterChange }
}

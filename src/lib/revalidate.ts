import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

// Тег кеша данных лендинга (src/app/(frontend)/_lib/data.ts).
export const LANDING_CACHE_TAG = 'landing'

// Сбросить кеш страниц лендинга и данных под ними. Вне запроса Next (pnpm seed, payload run)
// кеша нет — вызовы бросают ошибку, её молча пропускаем.
export function revalidateLanding() {
  try {
    revalidateTag(LANDING_CACHE_TAG, { expire: 0 })
    revalidatePath('/', 'layout')
  } catch {}
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

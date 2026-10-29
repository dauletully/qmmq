import { notFound, redirect } from 'next/navigation'

import { getActiveSlug } from '../_lib/data'

// «/» на основном домене (локально — localhost:3000): ведём на активный лендинг по пути.
// На LANDING_HOST сюда не попадаем — прокси отдаёт лендинг.
export const dynamic = 'force-dynamic'

export default async function Root() {
  const slug = await getActiveSlug().catch(() => null)
  if (slug) redirect(`/${slug}`)
  notFound()
}

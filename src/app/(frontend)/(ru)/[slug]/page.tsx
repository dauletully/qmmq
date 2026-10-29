import type { Metadata } from 'next'

import { LandingPage } from '@/components/landing/LandingPage'

import { getLandingView } from '../../_lib/data'
import { landingMetadata } from '../../_lib/seo'

type Props = { params: Promise<{ slug: string }> }

// Рендер при первом запросе, дальше — из кеша; хуки админки сбрасывают кеш.
export const revalidate = 300
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return landingMetadata(await getLandingView(slug, 'ru'), 'ru', slug)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <LandingPage routeSlug={slug} locale="ru" />
}

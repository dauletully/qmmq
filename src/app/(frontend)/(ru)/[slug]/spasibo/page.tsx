import type { Metadata } from 'next'

import { ThanksPage, thanksType } from '@/components/landing/ThanksPage'
import { getDict } from '@/i18n/dictionary'

import { getLandingView } from '../../../_lib/data'
import { landingMetadata } from '../../../_lib/seo'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return landingMetadata(await getLandingView(slug, 'ru'), 'ru', slug, {
    rest: '/spasibo',
    title: getDict('ru').thanks.metaTitle,
    noindex: true,
  })
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const { type } = await searchParams
  return <ThanksPage routeSlug={slug} locale="ru" type={thanksType(type)} />
}

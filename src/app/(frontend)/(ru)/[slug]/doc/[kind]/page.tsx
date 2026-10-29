import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocPage, docKind } from '@/components/landing/DocPage'
import { getDict } from '@/i18n/dictionary'

import { getLandingView } from '../../../../_lib/data'
import { landingMetadata } from '../../../../_lib/seo'

type Props = { params: Promise<{ slug: string; kind: string }> }

export const revalidate = 300
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, kind } = await params
  const t = getDict('ru')
  return landingMetadata(await getLandingView(slug, 'ru'), 'ru', slug, {
    rest: `/doc/${kind}`,
    title: kind === 'offer' ? t.footer.offer : t.footer.privacy,
  })
}

export default async function Page({ params }: Props) {
  const { slug, kind } = await params
  const k = docKind(kind)
  if (!k) notFound()
  return <DocPage routeSlug={slug} locale="ru" kind={k} />
}

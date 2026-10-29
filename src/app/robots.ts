import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { landingOrigin, siteOrigin } from './(frontend)/_lib/site'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host')?.split(':')[0]
  const landingHost = process.env.LANDING_HOST?.split(':')[0]
  const origin = landingHost && host === landingHost ? landingOrigin() : siteOrigin()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/spasibo', '/kz/spasibo', '/*/spasibo'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  }
}

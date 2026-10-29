import type { ReactNode } from 'react'

import { Shell, shellMetadata, shellViewport } from '../_lib/Shell'
import { fontVariables } from '../fonts-kk'

export const metadata = shellMetadata
export const viewport = shellViewport

export default function KkLayout({ children }: { children: ReactNode }) {
  return (
    <Shell lang="kk" fonts={fontVariables}>
      {children}
    </Shell>
  )
}

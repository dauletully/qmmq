import type { ReactNode } from 'react'

import { Shell, shellMetadata, shellViewport } from '../_lib/Shell'
import { fontVariables } from '../fonts'

export const metadata = shellMetadata
export const viewport = shellViewport

export default function RuLayout({ children }: { children: ReactNode }) {
  return (
    <Shell lang="ru" fonts={fontVariables}>
      {children}
    </Shell>
  )
}

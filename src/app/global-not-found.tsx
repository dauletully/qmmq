import type { Metadata } from 'next'

import { fontVariables } from './(frontend)/fonts'
import { Shell, shellViewport } from './(frontend)/_lib/Shell'
import { NotFoundView } from '@/components/landing/NotFoundView'

// 404 для адресов вне всех маршрутов (у сайта две корневые разметки — RU и KZ — и админка).
export const metadata: Metadata = {
  title: 'Страница не найдена — QMMQ',
  robots: { index: false },
}
export const viewport = shellViewport

export default function GlobalNotFound() {
  return (
    <Shell lang="ru" fonts={fontVariables}>
      <NotFoundView locale="ru" />
    </Shell>
  )
}

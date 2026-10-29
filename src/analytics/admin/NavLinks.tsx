import type { ServerProps } from 'payload'
import React from 'react'

import { hasRole } from '../../access'
import { NavLinksClient } from './NavLinksClient'

// Пункт «Аналитика → Отчёты» в меню админки — только для admin и manager.
export function NavLinks({ user }: ServerProps) {
  if (!hasRole(user as never, 'admin', 'manager')) return null
  return <NavLinksClient />
}

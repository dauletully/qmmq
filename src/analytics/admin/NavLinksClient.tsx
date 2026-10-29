'use client'

import { Link, NavGroup, useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

// Разметка повторяет стандартные пункты меню Payload (классы nav__link), чтобы выглядеть родным.
export function NavLinksClient() {
  const pathname = usePathname()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const href = formatAdminURL({ adminRoute, path: '/analytics' })
  const active = pathname === href

  const label = (
    <>
      {active ? <div className="nav__link-indicator" /> : null}
      <span className="nav__link-label">Отчёты</span>
    </>
  )

  return (
    <NavGroup label="Аналитика">
      {active ? (
        <div className="nav__link" id="nav-analytics">
          {label}
        </div>
      ) : (
        <Link className="nav__link" href={href} id="nav-analytics" prefetch={false}>
          {label}
        </Link>
      )}
    </NavGroup>
  )
}

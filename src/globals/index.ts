import type { GlobalConfig } from 'payload'

import { AboutPage } from './AboutPage'
import { HomePage } from './HomePage'
import { Integrations } from './Integrations'
import { PartnersPage } from './PartnersPage'
import { SiteSettings } from './SiteSettings'

export const globals: GlobalConfig[] = [SiteSettings, HomePage, AboutPage, PartnersPage, Integrations]

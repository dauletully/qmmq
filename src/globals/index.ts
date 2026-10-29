import type { GlobalConfig } from 'payload'

import { Integrations } from './Integrations'
import { SiteSettings } from './SiteSettings'

export const globals: GlobalConfig[] = [SiteSettings, Integrations]

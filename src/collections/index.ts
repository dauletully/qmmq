import type { CollectionConfig } from 'payload'

import { Events } from './Events'
import { Landings } from './Landings'
import { Leads } from './Leads'
import { Media } from './Media'
import { Partners } from './Partners'
import { People } from './People'
import { Users } from './Users'

// Порядок здесь = порядок в меню админки (внутри групп).
export const collections: CollectionConfig[] = [
  Leads,
  Landings,
  Events,
  People,
  Partners,
  Media,
  Users,
]

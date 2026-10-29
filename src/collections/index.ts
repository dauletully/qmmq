import type { CollectionConfig } from 'payload'

import { Documents } from './Documents'
import { Events } from './Events'
import { Landings } from './Landings'
import { Leads } from './Leads'
import { Materials } from './Materials'
import { Media } from './Media'
import { News } from './News'
import { Pages } from './Pages'
import { Partners } from './Partners'
import { People } from './People'
import { Subscribers } from './Subscribers'
import { Users } from './Users'

// Порядок здесь = порядок в меню админки (внутри групп).
export const collections: CollectionConfig[] = [
  // Заявки
  Leads,
  Subscribers,
  // Контент (общий для лендинга и сайта)
  Landings,
  Events,
  People,
  Partners,
  Media,
  // Сайт
  News,
  Materials,
  Documents,
  Pages,
  // Настройки
  Users,
]

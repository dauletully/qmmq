import type { CollectionConfig } from 'payload'

import { Media } from './Media'
import { Users } from './Users'

// Порядок здесь = порядок в меню админки.
export const collections: CollectionConfig[] = [Users, Media]

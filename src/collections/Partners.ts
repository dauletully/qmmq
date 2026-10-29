import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { adminOptions, PARTNER_KINDS } from '../lib/constants'
import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import { validateUrl } from '../lib/validators'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Партнёр', plural: 'Партнёры' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'name',
    group: 'Контент',
    defaultColumns: ['name', 'kind', 'url', 'order'],
    description: 'Министерство, организаторы, вузы, спонсоры и СМИ — для строки логотипов.',
  },
  access: {
    read: anyone,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true, localized: true },
    {
      name: 'logo',
      label: 'Логотип',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Лучше SVG или PNG на прозрачном фоне.' },
    },
    {
      name: 'url',
      label: 'Сайт',
      type: 'text',
      validate: validateUrl,
      admin: { placeholder: 'https://' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          label: 'Тип',
          type: 'select',
          required: true,
          defaultValue: 'organizer',
          options: adminOptions(PARTNER_KINDS),
        },
        {
          name: 'order',
          label: 'Порядок',
          type: 'number',
          defaultValue: 100,
          admin: { description: 'Меньше — левее в строке логотипов.' },
        },
      ],
    },
  ],
}

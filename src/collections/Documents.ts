import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { adminOptions, DOCUMENT_KINDS } from '../lib/constants'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'

const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.documents])

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Документ', plural: 'Документы ассоциации' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'title',
    group: 'Сайт',
    defaultColumns: ['title', 'kind', 'order', 'updatedAt'],
    description:
      'Устав, свидетельство о регистрации, благодарственные письма, реквизиты — страница /about/documents. Договор-оферта и политика конфиденциальности — в «Настройках сайта».',
  },
  access: {
    read: anyone,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  hooks: {
    afterChange: [hooks.afterChange],
    afterDelete: [hooks.afterDelete],
  },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          label: 'Вид',
          type: 'select',
          required: true,
          defaultValue: 'other',
          options: adminOptions(DOCUMENT_KINDS),
        },
        {
          name: 'order',
          label: 'Порядок',
          type: 'number',
          defaultValue: 100,
          admin: { description: 'Меньше — выше в списке.' },
        },
      ],
    },
    {
      name: 'file',
      label: 'Файл',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'PDF или скан (JPG/PNG).' },
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      localized: true,
      admin: { description: 'Например, «от 31.07.2012, БИН 120740017281».' },
    },
  ],
}

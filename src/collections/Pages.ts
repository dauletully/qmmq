import type { CollectionConfig } from 'payload'

import { contentEditors, publishedOrStaff } from '../access'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'
import { validateSlug } from '../lib/validators'

const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.pages])

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Страница', plural: 'Текстовые страницы' },
  defaultSort: 'title',
  versions: { drafts: true, maxPerDoc: 25 },
  admin: {
    useAsTitle: 'title',
    group: 'Сайт',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Простые текстовые страницы: политика конфиденциальности, оферта, правила, FAQ. Открываются по адресу /<slug>. Структурные страницы («Об ассоциации», «Партнёрам») редактируются в «Настройках» → «Страница …».',
  },
  access: {
    read: publishedOrStaff,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  hooks: {
    afterChange: [hooks.afterChange],
    afterDelete: [hooks.afterDelete],
  },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      label: 'Адрес (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: validateSlug,
      admin: {
        position: 'sidebar',
        description: 'Латиница и дефис: /privacy, /offer. Не должен совпадать с разделами сайта.',
      },
    },
    {
      name: 'showInEn',
      label: 'Есть английская версия',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Отметьте, если заполнили вкладку English — тогда страница откроется и на /en.',
      },
    },
    { name: 'body', label: 'Текст', type: 'richText', localized: true },
    {
      name: 'seo',
      label: 'SEO',
      type: 'group',
      admin: { description: 'Пусто — берётся заголовок.' },
      fields: [
        { name: 'title', label: 'Заголовок страницы (title)', type: 'text', localized: true },
        {
          name: 'description',
          label: 'Описание (description)',
          type: 'textarea',
          localized: true,
        },
      ],
    },
  ],
}

import type { CollectionConfig } from 'payload'

import { contentEditors, publishedOrStaff } from '../access'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'
import { validateSlug, validateUrl } from '../lib/validators'

const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.news])

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Новость', plural: 'Новости' },
  defaultSort: '-publishedAt',
  versions: { drafts: true, maxPerDoc: 25 },
  admin: {
    useAsTitle: 'title',
    group: 'Сайт',
    defaultColumns: ['title', '_status', 'publishedAt', 'tags', 'relatedEvent'],
    listSearchableFields: ['title', 'excerpt'],
    description:
      'Новости и материалы для раздела /news. Черновик виден только в админке; «Опубликовать» — и новость появляется на сайте и в RSS. Казахский текст — на вкладке языка «Қазақша».',
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
    beforeChange: [
      ({ data }) => {
        // Дата публикации проставляется при первой публикации, если редактор её не задал.
        if (data._status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
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
        description: 'Латиница и дефис: /news/<slug>. После публикации лучше не менять.',
      },
    },
    {
      name: 'publishedAt',
      label: 'Дата публикации',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' },
        description: 'Пусто — поставится автоматически при публикации.',
      },
    },
    {
      name: 'tags',
      label: 'Теги',
      type: 'text',
      hasMany: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Короткие слова для фильтра: «конкурс», «олимпиада», «итоги», «партнёры».',
      },
    },
    {
      name: 'relatedEvent',
      label: 'Связанное мероприятие',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        position: 'sidebar',
        description: 'Новость появится в карточке мероприятия, а в новости будет ссылка на него.',
      },
    },
    {
      name: 'cover',
      label: 'Обложка',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Горизонтальное фото, лучше 1600×900. Показывается в списке и в шапке.' },
    },
    {
      name: 'excerpt',
      label: 'Короткое описание',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Одно-два предложения для списка новостей, RSS и превью в мессенджерах.',
      },
    },
    { name: 'body', label: 'Текст', type: 'richText', localized: true },
    {
      name: 'gallery',
      label: 'Галерея',
      type: 'array',
      labels: { singular: 'Фото', plural: 'Фото' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'image', label: 'Фото', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', label: 'Подпись', type: 'text', localized: true },
      ],
    },
    {
      type: 'collapsible',
      label: 'Источник',
      admin: {
        initCollapsed: true,
        description: 'Если новость — пересказ публикации СМИ, укажите источник: он выводится под текстом.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'sourceName', label: 'Название источника', type: 'text' },
            { name: 'sourceUrl', label: 'Ссылка на источник', type: 'text', validate: validateUrl },
          ],
        },
      ],
    },
    {
      name: 'seo',
      label: 'SEO',
      type: 'group',
      admin: { description: 'Пусто — берутся заголовок, короткое описание и обложка.' },
      fields: [
        { name: 'title', label: 'Заголовок страницы (title)', type: 'text', localized: true },
        {
          name: 'description',
          label: 'Описание (description)',
          type: 'textarea',
          localized: true,
        },
        { name: 'ogImage', label: 'Обложка для соцсетей', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}

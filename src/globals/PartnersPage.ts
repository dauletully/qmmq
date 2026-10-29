import type { GlobalConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { BENEFIT_ICONS, adminOptions } from '../lib/constants'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'

const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.partnersPage])

// Страница «Партнёрам» (/partners). Вторая страница с английской версией.
export const PartnersPage: GlobalConfig = {
  slug: 'partners-page',
  label: 'Страница «Партнёрам»',
  admin: {
    group: 'Сайт',
    description:
      'Форматы сотрудничества, пакет спонсора и текст над формой. Логотипы прошлых партнёров — коллекция «Партнёры» (отметка «Показывать на странице «Партнёрам»»). У этой страницы есть английская версия — вкладка языка English.',
  },
  access: { read: anyone, update: contentEditors },
  versions: { max: 25 },
  hooks: { afterChange: [hooks.globalAfterChange] },
  fields: [
    { name: 'heading', label: 'Заголовок', type: 'text', localized: true },
    {
      name: 'lead',
      label: 'Вводный абзац',
      type: 'textarea',
      localized: true,
      admin: { description: 'Зачем компании поддерживать конкурсы учителей — два-три предложения.' },
    },
    {
      name: 'formats',
      label: 'Форматы сотрудничества',
      type: 'array',
      labels: { singular: 'Формат', plural: 'Форматы' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'icon',
              label: 'Иконка',
              type: 'select',
              options: adminOptions(BENEFIT_ICONS),
              admin: { width: '30%' },
            },
            {
              name: 'title',
              label: 'Название',
              type: 'text',
              localized: true,
              required: true,
              admin: { width: '70%' },
            },
          ],
        },
        { name: 'text', label: 'Что получает партнёр', type: 'textarea', localized: true },
      ],
    },
    {
      name: 'sponsorPack',
      label: 'Пакет спонсора (PDF)',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { equals: 'application/pdf' } },
      admin: { description: 'Кнопка «Скачать пакет спонсора». Пусто — кнопки нет.' },
    },
    {
      name: 'pastPartnersHeading',
      label: 'Заголовок блока прошлых партнёров',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Нас поддерживали' },
    },
    {
      name: 'contactHeading',
      label: 'Заголовок над формой',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Обсудить партнёрство' },
    },
    {
      name: 'contactNote',
      label: 'Текст над формой',
      type: 'textarea',
      localized: true,
      admin: { description: 'Кому попадёт заявка и когда ответим.' },
    },
    {
      name: 'seo',
      label: 'SEO',
      type: 'group',
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

import type { GlobalConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'

const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.home])

// Главная страница сайта qmmq.kz. Списки (ближайшие мероприятия, новости, партнёры) собираются
// автоматически — здесь только тексты и что показать первым.
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Главная страница',
  admin: {
    group: 'Сайт',
    description:
      'Тексты первого экрана и блоков главной. Мероприятия и новости подставляются автоматически: ближайшие открытые и последние опубликованные.',
  },
  access: { read: anyone, update: contentEditors },
  versions: { max: 25 },
  hooks: { afterChange: [hooks.globalAfterChange] },
  fields: [
    {
      name: 'hero',
      label: 'Первый экран',
      type: 'group',
      fields: [
        { name: 'heading', label: 'Заголовок', type: 'text', localized: true },
        { name: 'lead', label: 'Подзаголовок', type: 'textarea', localized: true },
        {
          name: 'featuredEvent',
          label: 'Главное мероприятие',
          type: 'relationship',
          relationTo: 'events',
          admin: {
            description:
              'Карточка на первом экране. Пусто — ближайшее мероприятие с открытой регистрацией.',
          },
        },
        {
          name: 'primaryCta',
          label: 'Главная кнопка',
          type: 'text',
          localized: true,
          admin: { placeholder: 'Зарегистрироваться на конкурс' },
        },
        {
          name: 'secondaryCta',
          label: 'Вторая кнопка',
          type: 'text',
          localized: true,
          admin: { placeholder: 'Вступить в сообщество' },
        },
      ],
    },
    {
      name: 'about',
      label: 'Блок «Об ассоциации»',
      type: 'group',
      fields: [
        { name: 'heading', label: 'Заголовок', type: 'text', localized: true },
        { name: 'text', label: 'Текст', type: 'textarea', localized: true },
      ],
    },
    {
      name: 'community',
      label: 'Блок «Сообщество»',
      type: 'group',
      fields: [
        { name: 'heading', label: 'Заголовок', type: 'text', localized: true },
        { name: 'text', label: 'Текст', type: 'textarea', localized: true },
      ],
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
        { name: 'ogImage', label: 'Обложка для соцсетей', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}

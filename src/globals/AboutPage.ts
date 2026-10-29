import type { GlobalConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'

const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.about])

// Страница «Об ассоциации» (/about, /about/history, /about/team, /about/documents).
// Одна из двух страниц с английской версией — заполняйте вкладку English.
export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'Страница «Об ассоциации»',
  admin: {
    group: 'Сайт',
    description:
      'Тексты раздела «Об ассоциации». Команда берётся из «Люди» с ролью «Команда» (поле «Должность в команде»), документы — из «Документы ассоциации». У этой страницы есть английская версия — вкладка языка English.',
  },
  access: { read: anyone, update: contentEditors },
  versions: { max: 25 },
  hooks: { afterChange: [hooks.globalAfterChange] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Главное',
          fields: [
            { name: 'heading', label: 'Заголовок', type: 'text', localized: true },
            {
              name: 'lead',
              label: 'Вводный абзац',
              type: 'textarea',
              localized: true,
              admin: { description: 'Два-три предложения: кто мы и что делаем.' },
            },
            { name: 'cover', label: 'Фото', type: 'upload', relationTo: 'media' },
            {
              name: 'mission',
              label: 'Миссия и задачи',
              type: 'richText',
              localized: true,
            },
            {
              name: 'figures',
              label: 'Цифры',
              type: 'array',
              labels: { singular: 'Цифра', plural: 'Цифры' },
              admin: {
                description:
                  'Например: «с 2012 года», «X конкурсов». Только подтверждённые данные; оценки подписывайте «по данным ассоциации».',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', label: 'Значение', type: 'text', required: true },
                    { name: 'label', label: 'Подпись', type: 'text', localized: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'История',
          fields: [
            { name: 'historyHeading', label: 'Заголовок', type: 'text', localized: true },
            { name: 'historyLead', label: 'Вводный абзац', type: 'textarea', localized: true },
            {
              name: 'timeline',
              label: 'Вехи',
              type: 'array',
              labels: { singular: 'Веха', plural: 'Вехи' },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'year',
                      label: 'Год',
                      type: 'number',
                      required: true,
                      min: 2000,
                      max: 2100,
                      admin: { width: '20%' },
                    },
                    {
                      name: 'period',
                      label: 'Период (подпись)',
                      type: 'text',
                      localized: true,
                      admin: { placeholder: 'Сентябрь 2013', width: '30%' },
                    },
                    {
                      name: 'title',
                      label: 'Заголовок',
                      type: 'text',
                      localized: true,
                      required: true,
                      admin: { width: '50%' },
                    },
                  ],
                },
                { name: 'text', label: 'Текст', type: 'textarea', localized: true },
                {
                  name: 'event',
                  label: 'Мероприятие',
                  type: 'relationship',
                  relationTo: 'events',
                  admin: { description: 'Если веха — конкурс из каталога, веха станет ссылкой.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Команда',
          fields: [
            { name: 'teamHeading', label: 'Заголовок', type: 'text', localized: true },
            {
              name: 'teamLead',
              label: 'Вводный абзац',
              type: 'textarea',
              localized: true,
              admin: {
                description:
                  'Сами карточки — из «Люди»: роль «Команда», поля «Должность в команде» и «Порядок», отметка согласия.',
              },
            },
          ],
        },
        {
          label: 'Документы',
          fields: [
            { name: 'documentsHeading', label: 'Заголовок', type: 'text', localized: true },
            {
              name: 'documentsLead',
              label: 'Вводный абзац',
              type: 'textarea',
              localized: true,
              admin: { description: 'Список документов — коллекция «Документы ассоциации».' },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'seoTitle', label: 'Заголовок страницы (title)', type: 'text', localized: true },
            {
              name: 'seoDescription',
              label: 'Описание (description)',
              type: 'textarea',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
}

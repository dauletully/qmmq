import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { adminOptions, PARTNER_KINDS } from '../lib/constants'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'
import { validateUrl } from '../lib/validators'

// Партнёры общие для лендинга и страницы «Партнёрам» сайта.
const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.partners], { withLanding: true })

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Партнёр', plural: 'Партнёры' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'name',
    group: 'Контент',
    defaultColumns: ['name', 'kind', 'url', 'order'],
    description:
      'Организаторы, партнёры, вузы, спонсоры и СМИ. Чтобы партнёр появился на странице, сохраните его здесь, затем откройте «Лендинги» → нужный лендинг → вкладка «Партнёры», выберите его в поле и сохраните лендинг. Нового партнёра можно создать и прямо там — кнопкой «+».',
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
    {
      name: 'name',
      label: 'Название',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'Полное официальное название, без сокращений — показывается в карточке под типом. Казахское название заполните на вкладке языка «Қазақша».',
      },
    },
    {
      name: 'logo',
      label: 'Логотип',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'SVG или PNG на прозрачном фоне, без полей вокруг знака. На сайте логотип показывается в оттенках серого на светлой плашке. Без логотипа в карточке будет нейтральный значок и название. Государственный герб не загружайте.',
      },
    },
    {
      name: 'url',
      label: 'Сайт',
      type: 'text',
      validate: validateUrl,
      admin: {
        placeholder: 'https://',
        description:
          'Если указан, карточка станет ссылкой на сайт партнёра (открывается в новой вкладке).',
      },
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
          admin: {
            description:
              'Подпись над названием: «Организатор», «Партнёр», «Вуз», «Спонсор», «СМИ». Министерство подписывается как «Организатор».',
          },
        },
        {
          name: 'order',
          label: 'Порядок',
          type: 'number',
          defaultValue: 100,
          admin: {
            description:
              'Порядок в списке партнёров в админке. На лендинге порядок задаётся на вкладке «Партнёры» лендинга.',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Страница «Партнёрам» на сайте',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'showOnPartnersPage',
          label: 'Показывать в блоке «Нас поддерживали»',
          type: 'checkbox',
          defaultValue: false,
          index: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'years',
              label: 'Годы сотрудничества',
              type: 'text',
              admin: { placeholder: '2013, 2022–2023', width: '40%' },
            },
            {
              name: 'description',
              label: 'Чем помогали',
              type: 'text',
              localized: true,
              admin: { placeholder: 'Генеральный спонсор I конкурса', width: '60%' },
            },
          ],
        },
      ],
    },
  ],
}

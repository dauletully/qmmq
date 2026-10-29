import type { CollectionConfig } from 'payload'

import { adminOnly, roleOf } from '../access'
import { adminOptions, REGIONS, SUBJECTS } from '../lib/constants'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Подписчик', plural: 'Подписчики рассылки' },
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'email',
    group: 'Заявки',
    defaultColumns: ['email', 'subject', 'region', 'locale', 'active', 'createdAt'],
    listSearchableFields: ['email'],
    pagination: { defaultLimit: 50 },
    description:
      'E-mail из формы подписки в подвале сайта. Рассылка отправляется не с сайта: выгрузите список кнопкой «Скачать CSV» и загрузите в сервис рассылок. В amoCRM подписчики не уходят.',
    components: {
      beforeListTable: ['/admin/subscribers/ExportButton#ExportButton'],
    },
  },
  access: {
    read: ({ req }) => Boolean(roleOf(req.user)),
    create: () => false,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          label: 'E-mail',
          type: 'email',
          required: true,
          unique: true,
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'locale',
          label: 'Язык',
          type: 'select',
          defaultValue: 'ru',
          options: [
            { value: 'ru', label: 'Русский' },
            { value: 'kk', label: 'Қазақша' },
            { value: 'en', label: 'English' },
          ],
          admin: { readOnly: true },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subject',
          label: 'Предмет',
          type: 'select',
          options: adminOptions(SUBJECTS),
          admin: { readOnly: true },
        },
        {
          name: 'region',
          label: 'Регион',
          type: 'select',
          options: adminOptions(REGIONS),
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'active',
      label: 'Подписка активна',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Снимите, если человек попросил отписать. В выгрузку попадают только активные.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'consentAt',
          label: 'Когда дано согласие',
          type: 'date',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' },
          },
        },
        {
          name: 'source',
          label: 'Откуда подписка',
          type: 'text',
          admin: { readOnly: true, description: 'Страница, на которой заполнили форму.' },
        },
      ],
    },
  ],
}

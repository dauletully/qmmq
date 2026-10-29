import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { adminOptions, EVENT_FORMATS, EVENT_LEVELS, EVENT_TYPES, SUBJECTS } from '../lib/constants'
import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
import { validateSlug, validateUrl } from '../lib/validators'

const CHECK_NOTE =
  'Должна совпадать с положением о конкурсе (в начальных данных — предварительная дата, уточнить).'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Мероприятие', plural: 'Мероприятия' },
  defaultSort: '-startDate',
  versions: { maxPerDoc: 25 },
  admin: {
    useAsTitle: 'title',
    group: 'Контент',
    defaultColumns: ['title', 'type', 'startDate', 'registrationDeadline', 'price'],
    description:
      'Конкурсы, олимпиады, семинары. Здесь — даты, цена, место и программа: лендинг и сайт берут их отсюда.',
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
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основное',
          fields: [
            { name: 'title', label: 'Название', type: 'text', required: true, localized: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'slug',
                  label: 'Адрес (slug)',
                  type: 'text',
                  required: true,
                  unique: true,
                  index: true,
                  validate: validateSlug,
                  admin: { description: 'Латиница и дефис, например contest-2026.' },
                },
                {
                  name: 'type',
                  label: 'Тип',
                  type: 'select',
                  required: true,
                  defaultValue: 'contest',
                  options: adminOptions(EVENT_TYPES),
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'level',
                  label: 'Уровень',
                  type: 'select',
                  options: adminOptions(EVENT_LEVELS),
                },
                {
                  name: 'format',
                  label: 'Формат',
                  type: 'select',
                  defaultValue: 'offline',
                  options: adminOptions(EVENT_FORMATS),
                },
              ],
            },
            {
              name: 'subjects',
              label: 'Предметы',
              type: 'select',
              hasMany: true,
              options: adminOptions(SUBJECTS),
            },
          ],
        },
        {
          label: 'Даты и цена',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'startDate',
                  label: 'Начало',
                  type: 'date',
                  required: true,
                  admin: {
                    date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' },
                    description: CHECK_NOTE,
                  },
                },
                {
                  name: 'endDate',
                  label: 'Окончание',
                  type: 'date',
                  admin: {
                    date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' },
                    description: CHECK_NOTE,
                  },
                },
              ],
            },
            {
              name: 'registrationDeadline',
              label: 'Регистрация до',
              type: 'date',
              admin: {
                date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy, HH:mm' },
                description:
                  'После этого момента кнопка на лендинге меняется на «Лист ожидания», а новые регистрации сохраняются как лист ожидания. ' +
                  CHECK_NOTE,
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  label: 'Цена участия, ₸',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { description: 'За одного участника. Уходит в сумму сделки в amoCRM.' },
                },
                {
                  name: 'groupMinSize',
                  label: 'Группа от, человек',
                  type: 'number',
                  min: 1,
                  defaultValue: 5,
                  admin: { description: 'С какого числа участников действуют групповые условия.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Место',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'city', label: 'Город', type: 'text', localized: true },
                { name: 'venue', label: 'Площадка', type: 'text', localized: true },
              ],
            },
            { name: 'venueAddress', label: 'Адрес площадки', type: 'text', localized: true },
            {
              name: 'mapUrl',
              label: 'Ссылка на карту',
              type: 'text',
              validate: validateUrl,
              admin: { description: 'Ссылка на 2ГИС, Яндекс или Google Карты.' },
            },
          ],
        },
        {
          label: 'Программа',
          description: 'Расписание по дням. Лендинг показывает его аккордеоном.',
          fields: [
            {
              name: 'program',
              label: 'Дни',
              type: 'array',
              labels: { singular: 'День', plural: 'Дни' },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'date',
                      label: 'Дата',
                      type: 'date',
                      admin: {
                        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
                      },
                    },
                    {
                      name: 'title',
                      label: 'Название дня',
                      type: 'text',
                      localized: true,
                      admin: { placeholder: 'День 1 · Олимпиадные туры' },
                    },
                  ],
                },
                {
                  name: 'items',
                  label: 'Пункты программы',
                  type: 'array',
                  labels: { singular: 'Пункт', plural: 'Пункты' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'time',
                          label: 'Время',
                          type: 'text',
                          admin: { placeholder: '10:00–12:00', width: '30%' },
                        },
                        {
                          name: 'title',
                          label: 'Что происходит',
                          type: 'text',
                          localized: true,
                          admin: { width: '70%' },
                        },
                      ],
                    },
                    {
                      name: 'description',
                      label: 'Подробности',
                      type: 'textarea',
                      localized: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Документы',
          fields: [
            {
              name: 'regulationsPdf',
              label: 'Положение о конкурсе (PDF)',
              type: 'upload',
              relationTo: 'media',
              filterOptions: { mimeType: { equals: 'application/pdf' } },
              admin: { description: 'Открывается после формы «Скачать положение».' },
            },
            {
              name: 'certificateSample',
              label: 'Образец сертификата',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'participantsChatUrl',
              label: 'Ссылка на чат участников',
              type: 'text',
              validate: validateUrl,
              admin: {
                description:
                  'Показывается на странице «Спасибо», например https://chat.whatsapp.com/…',
              },
            },
          ],
        },
      ],
    },
  ],
}

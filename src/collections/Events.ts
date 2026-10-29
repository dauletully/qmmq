import type { CollectionConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import {
  adminOptions,
  EVENT_FORMATS,
  EVENT_LEVELS,
  EVENT_STATUSES,
  EVENT_TYPES,
  SUBJECTS,
  REGIONS,
  WINNER_PLACES,
} from '../lib/constants'
import { computeEventStatus } from '../lib/eventStatus'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'
import { validateSlug, validateUrl } from '../lib/validators'

const CHECK_NOTE =
  'Должна совпадать с положением о конкурсе (в начальных данных — предварительная дата, уточнить).'

// Мероприятие общее для лендинга и сайта: сбрасываем кеш обоих.
const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.events], { withLanding: true })

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Мероприятие', plural: 'Мероприятия' },
  defaultSort: '-startDate',
  versions: { maxPerDoc: 25 },
  admin: {
    useAsTitle: 'title',
    group: 'Контент',
    defaultColumns: ['title', 'type', 'startDate', 'status', 'contestSeason', 'price'],
    listSearchableFields: ['title', 'slug'],
    description:
      'Конкурсы, олимпиады, семинары — прошедшие и будущие. Здесь даты, цена, место, программа и итоги: лендинг и каталог /events берут их отсюда. Прошедшие мероприятия попадают в архив автоматически по дате.',
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
      name: 'status',
      label: 'Статус на сайте',
      type: 'select',
      virtual: true,
      options: adminOptions(EVENT_STATUSES),
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Вычисляется по датам. Чтобы задать вручную — поле ниже.',
      },
      hooks: {
        afterRead: [({ siblingData }) => computeEventStatus(siblingData ?? {})],
      },
    },
    {
      name: 'statusOverride',
      label: 'Статус вручную',
      type: 'select',
      defaultValue: 'auto',
      options: [{ value: 'auto', label: 'Автоматически (по датам)' }, ...adminOptions(EVENT_STATUSES)],
      admin: {
        position: 'sidebar',
        description:
          'Например, закрыть регистрацию раньше срока или держать «Регистрация открыта» до особого объявления.',
      },
    },
    {
      name: 'contestSeason',
      label: 'Номер сезона конкурса',
      type: 'number',
      min: 1,
      max: 99,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Только для творческих конкурсов учителей: 1 — 2013, 10 — 2023, 12 — 2026. По нему строится история сезонов /contest/[год].',
      },
    },
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
            {
              name: 'cover',
              label: 'Обложка',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Для карточки в каталоге /events и превью ссылки. Лучше 1600×900.' },
            },
            {
              name: 'description',
              label: 'Описание',
              type: 'richText',
              localized: true,
              admin: { description: 'О мероприятии для страницы /events/<slug>: формат, этапы, что получат участники.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'forWhom',
                  label: 'Для кого',
                  type: 'textarea',
                  localized: true,
                  admin: { description: 'Например: «учителя математики, физики и информатики школ Казахстана».' },
                },
                {
                  name: 'documentIssued',
                  label: 'Какой документ выдаётся',
                  type: 'text',
                  localized: true,
                  admin: { placeholder: 'Сертификат участника, дипломы I–III степени' },
                },
              ],
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
                {
                  name: 'region',
                  label: 'Регион',
                  type: 'select',
                  index: true,
                  options: adminOptions(REGIONS),
                  admin: { description: 'Для фильтра каталога /events. Онлайн — оставьте пустым.' },
                },
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
        {
          label: 'Итоги',
          description:
            'Заполняется после мероприятия: победители, фото, файл задач, пресс-релиз. На сайте блок появляется, когда статус — «Завершено».',
          fields: [
            {
              name: 'results',
              label: 'Итоги',
              type: 'group',
              fields: [
                {
                  name: 'summary',
                  label: 'Кратко об итогах',
                  type: 'textarea',
                  localized: true,
                  admin: { description: 'Одна-две строки: сколько участников, сколько призёров.' },
                },
                {
                  name: 'winners',
                  label: 'Победители',
                  type: 'array',
                  labels: { singular: 'Победитель', plural: 'Победители' },
                  admin: { initCollapsed: true },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'place',
                          label: 'Место',
                          type: 'select',
                          required: true,
                          options: adminOptions(WINNER_PLACES),
                          admin: { width: '30%' },
                        },
                        {
                          name: 'person',
                          label: 'Человек из «Люди»',
                          type: 'relationship',
                          relationTo: 'people',
                          admin: {
                            width: '70%',
                            description: 'Если у человека есть карточка — выберите её, имя подставится.',
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'name',
                          label: 'Имя (если карточки нет)',
                          type: 'text',
                          admin: { width: '50%' },
                        },
                        {
                          name: 'detail',
                          label: 'Школа, предмет',
                          type: 'text',
                          localized: true,
                          admin: { width: '50%', placeholder: 'Математика, школа-гимназия № 208' },
                        },
                      ],
                    },
                    {
                      name: 'prize',
                      label: 'Приз',
                      type: 'text',
                      localized: true,
                      admin: { placeholder: 'Автомобиль Changan' },
                    },
                  ],
                },
                {
                  name: 'photos',
                  label: 'Фото',
                  type: 'array',
                  labels: { singular: 'Фото', plural: 'Фото' },
                  admin: { initCollapsed: true },
                  fields: [
                    { name: 'image', label: 'Фото', type: 'upload', relationTo: 'media', required: true },
                    { name: 'caption', label: 'Подпись', type: 'text', localized: true },
                  ],
                },
                {
                  name: 'tasksFile',
                  label: 'Задачи и решения (PDF)',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { description: 'Можно также добавить в «Материалы» с нужным уровнем доступа.' },
                },
                { name: 'pressRelease', label: 'Пресс-релиз', type: 'richText', localized: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

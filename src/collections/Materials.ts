import type { CollectionConfig, FieldAccess } from 'payload'

import { anyone, contentEditors, roleOf } from '../access'
import { adminOptions, MATERIAL_ACCESS, MATERIAL_KINDS, SUBJECTS } from '../lib/constants'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'
import { validateUrl } from '../lib/validators'

const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.materials])

// Файл и ссылка на видео отдаются посетителям только у открытых материалов.
// Карточка (название, вид, год) видна всем — с пометкой «доступно после запуска личного кабинета».
// Когда появится кабинет, сюда добавится проверка пользователя и участия в мероприятии.
const publicFileOnly: FieldAccess = ({ req, doc }) => {
  if (roleOf(req.user)) return true
  return doc?.access === 'public'
}

export const Materials: CollectionConfig = {
  slug: 'materials',
  labels: { singular: 'Материал', plural: 'Материалы' },
  defaultSort: '-year',
  admin: {
    useAsTitle: 'title',
    group: 'Сайт',
    defaultColumns: ['title', 'kind', 'subject', 'year', 'access', 'event'],
    listSearchableFields: ['title'],
    description:
      'Библиотека /materials: положения, задачи и решения, презентации, видео. Уровень доступа — кто может скачать файл. Пока личного кабинета нет, скачать можно только «Открыто всем»; остальные показываются с пометкой.',
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
          options: adminOptions(MATERIAL_KINDS),
        },
        {
          name: 'access',
          label: 'Доступ',
          type: 'select',
          required: true,
          defaultValue: 'public',
          index: true,
          options: adminOptions(MATERIAL_ACCESS),
          admin: {
            description:
              '«Для зарегистрированных» и «Для участников» заработают с личным кабинетом (вторая очередь).',
          },
        },
      ],
    },
    {
      name: 'file',
      label: 'Файл',
      type: 'upload',
      relationTo: 'media',
      access: { read: publicFileOnly },
      admin: {
        description: 'PDF или изображение. Для видео оставьте пустым и укажите ссылку ниже.',
        condition: (data) => data?.kind !== 'video',
      },
    },
    {
      name: 'videoUrl',
      label: 'Ссылка на видео',
      type: 'text',
      validate: validateUrl,
      access: { read: publicFileOnly },
      admin: {
        placeholder: 'https://www.youtube.com/watch?v=…',
        condition: (data) => data?.kind === 'video',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subject',
          label: 'Предмет',
          type: 'select',
          options: adminOptions(SUBJECTS),
        },
        {
          name: 'year',
          label: 'Год',
          type: 'number',
          min: 2012,
          max: 2100,
          index: true,
          admin: { description: 'Для фильтра библиотеки. Пусто — год мероприятия.' },
        },
      ],
    },
    {
      name: 'event',
      label: 'Мероприятие',
      type: 'relationship',
      relationTo: 'events',
      index: true,
      admin: { description: 'Материал появится в карточке мероприятия (вкладка «Итоги»).' },
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      localized: true,
      admin: { description: 'Одно-два предложения: что внутри.' },
    },
  ],
}

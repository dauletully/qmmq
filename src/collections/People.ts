import type { Access, CollectionConfig } from 'payload'

import { contentEditors, roleOf } from '../access'
import { adminOptions, PERSON_ROLES, REGIONS, SUBJECTS } from '../lib/constants'
import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'

// Посетители сайта видят только тех, кто дал согласие на публикацию.
const readPeople: Access = ({ req }) => {
  if (roleOf(req.user)) return true
  return { publishConsent: { equals: true } }
}

export const People: CollectionConfig = {
  slug: 'people',
  labels: { singular: 'Человек', plural: 'Люди' },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'name',
    group: 'Контент',
    defaultColumns: ['name', 'roles', 'position', 'publishConsent', 'order'],
    description:
      'Команда, спикеры, жюри, педагоги-мастера и авторы историй — одна карточка на человека. Без отметки согласия человек не показывается на сайте.',
    listSearchableFields: ['name'],
  },
  access: {
    read: readPeople,
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
      type: 'row',
      fields: [
        { name: 'name', label: 'Имя и фамилия', type: 'text', required: true },
        {
          name: 'roles',
          label: 'Роли',
          type: 'select',
          hasMany: true,
          options: adminOptions(PERSON_ROLES),
        },
      ],
    },
    {
      name: 'photo',
      label: 'Фото',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Квадратный портрет, одинаковая обработка для всех спикеров.' },
    },
    {
      name: 'position',
      label: 'Регалии и должность',
      type: 'textarea',
      localized: true,
      admin: { description: 'Например: «Академик». Пишите только подтверждённые сведения.' },
    },
    {
      name: 'contribution',
      label: 'Вклад — одна строка',
      type: 'text',
      localized: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subjects',
          label: 'Предметы',
          type: 'select',
          hasMany: true,
          options: adminOptions(SUBJECTS),
        },
        { name: 'region', label: 'Регион', type: 'select', options: adminOptions(REGIONS) },
      ],
    },
    { name: 'school', label: 'Школа / организация', type: 'text', localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'firstParticipationYear',
          label: 'Год первого участия',
          type: 'number',
          min: 2012,
          max: 2100,
        },
        {
          name: 'order',
          label: 'Порядок',
          type: 'number',
          defaultValue: 100,
          admin: { description: 'Меньше — выше в списке.' },
        },
      ],
    },
    {
      name: 'studentAchievements',
      label: 'Достижения учеников',
      type: 'textarea',
      localized: true,
      admin: { description: 'Например, медали IMO / IPhO / IOI. Только подтверждённые факты.' },
    },
    {
      name: 'publishConsent',
      label: 'Согласие на публикацию получено',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Без этой отметки карточка не появится на сайте.',
      },
    },
  ],
}

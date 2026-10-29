import type { Access, CollectionConfig } from 'payload'

import { contentEditors, roleOf } from '../access'
import { adminOptions, PERSON_ROLES, REGIONS, SUBJECTS } from '../lib/constants'
import { SITE_CACHE_TAGS, siteRevalidateHooks } from '../lib/revalidate'
import { validateEmail, validateOptionalPhone, validateUrl } from '../lib/validators'

// Посетители сайта видят только тех, кто дал согласие на публикацию.
const readPeople: Access = ({ req }) => {
  if (roleOf(req.user)) return true
  return { publishConsent: { equals: true } }
}

// Люди общие для лендинга (спикеры, истории) и сайта (команда, каталог педагогов).
const hooks = siteRevalidateHooks([SITE_CACHE_TAGS.people], { withLanding: true })

const isTeam = (data: Record<string, unknown> | undefined) =>
  Array.isArray(data?.roles) && (data!.roles as string[]).includes('team')
const isMaster = (data: Record<string, unknown> | undefined) =>
  Array.isArray(data?.roles) && (data!.roles as string[]).includes('master')

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
    afterChange: [hooks.afterChange],
    afterDelete: [hooks.afterDelete],
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
          admin: {
            description:
              '«Команда» — страница /about/team; «Педагог-мастер» — каталог /community/people (нужна отметка «Показывать в каталоге»).',
          },
        },
      ],
    },
    {
      type: 'row',
      admin: { condition: isTeam },
      fields: [
        {
          name: 'teamPosition',
          label: 'Должность в команде',
          type: 'text',
          localized: true,
          admin: { placeholder: 'Президент ассоциации', width: '70%' },
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
      name: 'bio',
      label: 'Биография',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Несколько абзацев для страницы команды или карточки педагога-мастера.',
        rows: 5,
      },
    },
    {
      name: 'quote',
      label: 'Цитата',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Одна-две фразы от первого лица — для карточки педагога или истории участника.',
      },
    },
    {
      name: 'contact',
      label: 'Контакты для сайта',
      type: 'group',
      admin: {
        description:
          'Показываются на сайте только у команды и педагогов-мастеров в каталоге. Публикуйте только то, на что человек согласился.',
        condition: (data) => isTeam(data) || isMaster(data),
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'email', label: 'E-mail', type: 'text', validate: validateEmail },
            {
              name: 'phone',
              label: 'Телефон',
              type: 'text',
              validate: validateOptionalPhone,
              admin: { placeholder: '+7 701 123 45 67' },
            },
          ],
        },
        {
          name: 'url',
          label: 'Ссылка',
          type: 'text',
          validate: validateUrl,
          admin: { placeholder: 'https://instagram.com/…', description: 'Соцсеть или сайт.' },
        },
      ],
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
    {
      name: 'showInCatalog',
      label: 'Показывать в каталоге педагогов',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Каталог /community/people. Отмечайте только по явному согласию человека (форма «Вступить» → «хочу в каталог»). Нужны также роль «Педагог-мастер» и согласие на публикацию.',
      },
    },
  ],
}

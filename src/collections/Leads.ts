import type { CollectionConfig, Field } from 'payload'

import { adminFieldOnly, adminOnly, noFieldUpdate, roleOf } from '../access'
import { adminOptions, EXPERIENCE, LEAD_TYPES, REGIONS, SUBJECTS } from '../lib/constants'

export const AMO_SYNC_STATUSES = [
  { value: 'pending', label: 'В очереди' },
  { value: 'sent', label: 'Отправлена' },
  { value: 'failed', label: 'Ошибка' },
  { value: 'disabled', label: 'Не отправлялась — amoCRM не подключена' },
] as const

const isSchool = (data: Record<string, unknown> | undefined) => data?.type === 'school'
const isParticipant = (data: Record<string, unknown> | undefined) => !isSchool(data)

// Все поля заявки — только для чтения: их пишет сервер (API форм, очередь amoCRM, вебхук).
function locked(fields: Field[]): Field[] {
  return fields.map((field) => {
    if (field.type === 'row' || field.type === 'collapsible') {
      return { ...field, fields: locked(field.fields) }
    }
    if (!('name' in field) || field.type === 'ui') return field
    return {
      ...field,
      access: { ...field.access, update: noFieldUpdate },
      admin: { ...field.admin, readOnly: true },
    } as Field
  })
}

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'displayName',
    group: 'Заявки',
    defaultColumns: [
      'createdAt',
      'type',
      'displayName',
      'phone',
      'subject',
      'region',
      'amo.syncStatus',
      'payment.paid',
    ],
    listSearchableFields: ['displayName', 'fullName', 'organization', 'phone', 'email'],
    description:
      'Заявки со всех форм лендинга. Создаются только сайтом; поля менять нельзя — кроме отметки об оплате (администратор).',
    pagination: { defaultLimit: 50 },
    components: {
      beforeListTable: ['/admin/leads/LeadFilters#LeadFilters'],
    },
  },
  access: {
    read: ({ req }) => Boolean(roleOf(req.user)),
    create: () => false,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    ...locked([
      {
        name: 'displayName',
        label: 'ФИО или организация',
        type: 'text',
        index: true,
        admin: { condition: () => false },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            label: 'Тип',
            type: 'select',
            required: true,
            index: true,
            options: adminOptions(LEAD_TYPES),
          },
          {
            name: 'locale',
            label: 'Язык формы',
            type: 'select',
            defaultValue: 'ru',
            options: [
              { value: 'ru', label: 'Русский' },
              { value: 'kk', label: 'Қазақша' },
            ],
          },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'event', label: 'Мероприятие', type: 'relationship', relationTo: 'events' },
          { name: 'landing', label: 'Лендинг', type: 'relationship', relationTo: 'landings' },
        ],
      },
      // Участник
      {
        type: 'collapsible',
        label: 'Участник',
        admin: { condition: isParticipant },
        fields: [
          { name: 'fullName', label: 'ФИО', type: 'text' },
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
                name: 'experience',
                label: 'Стаж',
                type: 'select',
                options: adminOptions(EXPERIENCE),
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'region',
                label: 'Регион',
                type: 'select',
                index: true,
                options: adminOptions(REGIONS),
              },
              { name: 'city', label: 'Город', type: 'text' },
            ],
          },
          { name: 'school', label: 'Школа / организация', type: 'text' },
          { name: 'howHeard', label: 'Как узнали о конкурсе', type: 'text' },
        ],
      },
      // Школа
      {
        type: 'collapsible',
        label: 'Школа',
        admin: { condition: isSchool },
        fields: [
          { name: 'organization', label: 'Организация', type: 'text' },
          { name: 'contactPerson', label: 'Контактное лицо', type: 'text' },
          {
            type: 'row',
            fields: [
              { name: 'participantsCount', label: 'Число участников', type: 'number' },
              {
                name: 'subjects',
                label: 'Предметы',
                type: 'select',
                hasMany: true,
                options: adminOptions(SUBJECTS),
              },
            ],
          },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'phone', label: 'Телефон (WhatsApp)', type: 'text', index: true },
          { name: 'email', label: 'E-mail', type: 'text' },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'consent', label: 'Согласие на обработку данных', type: 'checkbox' },
          {
            name: 'consentAt',
            label: 'Когда дано согласие',
            type: 'date',
            admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' } },
          },
        ],
      },
      {
        name: 'attribution',
        label: 'Источник',
        type: 'group',
        admin: { description: 'Откуда пришёл посетитель — заполняет трекер аналитики.' },
        fields: [
          {
            type: 'row',
            fields: [
              { name: 'utmSource', label: 'utm_source', type: 'text' },
              { name: 'utmMedium', label: 'utm_medium', type: 'text' },
              { name: 'utmCampaign', label: 'utm_campaign', type: 'text' },
            ],
          },
          {
            type: 'row',
            fields: [
              { name: 'utmContent', label: 'utm_content', type: 'text' },
              { name: 'utmTerm', label: 'utm_term', type: 'text' },
              { name: 'device', label: 'Устройство', type: 'text' },
            ],
          },
          { name: 'referrer', label: 'Откуда перешли (referrer)', type: 'text' },
          { name: 'landingPath', label: 'Страница входа', type: 'text' },
          {
            type: 'row',
            fields: [
              { name: 'visitorId', label: 'ID посетителя', type: 'text', index: true },
              { name: 'sessionId', label: 'ID визита', type: 'text' },
            ],
          },
        ],
      },
    ]),
    {
      name: 'payment',
      label: 'Оплата',
      type: 'group',
      admin: {
        position: 'sidebar',
        description:
          'Отмечается автоматически, когда сделка в amoCRM переходит на этап «Оплачено». Администратор может отметить вручную.',
      },
      access: { update: adminFieldOnly },
      fields: [
        { name: 'paid', label: 'Оплачено', type: 'checkbox', defaultValue: false, index: true },
        {
          name: 'paidAt',
          label: 'Дата оплаты',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' } },
        },
      ],
    },
    {
      name: 'amo',
      label: 'amoCRM',
      type: 'group',
      admin: { position: 'sidebar' },
      access: { update: noFieldUpdate },
      fields: [
        {
          name: 'panel',
          type: 'ui',
          admin: { components: { Field: '/admin/leads/AmoLeadPanel#AmoLeadPanel' } },
        },
        {
          name: 'syncStatus',
          label: 'Статус отправки',
          type: 'select',
          index: true,
          defaultValue: 'pending',
          options: AMO_SYNC_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          admin: { readOnly: true },
        },
        {
          name: 'leadId',
          label: 'ID сделки',
          type: 'number',
          index: true,
          admin: { readOnly: true },
        },
        { name: 'contactId', label: 'ID контакта', type: 'number', admin: { readOnly: true } },
        {
          name: 'attempts',
          label: 'Попыток',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'lastError',
          label: 'Последняя ошибка',
          type: 'textarea',
          admin: { readOnly: true },
        },
        { name: 'syncedAt', label: 'Отправлена', type: 'date', admin: { readOnly: true } },
        { name: 'pipelineId', label: 'Воронка', type: 'number', admin: { readOnly: true } },
        { name: 'statusId', label: 'Этап', type: 'number', admin: { readOnly: true } },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const fullName = data.fullName ?? originalDoc?.fullName
        const organization = data.organization ?? originalDoc?.organization
        data.displayName = (data.type ?? originalDoc?.type) === 'school' ? organization : fullName
        if (data.payment) {
          const wasPaid = Boolean(originalDoc?.payment?.paid)
          if (data.payment.paid && !data.payment.paidAt) {
            data.payment.paidAt = wasPaid ? originalDoc?.payment?.paidAt : new Date().toISOString()
          }
          if (data.payment.paid === false) data.payment.paidAt = null
        }
        return data
      },
    ],
  },
}

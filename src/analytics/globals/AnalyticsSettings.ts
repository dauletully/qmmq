import type { GlobalConfig } from 'payload'

import { adminOnly, leadManagers } from '../../access'
import { DEFAULT_PLAN_STEPS, SETTINGS_SLUG } from '../shared'

export const AnalyticsSettings: GlobalConfig = {
  slug: SETTINGS_SLUG,
  label: 'Аналитика: цели и исключения',
  admin: {
    group: 'Настройки',
    description: 'Цели плана для отчётов и посетители, которых не нужно учитывать.',
  },
  access: {
    read: leadManagers,
    update: adminOnly,
  },
  graphQL: false,
  fields: [
    {
      type: 'collapsible',
      label: 'План оплат',
      fields: [
        {
          type: 'row',
          fields: DEFAULT_PLAN_STEPS.map((value, i) => ({
            name: `planStep${i + 1}`,
            label: `Ступень ${i + 1}`,
            type: 'number' as const,
            min: 0,
            required: true,
            defaultValue: value,
            admin: { width: '33%' },
          })),
        },
        {
          name: 'countSchoolParticipants',
          label: 'Оплаченную заявку от школы считать по числу участников',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Иначе заявка от школы считается как одна регистрация.',
          },
        },
      ],
    },
    {
      name: 'excludedVisitorIds',
      label: 'Не учитывать посетителей (ID, по одному в строке)',
      type: 'textarea',
      admin: {
        description:
          'Сотрудники, вошедшие в админку, не учитываются автоматически. Телефон без входа в админку ' +
          'проще исключить так: открыть на нём лендинг с адресом …/?notrack=1 (вернуть — ?notrack=0).',
      },
    },
  ],
}

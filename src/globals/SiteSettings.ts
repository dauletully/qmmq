import type { GlobalConfig } from 'payload'

import { anyone, contentEditors } from '../access'
import { adminOptions, SOCIAL_NETWORKS } from '../lib/constants'
import { revalidateGlobalAfterChange } from '../lib/revalidate'
import { validateEmail, validateOptionalPhone, validateUrl } from '../lib/validators'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: {
    group: 'Настройки',
    description: 'Контакты, реквизиты и документы — общие для сайта и лендингов.',
  },
  access: {
    read: anyone,
    update: contentEditors,
  },
  versions: { max: 25 },
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Ассоциация',
          fields: [
            {
              name: 'associationName',
              label: 'Название ассоциации',
              type: 'text',
              localized: true,
            },
            { name: 'logo', label: 'Логотип', type: 'upload', relationTo: 'media' },
            {
              name: 'activeLanding',
              label: 'Активный лендинг',
              type: 'relationship',
              relationTo: 'landings',
              admin: {
                description: 'Какой лендинг открывается на главной странице contest.qmmq.kz.',
              },
            },
          ],
        },
        {
          label: 'Контакты',
          fields: [
            {
              name: 'phones',
              label: 'Телефоны',
              type: 'array',
              labels: { singular: 'Телефон', plural: 'Телефоны' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'number',
                      label: 'Номер',
                      type: 'text',
                      required: true,
                      validate: validateOptionalPhone,
                      admin: { placeholder: '+7 701 123 45 67' },
                    },
                    {
                      name: 'label',
                      label: 'Подпись',
                      type: 'text',
                      localized: true,
                      admin: { placeholder: 'Менеджер конкурса' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'whatsapp',
              label: 'WhatsApp',
              type: 'text',
              validate: validateOptionalPhone,
              admin: {
                placeholder: '+7 701 123 45 67',
                description: 'Номер для кнопки WhatsApp (ссылка wa.me собирается автоматически).',
              },
            },
            { name: 'email', label: 'E-mail', type: 'text', validate: validateEmail },
            { name: 'address', label: 'Адрес офиса', type: 'textarea', localized: true },
            {
              name: 'socials',
              label: 'Соцсети',
              type: 'array',
              labels: { singular: 'Соцсеть', plural: 'Соцсети' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'network',
                      label: 'Сеть',
                      type: 'select',
                      required: true,
                      options: adminOptions(SOCIAL_NETWORKS),
                    },
                    {
                      name: 'url',
                      label: 'Ссылка',
                      type: 'text',
                      required: true,
                      validate: validateUrl,
                    },
                  ],
                },
                {
                  name: 'label',
                  label: 'Подпись на сайте',
                  type: 'text',
                  localized: true,
                  admin: {
                    placeholder: 'канал сообщества',
                    description: 'Как ссылка называется на странице. Пусто — название сети.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Реквизиты и документы',
          fields: [
            {
              name: 'requisites',
              label: 'Реквизиты',
              type: 'textarea',
              localized: true,
              admin: { description: 'Показываются в подвале. БИН, банк, ИИК, юридический адрес.' },
            },
            {
              name: 'offer',
              label: 'Договор-оферта',
              type: 'group',
              admin: { description: 'Загрузите PDF или вставьте текст — достаточно одного.' },
              fields: [
                {
                  name: 'pdf',
                  label: 'PDF',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { equals: 'application/pdf' } },
                },
                { name: 'text', label: 'Текст', type: 'richText', localized: true },
              ],
            },
            {
              name: 'privacy',
              label: 'Политика конфиденциальности',
              type: 'group',
              admin: { description: 'Загрузите PDF или вставьте текст — достаточно одного.' },
              fields: [
                {
                  name: 'pdf',
                  label: 'PDF',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { equals: 'application/pdf' } },
                },
                { name: 'text', label: 'Текст', type: 'richText', localized: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

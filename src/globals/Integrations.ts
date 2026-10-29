import type { FieldHook, GlobalConfig } from 'payload'

import { adminFieldOnly, adminOnly, noFieldUpdate } from '../access'
import { revalidateGlobalAfterChange } from '../lib/revalidate'
import { validateAmoBaseUrl, validateMetaPixelId, validateTiktokPixelId } from '../lib/validators'

const trim: FieldHook = ({ value }) => (typeof value === 'string' ? value.trim() : value)

const newSecret = () => globalThis.crypto.randomUUID().replace(/-/g, '')

export const Integrations: GlobalConfig = {
  slug: 'integrations',
  label: 'Интеграции',
  admin: {
    group: 'Настройки',
    description: 'amoCRM и рекламные пиксели. Доступно только администраторам.',
  },
  access: {
    read: adminOnly,
    update: adminOnly,
  },
  // ID пикселей выводятся на лендинге.
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'amocrm',
          label: 'amoCRM',
          fields: [
            {
              name: 'guide',
              type: 'ui',
              admin: { components: { Field: '/admin/integrations/AmoGuide#AmoGuide' } },
            },
            {
              name: 'enabled',
              label: 'Отправлять заявки в amoCRM',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Пока выключено, заявки копятся на сайте со статусом «Не отправлялась». Их можно отправить позже кнопкой внизу.',
              },
            },
            {
              name: 'baseUrl',
              label: 'Адрес аккаунта amoCRM',
              type: 'text',
              validate: validateAmoBaseUrl,
              hooks: { beforeChange: [trim] },
              admin: { placeholder: 'https://school.amocrm.ru' },
            },
            {
              name: 'accessToken',
              label: 'Долгосрочный токен',
              type: 'textarea',
              access: { read: adminFieldOnly, update: adminFieldOnly },
              hooks: { beforeChange: [trim] },
              admin: {
                rows: 3,
                description:
                  'Длинная строка из вкладки «Ключи и доступы» приватной интеграции. Никому не пересылайте.',
              },
            },
            {
              name: 'connection',
              type: 'ui',
              admin: { components: { Field: '/admin/integrations/AmoConnection#AmoConnection' } },
            },
            {
              name: 'pipelinesCache',
              label: 'Воронка и этапы',
              type: 'json',
              access: { update: noFieldUpdate },
              admin: {
                components: { Field: '/admin/integrations/AmoPipelinePicker#AmoPipelinePicker' },
              },
            },
            {
              name: 'pipelineId',
              label: 'ID воронки',
              type: 'number',
              admin: { hidden: true },
            },
            {
              name: 'newStatusId',
              label: 'ID этапа новых заявок',
              type: 'number',
              admin: { hidden: true },
            },
            {
              name: 'paidStatusIds',
              label: 'ID этапов «Оплачено»',
              type: 'number',
              hasMany: true,
              admin: { hidden: true },
            },
            {
              name: 'fieldMap',
              label: 'Поля сделки в amoCRM',
              type: 'json',
              access: { update: noFieldUpdate },
              admin: {
                components: { Field: '/admin/integrations/AmoFieldsSetup#AmoFieldsSetup' },
              },
            },
            {
              name: 'webhookSecret',
              label: 'Секрет вебхука',
              type: 'text',
              defaultValue: newSecret,
              hooks: {
                beforeChange: [
                  ({ value }) =>
                    typeof value === 'string' && value.trim() ? value.trim() : newSecret(),
                ],
              },
              admin: {
                description:
                  'Часть адреса вебхука. Чтобы сменить — очистите поле и сохраните: будет создан новый, и адрес в amoCRM нужно будет обновить.',
              },
            },
            {
              name: 'webhook',
              type: 'ui',
              admin: {
                components: {
                  Field: {
                    path: '/admin/integrations/AmoWebhook#AmoWebhook',
                    clientProps: { siteUrl: process.env.SITE_URL || '' },
                  },
                },
              },
            },
            {
              name: 'queue',
              type: 'ui',
              admin: { components: { Field: '/admin/integrations/AmoQueue#AmoQueue' } },
            },
          ],
        },
        {
          name: 'pixels',
          label: 'Рекламные пиксели',
          description:
            'Пустое поле — пиксель на сайт не загружается. Пиксели получают события «заявка отправлена».',
          fields: [
            {
              name: 'metaPixelId',
              label: 'Meta Pixel ID (Facebook, Instagram)',
              type: 'text',
              validate: validateMetaPixelId,
              hooks: { beforeChange: [trim] },
              admin: {
                placeholder: '123456789012345',
                description:
                  'Где взять: business.facebook.com → Events Manager → «Источники данных» → ваш пиксель → «Настройки» → «ID пикселя». Только цифры, без кода.',
              },
            },
            {
              name: 'tiktokPixelId',
              label: 'TikTok Pixel ID',
              type: 'text',
              validate: validateTiktokPixelId,
              hooks: { beforeChange: [trim] },
              admin: {
                placeholder: 'CABCDEFGHIJ1234567KL',
                description:
                  'Где взять: ads.tiktok.com → «Инструменты» → «События» → «Веб-события» → ваш пиксель; ID указан под названием. Только ID, без кода.',
              },
            },
          ],
        },
      ],
    },
  ],
}

import type { CollectionConfig, Field } from 'payload'

import { anyone, contentEditors } from '../access'
import { adminOptions, BENEFIT_ICONS, SUBJECTS } from '../lib/constants'
import { validateSlug } from '../lib/validators'

type TextOpts = { description?: string; placeholder?: string; required?: boolean }

const text = (name: string, label: string, opts: TextOpts = {}): Field => ({
  name,
  label,
  type: 'text',
  localized: true,
  required: opts.required,
  admin: { description: opts.description, placeholder: opts.placeholder },
})

const textarea = (name: string, label: string, opts: TextOpts = {}): Field => ({
  name,
  label,
  type: 'textarea',
  localized: true,
  required: opts.required,
  admin: { description: opts.description, placeholder: opts.placeholder, rows: 3 },
})

const heading = (placeholder?: string): Field => text('heading', 'Заголовок блока', { placeholder })

export const Landings: CollectionConfig = {
  slug: 'landings',
  labels: { singular: 'Лендинг', plural: 'Лендинги' },
  versions: { maxPerDoc: 25 },
  admin: {
    useAsTitle: 'internalTitle',
    group: 'Контент',
    defaultColumns: ['internalTitle', 'slug', 'event', 'updatedAt'],
    description:
      'Продающая страница мероприятия. Каждый блок страницы — отдельная вкладка. Даты, цена, адрес и программа берутся из мероприятия.',
  },
  access: {
    read: anyone,
    create: contentEditors,
    update: contentEditors,
    delete: contentEditors,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'internalTitle',
          label: 'Название для админки',
          type: 'text',
          required: true,
          admin: { description: 'Видно только в админке.' },
        },
        {
          name: 'slug',
          label: 'Адрес (slug)',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          validate: validateSlug,
          admin: { description: 'Например contest-2026. Формы отправляют этот адрес.' },
        },
      ],
    },
    {
      name: 'event',
      label: 'Мероприятие',
      type: 'relationship',
      relationTo: 'events',
      required: true,
      admin: { description: 'Отсюда берутся даты, цена, место, программа и PDF положения.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'hero',
          label: 'Первый экран',
          fields: [
            text('eyebrow', 'Надзаголовок', { placeholder: 'XII конкурс · Алматы, декабрь 2026' }),
            textarea('heading', 'Заголовок'),
            textarea('subheading', 'Подзаголовок'),
            text('partnerNote', 'Строка о партнёре', {
              placeholder: 'Совместно с Министерством просвещения РК',
            }),
            {
              name: 'partnerLogo',
              label: 'Логотип партнёра',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'stats',
              label: 'Цифры',
              type: 'array',
              maxRows: 4,
              labels: { singular: 'Цифра', plural: 'Цифры' },
              admin: {
                description: 'Крупные цифры под заголовком. Должны совпадать с положением.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'value',
                      label: 'Число',
                      type: 'text',
                      required: true,
                      admin: { placeholder: '10 000+', width: '30%' },
                    },
                    {
                      name: 'label',
                      label: 'Подпись',
                      type: 'text',
                      localized: true,
                      admin: { placeholder: 'учителей', width: '70%' },
                    },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                text('primaryCta', 'Главная кнопка', { placeholder: 'Зарегистрироваться' }),
                text('secondaryCta', 'Второстепенная кнопка', { placeholder: 'Скачать положение' }),
              ],
            },
          ],
        },
        {
          name: 'audience',
          label: 'Для кого',
          fields: [
            heading('Для кого конкурс'),
            {
              name: 'cards',
              label: 'Карточки',
              type: 'array',
              labels: { singular: 'Карточка', plural: 'Карточки' },
              fields: [
                {
                  name: 'subject',
                  label: 'Предмет (иконка)',
                  type: 'select',
                  options: adminOptions(SUBJECTS),
                },
                text('title', 'Заголовок'),
                textarea('text', 'Текст'),
              ],
            },
          ],
        },
        {
          name: 'benefits',
          label: 'Что получает участник',
          fields: [
            heading('Что получает участник'),
            {
              name: 'items',
              label: 'Выгоды',
              type: 'array',
              labels: { singular: 'Выгода', plural: 'Выгоды' },
              fields: [
                {
                  name: 'icon',
                  label: 'Иконка',
                  type: 'select',
                  options: adminOptions(BENEFIT_ICONS),
                },
                text('title', 'Заголовок'),
                textarea('text', 'Текст'),
              ],
            },
          ],
        },
        {
          name: 'program',
          label: 'Программа',
          description: 'Само расписание редактируется в мероприятии, вкладка «Программа».',
          fields: [heading('Программа'), textarea('note', 'Примечание под программой')],
        },
        {
          name: 'pricing',
          label: 'Стоимость',
          description: 'Цена, срок регистрации и размер группы берутся из мероприятия.',
          fields: [
            heading('Стоимость участия'),
            {
              name: 'includes',
              label: 'Что входит в стоимость',
              type: 'array',
              labels: { singular: 'Пункт', plural: 'Пункты' },
              fields: [text('text', 'Пункт')],
            },
            textarea('documentNote', 'Какой документ получает участник'),
            textarea('groupTerms', 'Условия для групп от школы'),
            textarea('paymentNote', 'Об оплате', {
              placeholder:
                'Онлайн-оплаты нет: после регистрации менеджер свяжется и примет оплату.',
            }),
            textarea('deadlineNote', 'О сроке регистрации'),
          ],
        },
        {
          name: 'speakers',
          label: 'Спикеры и жюри',
          fields: [
            heading('Спикеры и жюри'),
            {
              name: 'people',
              label: 'Люди',
              type: 'relationship',
              relationTo: 'people',
              hasMany: true,
              admin: {
                description:
                  'Порядок — перетаскиванием. Показываются только люди с отметкой «Согласие на публикацию».',
              },
            },
          ],
        },
        {
          name: 'history',
          label: 'История',
          fields: [
            heading('История и достижения'),
            {
              name: 'milestones',
              label: 'Таймлайн',
              type: 'array',
              labels: { singular: 'Веха', plural: 'Вехи' },
              fields: [
                {
                  name: 'period',
                  label: 'Период',
                  type: 'text',
                  admin: { placeholder: '2012–2023' },
                },
                text('title', 'Заголовок'),
                textarea('text', 'Текст'),
              ],
            },
            {
              name: 'figures',
              label: 'Цифры',
              type: 'array',
              labels: { singular: 'Цифра', plural: 'Цифры' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', label: 'Число', type: 'text', admin: { width: '30%' } },
                    {
                      name: 'label',
                      label: 'Подпись',
                      type: 'text',
                      localized: true,
                      admin: { width: '70%' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'prizes',
              label: 'Призы прошлых лет',
              type: 'array',
              labels: { singular: 'Приз', plural: 'Призы' },
              fields: [
                text('title', 'Название'),
                text('value', 'Размер / ценность'),
                textarea('text', 'Текст'),
              ],
            },
          ],
        },
        {
          name: 'stories',
          label: 'Истории участников',
          fields: [
            heading('Истории участников'),
            {
              name: 'items',
              label: 'Истории',
              type: 'array',
              labels: { singular: 'История', plural: 'Истории' },
              admin: {
                description:
                  'Только реальные люди с согласием на публикацию: имя, школа и год первого участия берутся из карточки человека.',
              },
              fields: [
                {
                  name: 'person',
                  label: 'Человек',
                  type: 'relationship',
                  relationTo: 'people',
                },
                textarea('quote', 'Цитата'),
                text('achievement', 'Достижение'),
              ],
            },
          ],
        },
        {
          name: 'address',
          label: 'Обращение',
          fields: [
            heading('Обращение вице-президента'),
            {
              name: 'body',
              label: 'Текст',
              type: 'richText',
              localized: true,
              admin: { description: 'Сокращённый текст, около трёх абзацев.' },
            },
            {
              name: 'author',
              label: 'Автор',
              type: 'relationship',
              relationTo: 'people',
              admin: { description: 'Фото и имя берутся из карточки человека.' },
            },
            text('signature', 'Подпись'),
          ],
        },
        {
          name: 'partners',
          label: 'Партнёры',
          fields: [
            heading('Партнёры и организаторы'),
            {
              name: 'items',
              label: 'Партнёры',
              type: 'relationship',
              relationTo: 'partners',
              hasMany: true,
              admin: { description: 'Порядок — перетаскиванием.' },
            },
          ],
        },
        {
          name: 'faq',
          label: 'Вопросы и ответы',
          fields: [
            heading('Вопросы и ответы'),
            {
              name: 'items',
              label: 'Вопросы',
              type: 'array',
              labels: { singular: 'Вопрос', plural: 'Вопросы' },
              admin: { initCollapsed: true },
              fields: [text('question', 'Вопрос'), textarea('answer', 'Ответ')],
            },
          ],
        },
        {
          name: 'contacts',
          label: 'Контакты',
          description:
            'Телефоны, WhatsApp, e-mail и соцсети берутся из «Настроек сайта», адрес площадки — из мероприятия.',
          fields: [heading('Контакты'), textarea('finalCta', 'Финальный призыв')],
        },
        {
          name: 'forms',
          label: 'Формы',
          fields: [
            {
              name: 'howHeardOptions',
              label: 'Варианты «Как узнали о конкурсе»',
              type: 'array',
              labels: { singular: 'Вариант', plural: 'Варианты' },
              fields: [text('label', 'Вариант')],
            },
            textarea('schoolNote', 'Пояснение к заявке от школы', {
              placeholder: 'Менеджер перезвонит в рабочее время',
            }),
            textarea('consentText', 'Текст согласия', {
              description: 'Рядом с галочкой согласия во всех формах.',
            }),
          ],
        },
        {
          name: 'thankYou',
          label: 'Страница «Спасибо»',
          description:
            'Даты, адрес и ссылка на чат участников добавляются из мероприятия автоматически.',
          fields: [text('heading', 'Заголовок'), textarea('body', 'Текст')],
        },
        {
          name: 'seo',
          label: 'SEO',
          fields: [
            text('title', 'Заголовок страницы (title)', { description: 'До 60 символов.' }),
            textarea('description', 'Описание (description)', {
              description: 'До 160 символов. Показывается в поиске и в превью ссылки в WhatsApp.',
            }),
            {
              name: 'ogImage',
              label: 'Обложка для соцсетей',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Горизонтальная картинка, лучше 1200×630.' },
            },
          ],
        },
      ],
    },
  ],
}

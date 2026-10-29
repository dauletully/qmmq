import type { CollectionConfig, Field } from 'payload'

import { anyone, contentEditors } from '../access'
import { adminOptions, BENEFIT_ICONS, SUBJECTS } from '../lib/constants'
import { revalidateAfterChange, revalidateAfterDelete } from '../lib/revalidate'
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

// Вводный абзац под заголовком блока. Пусто — абзаца нет.
const lead = (): Field =>
  textarea('lead', 'Вводный абзац', { description: 'Одно-два предложения под заголовком блока.' })

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
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
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
            text('eyebrow', 'Надзаголовок', {
              placeholder: 'Казахстанская ассоциация учителей математики · с 2012 года',
              description: 'Название ассоциации и год через « · ». На телефоне — две строки.',
            }),
            textarea('heading', 'Заголовок', {
              description: 'Римский номер конкурса (XII) выделяется золотом автоматически.',
            }),
            textarea('subheading', 'Дата под заголовком', {
              placeholder: 'Декабрь 2026',
              description:
                'Строка с иконкой календаря рядом с городом. Пусто — даты из мероприятия.',
            }),
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
                text('primaryCta', 'Главная кнопка', {
                  placeholder: 'Зарегистрироваться',
                  description: 'Цена из мероприятия добавляется автоматически.',
                }),
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
            lead(),
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
            {
              name: 'notes',
              label: 'Кто что получит',
              type: 'array',
              labels: { singular: 'Строка', plural: 'Строки' },
              admin: {
                description:
                  'Серая плашка под карточками: «Молодым учителям…», «Директорам…». Заголовок выделяется жирным, текст продолжает его.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'icon',
                      label: 'Иконка',
                      type: 'select',
                      options: adminOptions(BENEFIT_ICONS),
                      admin: { width: '50%' },
                    },
                    {
                      name: 'action',
                      label: 'Ссылка под текстом',
                      type: 'select',
                      defaultValue: 'none',
                      options: [
                        { value: 'none', label: 'Нет' },
                        { value: 'school', label: '«Заявка от школы»' },
                      ],
                      admin: { width: '50%' },
                    },
                  ],
                },
                text('title', 'Заголовок', { placeholder: 'Молодым учителям' }),
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
            lead(),
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
          name: 'gallery',
          label: 'Фотографии',
          description:
            'Блок после «Что получает участник». Только реальные фото конкурсов. Пусто — блок не показывается.',
          fields: [
            heading('Как проходит конкурс'),
            lead(),
            {
              name: 'images',
              label: 'Фотографии',
              type: 'array',
              labels: { singular: 'Фото', plural: 'Фото' },
              admin: {
                description:
                  'Порядок — перетаскиванием. Первое фото на компьютере крупное — ставьте горизонтальное и чёткое. Описание для незрячих (alt) — в карточке файла.',
              },
              fields: [
                {
                  name: 'image',
                  label: 'Фото',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                text('caption', 'Подпись', { placeholder: 'Олимпиадный тур' }),
              ],
            },
          ],
        },
        {
          name: 'program',
          label: 'Программа',
          description: 'Само расписание редактируется в мероприятии, вкладка «Программа».',
          fields: [
            heading('Программа'),
            textarea('note', 'Примечание к программе', {
              description: 'Голубая плашка над расписанием.',
            }),
          ],
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
            textarea('deadlineNote', 'О сроке регистрации', {
              description: 'Строка под счётчиком.',
            }),
          ],
        },
        {
          name: 'speakers',
          label: 'Спикеры и жюри',
          fields: [
            heading('Спикеры и жюри'),
            lead(),
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
            lead(),
            {
              name: 'milestones',
              label: 'Таймлайн',
              type: 'array',
              labels: { singular: 'Веха', plural: 'Вехи' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'period',
                      label: 'Период',
                      type: 'text',
                      admin: { placeholder: '2012–2023', width: '50%' },
                    },
                    {
                      name: 'kind',
                      label: 'Вид точки',
                      type: 'select',
                      defaultValue: 'default',
                      options: [
                        { value: 'default', label: 'Обычная веха' },
                        { value: 'pause', label: 'Пауза (пунктир)' },
                        { value: 'current', label: 'Текущий конкурс (золотая)' },
                      ],
                      admin: { width: '50%' },
                    },
                  ],
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
              admin: {
                description:
                  'Первая — крупная цифра карточки. Остальные — полоса-диаграмма «Конкурсы 2012–2023»: пропорции считаются по числам (~130 → 130).',
              },
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
              admin: {
                description:
                  'Крупно — «Размер / ценность» (или название, если ценности нет), мелко — название.',
              },
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
            lead(),
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
              admin: {
                description:
                  'Выберите партнёров из раздела «Партнёры» или создайте нового кнопкой «+» справа от поля. Порядок на странице — как здесь, меняется перетаскиванием. После сохранения лендинга карточки обновятся на сайте.',
              },
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
          fields: [
            heading('Контакты'),
            textarea('finalCta', 'Финальный призыв', {
              description: 'Заголовок синей ленты перед контактами.',
            }),
          ],
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
              description:
                'Рядом с галочкой в форме регистрации. Ссылки: [договора-оферты](offer) и [обработку персональных данных](privacy) — ведут на документы из «Настроек сайта».',
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

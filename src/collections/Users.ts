import { APIError, type CollectionConfig } from 'payload'

import { adminFieldOnly, adminOnly, adminOrSelf, loggedIn, roleOf, ROLES } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Пользователь', plural: 'Пользователи' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
    group: 'Настройки',
    description:
      'Сотрудники с доступом в админку. Администратор — всё, включая интеграции; редактор — тексты и материалы; менеджер — заявки и аналитика.',
  },
  auth: {
    // На проде '.qmmq.kz': вход в админку действует и на contest.qmmq.kz,
    // чтобы аналитика не считала сотрудников посетителями.
    cookies: { domain: process.env.COOKIE_DOMAIN || undefined },
  },
  access: {
    admin: ({ req }) => Boolean(roleOf(req.user)),
    read: loggedIn,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
    unlock: adminOnly,
  },
  fields: [
    {
      name: 'name',
      label: 'Имя',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: 'Роль',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: ROLES.map((r) => ({ value: r.value, label: r.label })),
      access: {
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
      admin: {
        position: 'sidebar',
        description:
          'Менять роль может только администратор. Первый пользователь становится администратором.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
          return data
        }
        // Нельзя снять роль с последнего администратора.
        if (originalDoc?.role === 'admin' && data.role && data.role !== 'admin') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            where: { role: { equals: 'admin' } },
            req,
          })
          if (totalDocs <= 1)
            throw new APIError('Нельзя снять роль с последнего администратора', 400)
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const doc = await req.payload.findByID({ collection: 'users', id, depth: 0, req })
        if (doc?.role !== 'admin') return
        const { totalDocs } = await req.payload.count({
          collection: 'users',
          where: { role: { equals: 'admin' } },
          req,
        })
        if (totalDocs <= 1) throw new APIError('Нельзя удалить последнего администратора', 400)
      },
    ],
  },
}

import type { Access, FieldAccess, PayloadRequest } from 'payload'

// Роли: admin — всё; editor — контент; manager — заявки и аналитика (контент только читает).
export const ROLES = [
  { value: 'admin', label: 'Администратор' },
  { value: 'editor', label: 'Редактор' },
  { value: 'manager', label: 'Менеджер' },
] as const

export type Role = (typeof ROLES)[number]['value']

type MaybeUser = PayloadRequest['user'] | null | undefined

export function roleOf(user: MaybeUser): Role | null {
  if (!user || user.collection !== 'users') return null
  return ((user as { role?: Role | null }).role ?? null) as Role | null
}

export function hasRole(user: MaybeUser, ...roles: Role[]): boolean {
  const role = roleOf(user)
  return role !== null && roles.includes(role)
}

export const isAdmin = (user: MaybeUser) => hasRole(user, 'admin')

// Доступ коллекций и глобалов
export const anyone: Access = () => true
export const nobody: Access = () => false
export const loggedIn: Access = ({ req }) => Boolean(roleOf(req.user))
export const adminOnly: Access = ({ req }) => isAdmin(req.user)
export const contentEditors: Access = ({ req }) => hasRole(req.user, 'admin', 'editor')
export const leadManagers: Access = ({ req }) => hasRole(req.user, 'admin', 'manager')

// Коллекции с черновиками (versions.drafts): посетители видят только опубликованное.
export const publishedOrStaff: Access = ({ req }) => {
  if (roleOf(req.user)) return true
  return { _status: { equals: 'published' } }
}

// Доступ полей (только boolean)
export const adminFieldOnly: FieldAccess = ({ req }) => isAdmin(req.user)
export const noFieldUpdate: FieldAccess = () => false

// Сотрудник видит всех пользователей, правит только себя; admin — всех.
export const adminOrSelf: Access = ({ req }) => {
  if (isAdmin(req.user)) return true
  if (!roleOf(req.user)) return false
  return { id: { equals: req.user!.id } }
}

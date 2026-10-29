// Общие для клиента и сервера: схемы форм, ключи ошибок, нормализация телефона.
// Серверная обработка — в ./submit.ts (не импортировать на клиенте).
export * from './schemas'
export * from './messages'
export { normalizePhone, isValidPhone, formatPhone } from '../phone'

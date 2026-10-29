import type { EventStatus } from './constants'

// Статус мероприятия на сайте: ручной override, иначе — по датам.
// finished — прошла дата окончания (или начала, если окончания нет); closed — прошёл срок регистрации.
// Используется и в коллекции events (виртуальное поле status), и в хелперах сайта.
export function computeEventStatus(
  data: {
    statusOverride?: string | null
    startDate?: string | null
    endDate?: string | null
    registrationDeadline?: string | null
  },
  now = Date.now(),
): EventStatus {
  const override = data.statusOverride
  if (override === 'open' || override === 'closed' || override === 'finished') return override
  const end = data.endDate || data.startDate
  if (end && new Date(end).getTime() < now) return 'finished'
  if (data.registrationDeadline && new Date(data.registrationDeadline).getTime() < now) {
    return 'closed'
  }
  return 'open'
}

// Разбор вебхуков amoCRM. amoCRM шлёт application/x-www-form-urlencoded:
// leads[status][0][id]=123&leads[status][0][status_id]=456&leads[status][0][pipeline_id]=789…

export type AmoLeadStatusChange = {
  leadId: number
  statusId: number | null
  pipelineId: number | null
  oldStatusId: number | null
  event: string
}

type Tree = { [key: string]: Tree | string }

// Мини-разбор вложенных ключей a[b][0][c] без зависимостей.
export function parseNestedForm(body: string): Tree {
  const root: Tree = {}
  const params = new URLSearchParams(body)
  for (const [rawKey, value] of params) {
    const match = rawKey.match(/^([^[\]]+)((?:\[[^[\]]*\])*)$/)
    if (!match) continue
    const keys = [match[1], ...Array.from(match[2].matchAll(/\[([^[\]]*)\]/g), (m) => m[1])]
    let node: Tree = root
    keys.forEach((key, i) => {
      if (i === keys.length - 1) {
        node[key] = value
        return
      }
      const next = node[key]
      if (typeof next !== 'object') node[key] = {}
      node = node[key] as Tree
    })
  }
  return root
}

const toNumber = (v: unknown): number | null => {
  const n = typeof v === 'string' || typeof v === 'number' ? Number(v) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

function itemsOf(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return []
  const list = Array.isArray(value) ? value : Object.values(value)
  return list.filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === 'object')
}

// Достаёт изменения этапа сделок. Принимает form-urlencoded строку или уже разобранный JSON.
export function parseAmoWebhook(body: string | Record<string, unknown>): AmoLeadStatusChange[] {
  const tree = typeof body === 'string' ? parseNestedForm(body) : body
  const leads = tree?.leads
  if (!leads || typeof leads !== 'object') return []

  const changes: AmoLeadStatusChange[] = []
  // status — смена этапа; add/update тоже несут текущий этап, если на них подписаться.
  for (const event of ['status', 'add', 'update'] as const) {
    for (const item of itemsOf((leads as Record<string, unknown>)[event])) {
      const leadId = toNumber(item.id)
      if (!leadId) continue
      changes.push({
        leadId,
        statusId: toNumber(item.status_id),
        pipelineId: toNumber(item.pipeline_id),
        oldStatusId: toNumber(item.old_status_id),
        event,
      })
    }
  }

  // Одна сделка может прийти несколько раз — оставляем последнее состояние.
  const byLead = new Map<number, AmoLeadStatusChange>()
  for (const change of changes) {
    const prev = byLead.get(change.leadId)
    if (!prev || change.event === 'status' || prev.event !== 'status')
      byLead.set(change.leadId, change)
  }
  return Array.from(byLead.values())
}

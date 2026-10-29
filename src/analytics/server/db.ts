import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { SQL } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

export const drizzleOf = (payload: Payload) => (payload.db as unknown as PostgresAdapter).drizzle

export async function queryRows<T = Record<string, unknown>>(
  payload: Payload,
  query: SQL,
): Promise<T[]> {
  const result = await drizzleOf(payload).execute(query)
  return (result as unknown as { rows: T[] }).rows
}

export const hasCollection = (payload: Payload, slug: string): boolean =>
  Boolean((payload.collections as Record<string, unknown>)[slug])

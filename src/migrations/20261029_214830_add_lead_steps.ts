import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Регистрация в два шага: отметка «заявка неполная» и хеш одноразового токена второго шага.
// Поле people.quote добавляет соседняя миграция основного сайта (общее поле «Цитата»).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "incomplete" boolean DEFAULT false;
  ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "complete_token" varchar;
  CREATE INDEX IF NOT EXISTS "leads_incomplete_idx" ON "leads" USING btree ("incomplete");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "leads_incomplete_idx";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "incomplete";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "complete_token";`)
}

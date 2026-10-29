import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "landings_locales" DROP COLUMN "pricing_payment_note";
  ALTER TABLE "_landings_v_locales" DROP COLUMN "version_pricing_payment_note";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "landings_locales" ADD COLUMN "pricing_payment_note" varchar;
  ALTER TABLE "_landings_v_locales" ADD COLUMN "version_pricing_payment_note" varchar;`)
}

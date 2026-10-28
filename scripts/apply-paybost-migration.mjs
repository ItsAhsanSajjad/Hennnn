/**
 * Apply the Paybost online-payment migration to Neon over the WebSocket driver
 * (port 443), because Prisma `migrate deploy` needs direct TCP 5432 which
 * Namecheap shared hosting and many networks block.
 *
 * Every statement is idempotent (IF NOT EXISTS / guarded), so re-running is safe.
 * Run with DATABASE_URL set, or with .env present (loaded automatically):
 *
 *   node scripts/apply-paybost-migration.mjs
 */
import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (put it in .env or the environment).");
  process.exit(1);
}

// Same order as prisma/migrations/202607220001_paybost_online_payments/migration.sql,
// but each statement runs standalone (autocommit) so ALTER TYPE ADD VALUE is allowed.
const statements = [
  `DO $$ BEGIN CREATE TYPE "PaymentMethod" AS ENUM ('MANUAL','PAYBOST'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `ALTER TYPE "PaymentSubmissionStatus" ADD VALUE IF NOT EXISTS 'PENDING';`,
  `ALTER TABLE "PaymentSubmission" ADD COLUMN IF NOT EXISTS "method" "PaymentMethod" NOT NULL DEFAULT 'MANUAL';`,
  `ALTER TABLE "PaymentSubmission" ADD COLUMN IF NOT EXISTS "gatewayIdentifier" VARCHAR(32);`,
  `ALTER TABLE "PaymentSubmission" ADD COLUMN IF NOT EXISTS "gatewayTxnId" VARCHAR(160);`,
  `ALTER TABLE "PaymentSubmission" ADD COLUMN IF NOT EXISTS "gatewayStatus" VARCHAR(40);`,
  `ALTER TABLE "PaymentSubmission" ALTER COLUMN "paymentAccountId" DROP NOT NULL;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PaymentSubmission_gatewayIdentifier_key" ON "PaymentSubmission" ("gatewayIdentifier");`,
  `CREATE INDEX IF NOT EXISTS "PaymentSubmission_method_status_idx" ON "PaymentSubmission" ("method","status");`,
];

const host = (() => {
  try {
    return new URL(url).host;
  } catch {
    return "unknown-host";
  }
})();

const pool = new Pool({ connectionString: url });
try {
  console.log(`Applying Paybost migration to ${host} ...`);
  for (const sql of statements) {
    await pool.query(sql);
    console.log("  ok:", sql.slice(0, 62));
  }
  const cols = await pool.query(
    `select column_name, is_nullable from information_schema.columns
     where table_name='PaymentSubmission'
       and column_name in ('method','gatewayIdentifier','gatewayTxnId','gatewayStatus','paymentAccountId')
     order by column_name`,
  );
  const statuses = await pool.query(
    `select e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid
     where t.typname='PaymentSubmissionStatus' order by e.enumsortorder`,
  );
  console.log("\nPaymentSubmission gateway columns:");
  for (const r of cols.rows) console.log(`  ${r.column_name} (nullable=${r.is_nullable})`);
  console.log("Statuses:", statuses.rows.map((r) => r.enumlabel).join(", "));
  console.log("\nDone. Database is ready for manual + Paybost payments.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

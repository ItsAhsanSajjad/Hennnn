/**
 * Apply the "allow free referral orders" migration to Neon over the WebSocket
 * driver (port 443), since Prisma `migrate deploy` needs direct TCP 5432 which
 * Namecheap shared hosting / many networks block.
 *
 * Idempotent (DROP IF EXISTS + ADD), so re-running is safe. Relaxing > 0 to >= 0
 * cannot fail against existing rows. Run with .env present:
 *
 *   node scripts/apply-order-constraint-fix.mjs
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

const statements = [
  `ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS "PurchaseOrder_positive_values_check";`,
  `ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_positive_values_check" CHECK (
      "quantity" > 0 AND
      "unitPricePaisa" >= 0 AND
      "totalAmountPaisa" = ("quantity"::bigint * "unitPricePaisa") AND
      "dailyEggUnitsSnapshot" > 0 AND
      "maximumEggUnitsSnapshot" > 0 AND
      "validityDaysSnapshot" > 0
  );`,
];

const pool = new Pool({ connectionString: url });
try {
  for (const sql of statements) {
    await pool.query(sql);
    console.log("  ok:", sql.replace(/\s+/g, " ").slice(0, 64));
  }
  const check = await pool.query(
    `select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'PurchaseOrder_positive_values_check'`,
  );
  console.log("\nPurchaseOrder_positive_values_check is now:\n ", check.rows[0]?.def);
  console.log("\nDone. Free referral-reward orders can now be created.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

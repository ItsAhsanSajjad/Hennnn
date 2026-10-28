import { config } from "dotenv";
config();
import pg from "pg";

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log("Checking and altering PaymentAccount table...");
  await client.query(`
    ALTER TABLE "PaymentAccount" 
    ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(120),
    ADD COLUMN IF NOT EXISTS "iban" VARCHAR(40),
    ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT true;
  `);
  console.log("✓ PaymentAccount columns verified/added.");

  // Check if JazzCash account already exists
  const checkRes = await client.query(`SELECT id FROM "PaymentAccount" WHERE provider = 'JAZZCASH'`);
  if (checkRes.rowCount === 0) {
    console.log("Creating default active JAZZCASH account...");
    const adminRes = await client.query(`SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1`);
    const adminId = adminRes.rows[0]?.id || null;

    await client.query(`
      INSERT INTO "PaymentAccount" (
        id, provider, "accountTitle", "accountIdentifierProtected", "accountIdentifierLastFour",
        "bankName", "iban", "isVerified", instructions, "isActive", "displayOrder",
        "createdByUserId", "updatedByUserId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), 'JAZZCASH', 'GrowMeta Egg Official JazzCash', '03**-***-0000', '0000',
        'JazzCash / Mobilink Microfinance Bank', NULL, true,
        'Send the exact deposit amount from your JazzCash App or *786# menu to this official account and upload a clear screenshot of the receipt.',
        true, 15, $1, $1, now(), now()
      )
    `, [adminId]);
    console.log("✓ JAZZCASH account seeded and active.");
  } else {
    console.log("✓ JAZZCASH account already exists in DB.");
  }

  // Also update Easypaisa and Bank Transfer to ensure displayOrder is clean (10, 15, 20) and isVerified is true
  await client.query(`UPDATE "PaymentAccount" SET "isVerified" = true WHERE "isVerified" IS NULL`);

  const allRes = await client.query(`SELECT id, provider, "accountTitle", "accountIdentifierProtected", "bankName", "iban", "isVerified", "isActive", "displayOrder" FROM "PaymentAccount" ORDER BY "displayOrder" ASC`);
  console.log("\nAll Current Payment Accounts:");
  console.table(allRes.rows);

  await client.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

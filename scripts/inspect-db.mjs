import { config } from "dotenv";
config();
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const res = await client.query('SELECT "id", "provider", "accountTitle", "accountIdentifierProtected", "isActive", "displayOrder", "archivedAt" FROM "PaymentAccount"');
console.log("Payment Accounts in DB:", res.rows);
await client.end();

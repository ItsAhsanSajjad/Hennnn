/**
 * List admin accounts, or reset one admin's password — over the Neon WebSocket
 * driver (works on hosts that block TCP 5432). Reads DATABASE_URL from .env.
 *
 *   node scripts/reset-admin-password.mjs                       # list admin/finance users
 *   node scripts/reset-admin-password.mjs <username> <password> # set a new password
 *
 * The new hash is standard argon2id (same as the app), so the account can log in
 * immediately at /admin-login. Change the password again from the UI afterwards.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { argon2id } from "hash-wasm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (put it in .env or the environment).");
  process.exit(1);
}

const [, , username, newPassword] = process.argv;
const pool = new Pool({ connectionString: url });

try {
  if (!username) {
    const res = await pool.query(
      `select username, "phoneE164", role, status
       from "User" where role in ('ADMIN','SUPER_ADMIN','FINANCE')
       order by role desc, username`,
    );
    if (res.rowCount === 0) {
      console.log("No admin/finance accounts found.");
    } else {
      console.log("Admin / finance accounts:");
      for (const r of res.rows) {
        console.log(`  ${r.username}  |  role=${r.role}  |  phone=${r.phoneE164}  |  status=${r.status}`);
      }
    }
    console.log("\nTo reset one:  node scripts/reset-admin-password.mjs <username> '<newPassword>'");
  } else {
    if (!newPassword || newPassword.length < 8) {
      console.error("Provide a new password of at least 8 characters.");
      process.exit(1);
    }
    const hash = await argon2id({
      password: newPassword,
      salt: randomBytes(16),
      parallelism: 1,
      iterations: 2,
      memorySize: 19_456,
      hashLength: 32,
      outputType: "encoded",
    });
    const res = await pool.query(
      `update "User" set "passwordHash"=$1, status='ACTIVE', "updatedAt"=now()
       where username ilike $2 or "usernameNormalized" ilike $2`,
      [hash, username],
    );
    if (res.rowCount === 0) {
      console.log(`No user matched "${username}". Run without arguments to list accounts.`);
    } else {
      console.log(`Password reset for "${username}" (${res.rowCount} row). Log in at /admin-login.`);
    }
  }
} catch (error) {
  console.error("Failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

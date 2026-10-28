import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { argon2Verify } from "hash-wasm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function check() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT username, "passwordHash", role, status FROM "User" WHERE username='superadmin'`);
    console.log("User in DB:", res.rows[0]);
    if (res.rows[0]) {
      const isMatch = await argon2Verify({
        password: "ChangeMeAdmin123!",
        hash: res.rows[0].passwordHash,
      });
      console.log("argon2Verify with ChangeMeAdmin123!:", isMatch);
    }
  } finally {
    await pool.end();
  }
}

check();

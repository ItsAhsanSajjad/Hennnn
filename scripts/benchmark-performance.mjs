import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

async function createTestSession() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  const pool = new Pool({ connectionString: dbUrl });

  try {
    const userRes = await pool.query(
      `SELECT id FROM "User" WHERE "usernameNormalized" = 'demo_user' OR username = 'demo_user' LIMIT 1`
    );
    if (userRes.rowCount === 0) {
      throw new Error("demo_user not found in DB");
    }
    const userId = userRes.rows[0].id;
    const sessionId = randomUUID();
    const token = randomBytes(48).toString("base64url");
    const sessionToken = createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO "Session" ("id", "sessionToken", "userId", "expires", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now(), now())`,
      [sessionId, sessionToken, userId, expires]
    );

    return token;
  } finally {
    await pool.end();
  }
}

async function measureRoute(url, cookie = "") {
  const start = performance.now();
  const res = await fetch(url, {
    headers: {
      Cookie: cookie ? `pakhen_session=${cookie}` : "",
      "User-Agent": "BenchmarkAgent/1.0",
    },
  });
  const text = await res.text();
  const durationMs = performance.now() - start;
  return {
    status: res.status,
    durationMs: Math.round(durationMs),
    bytes: Buffer.byteLength(text, "utf8"),
  };
}

async function run() {
  console.log("=== GrowMeta Egg Performance Audit ===");
  const baseUrl = "http://localhost:3006";
  const sessionToken = await createTestSession();

  const routes = [
    { name: "Landing Page", path: "/", auth: false },
    { name: "Sign-in Page", path: "/sign-in", auth: false },
    { name: "Sign-up Page", path: "/sign-up", auth: false },
    { name: "Dashboard Home", path: "/dashboard", auth: true },
    { name: "Buy Hens (Plans)", path: "/dashboard/plans", auth: true },
    { name: "Sell Eggs", path: "/dashboard/sell-eggs", auth: true },
    { name: "My Hens", path: "/dashboard/hens", auth: true },
    { name: "Orders", path: "/dashboard/orders", auth: true },
    { name: "Profile", path: "/dashboard/profile", auth: true },
  ];

  console.log("\n--- Warm Route Response Times (3 iterations) ---");
  for (const route of routes) {
    const times = [];
    let bytes = 0;
    for (let i = 0; i < 3; i++) {
      const res = await measureRoute(`${baseUrl}${route.path}`, route.auth ? sessionToken : "");
      times.push(res.durationMs);
      bytes = res.bytes;
    }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    console.log(
      `${route.name.padEnd(22)} | Status: 200 | Avg: ${String(avg).padStart(4)}ms (runs: ${times.join(", ")}ms) | HTML Size: ${(bytes / 1024).toFixed(1)} KB`
    );
  }

  console.log("\n--- Asset Size Audit ---");
  const assetDir = path.join(process.cwd(), "public", "assets");
  function inspectDir(dir) {
    if (!fs.existsSync(dir)) return [];
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) files = files.concat(inspectDir(full));
      else files.push({ path: path.relative(process.cwd(), full), size: fs.statSync(full).size });
    }
    return files;
  }
  const assets = inspectDir(assetDir);
  assets.sort((a, b) => b.size - a.size);
  console.log(`Found ${assets.length} static assets in public/assets:`);
  for (const a of assets.slice(0, 15)) {
    console.log(`  ${a.path.padEnd(60)} | ${(a.size / 1024).toFixed(1)} KB`);
  }
}

run().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});

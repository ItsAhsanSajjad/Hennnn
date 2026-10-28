import { chromium } from "@playwright/test";
import path from "node:path";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const artifactDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";

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

async function run() {
  console.log("Launching browser for comprehensive module testing...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const sessionCookieValue = await createTestSession();
  const baseUrl = "http://localhost:3006";

  const routes = [
    { name: "rewards", path: "/dashboard/rewards" },
    { name: "prizes", path: "/dashboard/prizes" },
    { name: "team", path: "/dashboard/team" },
    { name: "deposits", path: "/dashboard/deposits" },
    { name: "withdrawals", path: "/dashboard/withdrawals" },
    { name: "profit-egg", path: "/dashboard/profit-egg" },
    { name: "refer-bonus", path: "/dashboard/refer-bonus" },
    { name: "app-download", path: "/dashboard/app-download" },
    { name: "legal", path: "/dashboard/legal" },
  ];

  const viewports = [
    { label: "desktop-1440", width: 1440, height: 900 },
    { label: "mobile-390", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\n=== Testing Viewport: ${vp.label} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });

    await context.addCookies([
      {
        name: "pakhen_session",
        value: sessionCookieValue,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });

    for (const route of routes) {
      console.log(`Navigating to ${route.path}...`);
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      const shotPath = path.join(artifactDir, `module-${route.name}-${vp.label}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`Saved screenshot: ${shotPath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log("\nAll module tests and screenshots completed successfully!");
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

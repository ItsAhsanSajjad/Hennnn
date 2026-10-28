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
  console.log("Launching browser for Profit History page visual verification...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const sessionCookieValue = await createTestSession();
  const baseUrl = "http://localhost:3006";

  const viewports = [
    { label: "desktop-1440", width: 1440, height: 900 },
    { label: "tablet-768", width: 768, height: 1024 },
    { label: "mobile-390", width: 390, height: 844 },
    { label: "mobile-320", width: 320, height: 568 },
  ];

  for (const vp of viewports) {
    console.log(`\nTesting Profit History page @ ${vp.label} (${vp.width}x${vp.height})...`);
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

    await page.goto(`${baseUrl}/dashboard/profit-egg`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const shotPath = path.join(artifactDir, `profit-history-redesign-${vp.label}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Saved screenshot: ${shotPath}`);

    await context.close();
  }

  // Details modal test on Desktop
  console.log("\nTesting Details Modal on Desktop...");
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
  await page.goto(`${baseUrl}/dashboard/profit-egg`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  const detailsBtn = page.locator('button:has-text("Details")').first();
  if (await detailsBtn.count() > 0) {
    await detailsBtn.click();
    await page.waitForTimeout(400);
    const modalShot = path.join(artifactDir, "profit-history-modal-desktop.png");
    await page.screenshot({ path: modalShot, fullPage: false });
    console.log(`Saved modal screenshot: ${modalShot}`);
  }

  await browser.close();
  console.log("\nProfit History redesign visual verification completed!");
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

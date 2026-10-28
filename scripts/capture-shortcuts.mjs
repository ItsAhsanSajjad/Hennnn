import { chromium } from "@playwright/test";
import fs from "node:fs";
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
  console.log("Launching browser for dashboard capture...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const context = await browser.newContext();
  const sessionCookieValue = await createTestSession();
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
  const baseUrl = "http://localhost:3006";

  const viewports = [
    { label: "desktop-1440", width: 1440, height: 900 },
    { label: "tablet-768", width: 768, height: 1024 },
    { label: "mobile-430", width: 430, height: 932 },
    { label: "mobile-390", width: 390, height: 844 },
    { label: "mobile-375", width: 375, height: 812 },
    { label: "mobile-360", width: 360, height: 800 },
    { label: "mobile-320", width: 320, height: 568 },
  ];

  for (const vp of viewports) {
    await page.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });

    console.log(`Capturing dashboard @ ${vp.label} (${vp.width}x${vp.height})...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const filename = `dashboard-shortcuts-${vp.label}.png`;
    const brainPath = path.join(artifactDir, filename);

    // Capture full page
    await page.screenshot({ path: brainPath, fullPage: true });

    // Capture top dashboard area (mobile header + welcome + member profile card)
    const dashboardTopPath = path.join(artifactDir, `dashboard-top-${vp.label}.png`);
    await page.screenshot({
      path: dashboardTopPath,
      clip: { x: 0, y: 0, width: vp.width, height: 420 },
    });
    console.log(`Saved dashboard top screenshot to ${dashboardTopPath}`);

    // Also take a screenshot focused on the farm shortcuts section
    const shortcutsSection = page.locator('section[aria-label="Farm Shortcuts"]');
    if (await shortcutsSection.isVisible()) {
      const sectionBrainPath = path.join(artifactDir, `dashboard-shortcuts-only-${vp.label}.png`);
      await shortcutsSection.screenshot({ path: sectionBrainPath });
      console.log(`Saved shortcut element to ${sectionBrainPath}`);
    }

    // Also capture inner page /dashboard/hens to inspect top dock
    await page.goto(`${baseUrl}/dashboard/hens`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const topDockHeader = page.locator("header.sticky.top-3");
    if (await topDockHeader.isVisible()) {
      const topdockBrainPath = path.join(artifactDir, `topdock-only-${vp.label}.png`);
      await topDockHeader.screenshot({ path: topdockBrainPath });
      console.log(`Saved topdock element to ${topdockBrainPath}`);
    }
    const topBrainPath = path.join(artifactDir, `hens-top-${vp.label}.png`);
    await page.screenshot({
      path: topBrainPath,
      clip: { x: 0, y: 0, width: vp.width, height: 260 },
    });
    console.log(`Saved top section screenshot to ${topBrainPath}`);
  }

  await browser.close();
  console.log("Capture completed!");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

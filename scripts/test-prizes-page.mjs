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
  console.log("Launching browser for Prizes page testing...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const sessionCookieValue = await createTestSession();

  const viewports = [
    { label: "desktop-1440", width: 1440, height: 900 },
    { label: "tablet-768", width: 768, height: 1024 },
    { label: "mobile-430", width: 430, height: 932 },
    { label: "mobile-390", width: 390, height: 844 },
    { label: "mobile-360", width: 360, height: 800 },
    { label: "mobile-320", width: 320, height: 568 },
  ];

  for (const vp of viewports) {
    console.log(`\nTesting & capturing Prizes page @ ${vp.label} (${vp.width}x${vp.height})...`);
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
    const baseUrl = "http://localhost:3006";

    await page.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });

    await page.goto(`${baseUrl}/dashboard/prizes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Capture full page
    const fullPath = path.join(artifactDir, `prizes-${vp.label}-full.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`Saved full page screenshot to ${fullPath}`);

    // If 390px, test category filters and modal
    if (vp.label === "mobile-390") {
      console.log("Testing Electronics filter...");
      const electronicsBtn = page.getByRole("button", { name: "Electronics" });
      await electronicsBtn.click({ timeout: 5000 });
      await page.waitForTimeout(400);

      const electronicsPath = path.join(artifactDir, `prizes-filter-electronics.png`);
      await page.screenshot({ path: electronicsPath, fullPage: true });
      console.log(`Saved electronics filter screenshot`);

      console.log("Testing Vehicles filter...");
      const vehiclesBtn = page.getByRole("button", { name: "Vehicles" });
      await vehiclesBtn.click({ timeout: 5000 });
      await page.waitForTimeout(400);

      const vehiclesPath = path.join(artifactDir, `prizes-filter-vehicles.png`);
      await page.screenshot({ path: vehiclesPath, fullPage: true });
      console.log(`Saved vehicles filter screenshot`);

      console.log("Resetting to All Prizes...");
      const allBtn = page.getByRole("button", { name: "All Prizes" });
      await allBtn.click({ timeout: 5000 });
      await page.waitForTimeout(400);

      console.log("Opening Laptop Prize Details Modal...");
      const detailsBtn = page.getByRole("button", { name: "Prize Details" }).first();
      await detailsBtn.click({ timeout: 5000 });
      await page.waitForTimeout(500);

      const modal = page.locator('div[role="dialog"]');
      const modalVisible = await modal.isVisible();
      console.log(`Modal visible: ${modalVisible}`);

      const modalPath = path.join(artifactDir, `prizes-details-modal.png`);
      await page.screenshot({ path: modalPath, fullPage: false });
      console.log(`Saved prize details modal screenshot`);
    }

    await context.close();
  }

  await browser.close();
  console.log("\nAll Prizes page tests and screenshots completed!");
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

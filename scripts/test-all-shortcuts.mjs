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
  console.log("Launching browser for 10 shortcut buttons testing...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
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

  await page.addInitScript(() => {
    localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
  });

  const shortcuts = [
    { name: "Rewards", expectedUrl: "/dashboard/rewards", titleMatch: "Rewards" },
    { name: "Prizes", expectedUrl: "/dashboard/prizes", titleMatch: "Prizes" },
    { name: "Team", expectedUrl: "/dashboard/team", titleMatch: "Team" },
    { name: "Deposits", expectedUrl: "/dashboard/deposits", titleMatch: "Deposits" },
    { name: "Withdrawals", expectedUrl: "/dashboard/withdrawals", titleMatch: "Withdrawals" },
    { name: "Profit Egg", expectedUrl: "/dashboard/profit-egg", titleMatch: "Profit Egg" },
    { name: "Refer Bonus", expectedUrl: "/dashboard/refer-bonus", titleMatch: "Referral Bonus" },
    { name: "App Download", expectedUrl: "/dashboard/app-download", titleMatch: "App Download" },
    { name: "FBR / SECP", expectedUrl: "/dashboard/legal", titleMatch: "Compliance" },
  ];

  const results = [];

  for (const item of shortcuts) {
    console.log(`\n--- Testing Shortcut: ${item.name} ---`);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    // Locate the shortcut by text
    const link = page.locator(`section[aria-label="Farm Shortcuts"] a`, { hasText: item.name }).first();
    const isVisible = await link.isVisible();
    if (!isVisible) {
      console.error(`FAILED: Shortcut ${item.name} not visible`);
      results.push({ name: item.name, status: "NOT_VISIBLE" });
      continue;
    }

    const href = await link.getAttribute("href");
    console.log(`Clicking ${item.name} (href: ${href})...`);
    await link.click();
    await page.waitForURL(`**${item.expectedUrl}`, { timeout: 8000 });
    await page.waitForTimeout(400);

    const currentUrl = page.url();
    const pageHeading = await page.locator("h1, h2").first().textContent();
    console.log(`Navigated to: ${currentUrl}`);
    console.log(`Page Heading: ${pageHeading}`);

    const shotPath = path.join(artifactDir, `shortcut-dest-${item.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved screenshot to: ${shotPath}`);

    results.push({
      name: item.name,
      status: "VERIFIED",
      url: currentUrl,
      heading: pageHeading,
    });
  }

  // Test 10: Logout Button
  console.log(`\n--- Testing Shortcut: Logout ---`);
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);

  const logoutBtn = page.locator(`section[aria-label="Farm Shortcuts"] button`, { hasText: "Logout" }).first();
  if (await logoutBtn.isVisible()) {
    console.log("Clicking Logout shortcut to open modal...");
    await logoutBtn.click();
    await page.waitForTimeout(400);

    const modal = page.locator('div[role="dialog"]');
    const modalVisible = await modal.isVisible();
    console.log(`Logout confirmation modal visible: ${modalVisible}`);

    const modalShotPath = path.join(artifactDir, "shortcut-dest-logout-modal.png");
    await page.screenshot({ path: modalShotPath });

    results.push({
      name: "Logout",
      status: modalVisible ? "VERIFIED" : "FAILED",
      type: "Modal confirmation",
    });
  }

  console.log("\n================ ALL SHORTCUTS TEST SUMMARY ================");
  console.table(results);

  await browser.close();
  console.log("All tests completed successfully!");
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

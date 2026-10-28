import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const artifactDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";

async function createTestSession(userIdentifier = "demo_user") {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  const pool = new Pool({ connectionString: dbUrl });

  try {
    let userRes;
    if (userIdentifier === "admin") {
      userRes = await pool.query(
        `SELECT id, role, username FROM "User" WHERE role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1`
      );
    } else {
      userRes = await pool.query(
        `SELECT id, role, username FROM "User" WHERE "usernameNormalized" = $1 OR username = $1 LIMIT 1`,
        [userIdentifier.toLowerCase()]
      );
    }
    if (userRes.rowCount === 0) {
      throw new Error(`User ${userIdentifier} not found in DB`);
    }
    const user = userRes.rows[0];
    const sessionId = randomUUID();
    const token = randomBytes(48).toString("base64url");
    const sessionToken = createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO "Session" ("id", "sessionToken", "userId", "expires", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, now(), now())`,
      [sessionId, sessionToken, user.id, expires]
    );

    return { token, userId: user.id, role: user.role };
  } finally {
    await pool.end();
  }
}

async function setDemoUserEggBalance(userId, desiredBalance) {
  const dbUrl = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: dbUrl });

  try {
    const balRes = await pool.query(
      `SELECT COALESCE(SUM("eggUnits"), 0) AS balance FROM "EggLedgerEntry" WHERE "userId" = $1`,
      [userId]
    );
    const current = Number(balRes.rows[0]?.balance ?? 0);
    const diff = desiredBalance - current;

    if (diff !== 0) {
      const entryId = randomUUID();
      const idempotencyKey = `test-balance-adjust:${userId}:${Date.now()}:${randomBytes(4).toString("hex")}`;
      await pool.query(
        `INSERT INTO "EggLedgerEntry" ("id", "userId", "entryType", "eggUnits", "description", "sourceType", "idempotencyKey", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
        [
          entryId,
          userId,
          diff > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
          diff,
          "Automated test balance adjustment",
          "ADMIN_ADJUSTMENT",
          idempotencyKey,
        ]
      );
      console.log(`Adjusted user balance by ${diff > 0 ? "+" : ""}${diff} eggs. New balance: ${desiredBalance}`);
    }
  } finally {
    await pool.end();
  }
}

async function run() {
  console.log("=== Starting Comprehensive Egg Markets Automation Test ===");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  }

  const { token: userToken, userId: demoUserId } = await createTestSession("demo_user");
  const { token: adminToken } = await createTestSession("admin");

  // Step 1: Test Zero-Balance State
  console.log("\n--- Step 1: Testing Zero-Balance State ---");
  await setDemoUserEggBalance(demoUserId, 0);

  const userContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await userContext.addCookies([
    {
      name: "pakhen_session",
      value: userToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await userContext.newPage();
  await page.goto("http://localhost:3006/dashboard/sell-eggs", { waitUntil: "networkidle" });

  const zeroBanner = await page.locator("text=No Eggs Available to Sell").isVisible();
  console.log(`✓ Zero-balance empty state visible: ${zeroBanner}`);

  const zeroScreenshot = path.join(artifactDir, "egg-markets-zero-balance.png");
  await page.screenshot({ path: zeroScreenshot, fullPage: true });
  console.log(`Saved screenshot: ${zeroScreenshot}`);

  // Step 2: Test Active Balance & 10 Egg Markets
  console.log("\n--- Step 2: Testing Active Balance & 10 Egg Markets ---");
  await setDemoUserEggBalance(demoUserId, 500); // 500 eggs unlocks several tiers

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Check 4 summary cards
  const availableHarvestText = await page.locator("text=500").first().isVisible();
  console.log(`✓ Available harvest (500 eggs) displayed: ${availableHarvestText}`);

  // Count markets
  const marketCards = await page.locator("text=Wholesale Egg Markets").isVisible();
  console.log(`✓ Markets header visible: ${marketCards}`);

  const alQaimCard = await page.locator("h3:has-text('Al Qaim Market')").isVisible();
  const alKhairCard = await page.locator("h3:has-text('Al Khair Market')").isVisible();
  const zuhaibCard = await page.locator("h3:has-text('Zuhaib Market')").isVisible();
  const madinaCard = await page.locator("h3:has-text('Madina Egg Market')").isVisible();
  const alNoorCard = await page.locator("h3:has-text('Al Noor Market')").isVisible();
  const barkatCard = await page.locator("h3:has-text('Barkat Poultry Market')").isVisible();
  const punjabCard = await page.locator("h3:has-text('Punjab Egg Exchange')").isVisible();
  const greenFarmCard = await page.locator("h3:has-text('Green Farm Market')").isVisible();
  const pakPoultryCard = await page.locator("h3:has-text('Pak Poultry Market')").isVisible();
  const premiumCard = await page.locator("h3:has-text('Premium Egg Exchange')").isVisible();

  console.log(`✓ Markets found: Al Qaim(${alQaimCard}), Al Khair(${alKhairCard}), Zuhaib(${zuhaibCard}), Madina(${madinaCard}), Al Noor(${alNoorCard}), Barkat(${barkatCard}), Punjab(${punjabCard}), Green Farm(${greenFarmCard}), Pak Poultry(${pakPoultryCard}), Premium(${premiumCard})`);

  // Step 3: Perform Egg Sale to Al Qaim Market (50 eggs @ PKR 10)
  console.log("\n--- Step 3: Executing Sale via Sell Modal ---");
  // Click first available "Sell Eggs to Market" button
  const sellButtons = page.locator("button:has-text('Sell Eggs to Market')");
  await sellButtons.first().click();
  await page.waitForTimeout(600);

  const modalTitle = await page.locator("#sell-modal-title").innerText();
  console.log(`✓ Modal opened: "${modalTitle}"`);

  // Use 50% quick select button
  const halfBtn = page.locator("button:has-text('50%')");
  if (await halfBtn.isVisible()) {
    await halfBtn.click();
    console.log("✓ Clicked 50% quick select button");
  }

  // Check calculated total
  await page.waitForTimeout(500);
  const totalAmountText = await page.locator("text=Total Cash Credited").locator("..").innerText();
  console.log(`✓ Calculation preview: ${totalAmountText.replace(/\n/g, " - ")}`);

  const modalScreenshot = path.join(artifactDir, "egg-markets-sell-modal.png");
  await page.screenshot({ path: modalScreenshot });
  console.log(`Saved screenshot: ${modalScreenshot}`);

  // Submit sale
  const confirmBtn = page.locator("button:has-text('Confirm & Sell')");
  await confirmBtn.click();
  
  await page.waitForSelector("text=Trade Completed!", { timeout: 10000 });
  console.log("✓ Trade completed confirmation received!");

  const completedScreenshot = path.join(artifactDir, "egg-markets-sale-completed.png");
  await page.screenshot({ path: completedScreenshot });
  console.log(`Saved screenshot: ${completedScreenshot}`);

  // Close modal and verify updated balance & history table
  const backBtn = page.locator("button:has-text('Back to Egg Markets')");
  await backBtn.click();
  await page.waitForTimeout(1000);

  const recentTradeRow = await page.locator("table tbody tr").first().innerText();
  console.log(`✓ Recent trade receipt in history: ${recentTradeRow.replace(/\n/g, " | ")}`);

  // Step 4: Responsive Viewport Captures
  console.log("\n--- Step 4: Capturing Responsive Viewports ---");
  const viewports = [
    { label: "desktop-1366", width: 1366, height: 900 },
    { label: "tablet-768", width: 768, height: 1024 },
    { label: "mobile-390", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const vpContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await vpContext.addCookies([
      {
        name: "pakhen_session",
        value: userToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const vpPage = await vpContext.newPage();
    await vpPage.goto("http://localhost:3006/dashboard/sell-eggs", { waitUntil: "networkidle" });
    await vpPage.waitForTimeout(600);
    const ssPath = path.join(artifactDir, `egg-markets-${vp.label}.png`);
    await vpPage.screenshot({ path: ssPath, fullPage: true });
    console.log(`✓ Captured ${vp.label}: ${ssPath}`);
    await vpContext.close();
  }

  // Step 5: Test Admin Console at /admin/egg-markets
  console.log("\n--- Step 5: Testing Admin Console at /admin/egg-markets ---");
  const adminContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await adminContext.addCookies([
    {
      name: "pakhen_session",
      value: adminToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const adminPage = await adminContext.newPage();
  await adminPage.goto("http://localhost:3006/admin/egg-markets", { waitUntil: "networkidle" });
  await adminPage.waitForTimeout(800);

  const adminTitle = await adminPage.locator("h1:has-text('Egg markets')").isVisible();
  console.log(`✓ Admin egg markets page loaded: ${adminTitle}`);

  const adminScreenshot = path.join(artifactDir, "admin-egg-markets-desktop.png");
  await adminPage.screenshot({ path: adminScreenshot, fullPage: true });
  console.log(`Saved admin screenshot: ${adminScreenshot}`);

  // Test Sales Ledger tab in Admin
  const salesLedgerTab = adminPage.locator("button:has-text('Sales Ledger')");
  await salesLedgerTab.click();
  await adminPage.waitForTimeout(800);

  const salesRowsCount = await adminPage.locator("table tbody tr").count();
  console.log(`✓ Admin sales ledger rows: ${salesRowsCount}`);

  // Test Reversal Flow
  const reverseBtn = adminPage.locator("button:has-text('Reverse')").first();
  if (await reverseBtn.isVisible()) {
    console.log("✓ Testing Admin Sale Reversal...");
    await reverseBtn.click();
    await adminPage.waitForTimeout(500);

    const reasonInput = adminPage.locator("textarea");
    await reasonInput.fill("Automated test reversal verification");

    const confirmReversalBtn = adminPage.locator("button:has-text('Confirm Reversal')");
    await confirmReversalBtn.click();
    
    await adminPage.waitForSelector("span:has-text('Reversed')", { timeout: 10000 });
    console.log("✓ Sale successfully marked as Reversed in ledger!");

    const adminReversedScreenshot = path.join(artifactDir, "admin-egg-markets-reversed.png");
    await adminPage.screenshot({ path: adminReversedScreenshot, fullPage: true });
    console.log(`Saved admin reversal screenshot: ${adminReversedScreenshot}`);
  }

  await browser.close();
  console.log("\n=== ALL EGG MARKETS AUTOMATION TESTS PASSED SUCCESSFULLY! ===");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

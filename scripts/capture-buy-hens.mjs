import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const artifactsDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";

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

    let orderRes = await pool.query(
      `SELECT "orderReference", id FROM "PurchaseOrder" WHERE "userId" = $1 AND "status" = 'AWAITING_PAYMENT' ORDER BY "createdAt" DESC LIMIT 1`,
      [userId]
    );
    let orderRef = orderRes.rows[0]?.orderReference;
    if (!orderRef) {
      const planRes = await pool.query(
        `SELECT id, name, code, "pricePaisa", "dailyEggUnits", "maximumEggUnits", "validityDays" FROM "HenPlan" WHERE "isActive" = true LIMIT 1`
      );
      const plan = planRes.rows[0];
      const orderId = randomUUID();
      orderRef = `PKH-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
      const due = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO "PurchaseOrder" ("id", "orderReference", "userId", "henPlanId", "planNameSnapshot", "planCodeSnapshot", "unitPricePaisa", "quantity", "totalAmountPaisa", "dailyEggUnitsSnapshot", "maximumEggUnitsSnapshot", "validityDaysSnapshot", "termsVersionSnapshot", "status", "paymentDueAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $7, $8, $9, $10, 'v1.0', 'AWAITING_PAYMENT', $11, now(), now())`,
        [
          orderId,
          orderRef,
          userId,
          plan.id,
          plan.name,
          plan.code,
          plan.pricePaisa,
          plan.dailyEggUnits,
          plan.maximumEggUnits,
          plan.validityDays,
          due,
        ]
      );
    }

    return { token, orderRef };
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log("Launching browser to capture Buy Hens page across viewports...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const { token: sessionToken, orderRef } = await createTestSession();
  console.log("Using orderReference:", orderRef);

  const viewports = [
    { name: "mobile-320", width: 320, height: 568 },
    { name: "mobile-360", width: 360, height: 800 },
    { name: "mobile-390", width: 390, height: 844 },
    { name: "mobile-430", width: 430, height: 932 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "desktop-1440", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    await context.addCookies([
      {
        name: "pakhen_session",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    const page = await context.newPage();
    console.log(`Navigating to Buy Hens @ ${vp.name} (${vp.width}x${vp.height})...`);
    await page.goto("http://localhost:3006/dashboard/plans", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Capture initial page
    const initialShot = path.join(artifactsDir, `buy-hens-page-${vp.name}.png`);
    await page.screenshot({ path: initialShot, fullPage: false });
    console.log(`Saved initial page shot to: ${initialShot}`);

    // If 390px or 1440px, also click "Buy Hens" to capture checkout modal
    if (vp.name === "mobile-390" || vp.name === "desktop-1440") {
      const buyHensBtn = page.getByRole("button", { name: "Buy Hens" });
      if (await buyHensBtn.count() > 0) {
        await buyHensBtn.first().click();
        await page.waitForTimeout(300);

        const modalShot = path.join(artifactsDir, `buy-hens-checkout-step1-${vp.name}.png`);
        await page.screenshot({ path: modalShot, fullPage: false });
        console.log(`Saved checkout step 1 shot to: ${modalShot}`);

        const continueBtn = page.getByRole("button", { name: /Continue to Payment Method/i });
        if (await continueBtn.count() > 0) {
          await continueBtn.click();
          await page.waitForTimeout(300);
          const modalStep2Shot = path.join(artifactsDir, `buy-hens-checkout-step2-${vp.name}.png`);
          await page.screenshot({ path: modalStep2Shot, fullPage: false });
          console.log(`Saved checkout step 2 shot to: ${modalStep2Shot}`);
        }
      }
    }

    // Now capture the Order Details / Payment page
    if (orderRef) {
      const orderUrl = `http://localhost:3006/dashboard/orders/${orderRef}`;
      console.log(`Navigating to ${orderUrl} @ ${vp.name}...`);
      await page.goto(orderUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const orderShot = path.join(artifactsDir, `order-payment-${vp.name}.png`);
      await page.screenshot({ path: orderShot, fullPage: true });
      console.log(`Saved order payment shot to: ${orderShot}`);

      if (vp.name === "desktop-1440" || vp.name === "mobile-390") {
        await page.goto(`${orderUrl}?pay=success`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);
        const successShot = path.join(artifactsDir, `order-payment-success-${vp.name}.png`);
        await page.screenshot({ path: successShot, fullPage: true });

        await page.goto(`${orderUrl}?pay=cancel`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);
        const cancelShot = path.join(artifactsDir, `order-payment-cancel-${vp.name}.png`);
        await page.screenshot({ path: cancelShot, fullPage: true });
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("All Buy Hens and Order Payment screenshots captured successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

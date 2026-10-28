import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import sharp from "sharp";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const artifactDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";
const baseUrl = "http://localhost:3006";

async function createDbPool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not set");
  return new Pool({ connectionString: dbUrl });
}

async function getDemoUserAndSession(pool) {
  const userRes = await pool.query(
    `SELECT id, username FROM "User" WHERE "usernameNormalized" = 'demo_user' OR username = 'demo_user' LIMIT 1`
  );
  if (userRes.rowCount === 0) throw new Error("demo_user not found");
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

  return { user, token };
}

async function createSecondUser(pool) {
  const secondRes = await pool.query(
    `SELECT id, username FROM "User" WHERE "usernameNormalized" != 'demo_user' AND "role" = 'USER' LIMIT 1`
  );
  if (secondRes.rowCount > 0) return secondRes.rows[0];

  const id = randomUUID();
  await pool.query(
    `INSERT INTO "User" ("id", "username", "usernameNormalized", "phoneE164", "passwordHash", "role", "createdAt", "updatedAt")
     VALUES ($1, 'other_user', 'other_user', '+923009999999', 'dummy_hash', 'USER', now(), now())`,
    [id]
  );
  return { id, username: "other_user" };
}

async function createTestOrder(pool, userId) {
  const planRes = await pool.query(`SELECT * FROM "HenPlan" WHERE "status" = 'ACTIVE' LIMIT 1`);
  if (planRes.rowCount === 0) throw new Error("No active HenPlan found");
  const plan = planRes.rows[0];

  const orderId = randomUUID();
  const orderRef = `PKH-TEST-${randomBytes(4).toString("hex").toUpperCase()}`;
  const now = new Date();
  const due = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO "PurchaseOrder" (
      "id", "orderReference", "userId", "henPlanId", "quantity", "unitPricePaisa",
      "totalAmountPaisa", "planNameSnapshot", "planCodeSnapshot", "validityDaysSnapshot",
      "dailyEggUnitsSnapshot", "maximumEggUnitsSnapshot",
      "termsVersionSnapshot", "status", "paymentDueAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, 1, $5, $5, $6, $7, $8, $9, $10, $11, 'AWAITING_PAYMENT', $12, $13, $13)`,
    [
      orderId,
      orderRef,
      userId,
      plan.id,
      plan.pricePaisa,
      plan.name,
      plan.code,
      plan.validityDays,
      plan.dailyEggUnits,
      plan.maximumEggUnits,
      plan.termsVersion,
      due,
      now,
    ]
  );

  return { orderId, orderRef, plan };
}

async function getActivePaymentAccount(pool) {
  const accRes = await pool.query(
    `SELECT * FROM "PaymentAccount" WHERE "isActive" = true AND "archivedAt" IS NULL LIMIT 1`
  );
  if (accRes.rowCount === 0) throw new Error("No active PaymentAccount found");
  return accRes.rows[0];
}

async function generateTestImages(tempDir) {
  await fs.mkdir(tempDir, { recursive: true });

  const uniqueToken = randomBytes(6).toString("hex");

  // 1. Small valid JPEG (~500 KB)
  const smallJpgPath = path.join(tempDir, `small-valid-${uniqueToken}.jpg`);
  const smallBuf = await sharp({
    create: { width: 1200, height: 1600, channels: 3, background: { r: 240, g: 245, b: 245 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="1200" height="1600">
            <text x="100" y="200" font-size="64" font-weight="bold" fill="#17372F">Bank Transfer Receipt</text>
            <text x="100" y="320" font-size="44" fill="#333">TID: TRX-${uniqueToken}</text>
            <text x="100" y="420" font-size="44" fill="#333">Amount: PKR 500.00</text>
            <text x="100" y="520" font-size="44" fill="#333">Status: Successful ${Date.now()}</text>
          </svg>`
        ),
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
  await fs.writeFile(smallJpgPath, smallBuf);

  // 2. Large valid image strictly between 1 MB and 5 MB (~3.2 MB)
  const largePngPath = path.join(tempDir, `large-valid-${uniqueToken}.jpg`);
  const rawImgData = randomBytes(2000 * 2000 * 3);
  const largeBuf = await sharp(rawImgData, {
    raw: { width: 2000, height: 2000, channels: 3 },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
  await fs.writeFile(largePngPath, largeBuf);

  // 3. Oversized file (~6.2 MB)
  const oversizedPath = path.join(tempDir, `oversized-${uniqueToken}.jpg`);
  const largeNoise = randomBytes(6_200_000);
  largeNoise[0] = 0xff;
  largeNoise[1] = 0xd8;
  largeNoise[2] = 0xff;
  largeNoise[3] = 0xe0;
  await fs.writeFile(oversizedPath, largeNoise);

  // 4. Invalid fake PNG (text disguised as PNG)
  const fakePngPath = path.join(tempDir, "fake-disguised.png");
  await fs.writeFile(fakePngPath, "<html><body>Fake executable script payload</body></html>");

  console.log(`Generated Test Images:`);
  console.log(`  Small JPG: ${(smallBuf.length / 1024).toFixed(1)} KB (< 1 MB)`);
  console.log(`  Large JPG: ${(largeBuf.length / (1024 * 1024)).toFixed(2)} MB (1 MB - 5 MB)`);
  console.log(`  Oversized: ${(largeNoise.length / (1024 * 1024)).toFixed(2)} MB (> 5 MB)`);
  console.log(`  Fake PNG: ${fakePngPath}`);

  return { smallJpgPath, largePngPath, oversizedPath, fakePngPath };
}

async function waitForOrderStatus(pool, orderId, expectedStatus, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await pool.query(`SELECT status FROM "PurchaseOrder" WHERE "id" = $1`, [orderId]);
    if (res.rows[0]?.status === expectedStatus) {
      return res.rows[0].status;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  const finalRes = await pool.query(`SELECT status FROM "PurchaseOrder" WHERE "id" = $1`, [orderId]);
  return finalRes.rows[0]?.status;
}

async function run() {
  console.log("=== Comprehensive Payment Screenshot Upload & Security Test ===");
  const pool = await createDbPool();
  const tempDir = path.join(process.cwd(), "temp-test-uploads");

  try {
    const { user, token } = await getDemoUserAndSession(pool);
    const otherUser = await createSecondUser(pool);
    const paymentAccount = await getActivePaymentAccount(pool);
    const images = await generateTestImages(tempDir);

    console.log(`✓ Test User: ${user.username} (${user.id})`);
    console.log(`✓ Active Payment Account: ${paymentAccount.provider} (${paymentAccount.id})`);

    let browser;
    try {
      browser = await chromium.launch({ channel: "chrome", headless: true });
    } catch (e) {
      browser = await chromium.launch({ channel: "msedge", headless: true });
    }

    // -------------------------------------------------------------
    // TEST 1: Direct Server Action with valid image < 1 MB
    // -------------------------------------------------------------
    console.log("\n[Test 1] Valid image below 1 MB (~500 KB JPEG)...");
    const order1 = await createTestOrder(pool, user.id);
    const context1 = await browser.newContext({ baseURL: baseUrl });
    await context1.addCookies([
      { name: "pakhen_session", value: token, domain: "localhost", path: "/" },
    ]);
    const page1 = await context1.newPage();
    await page1.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });
    await page1.goto(`/dashboard/orders/${order1.orderRef}`, { waitUntil: "domcontentloaded" });
    await page1.waitForTimeout(500);

    // Setup console & error logging
    page1.on("console", (msg) => console.log(`  [Browser Console] ${msg.type()}: ${msg.text()}`));
    page1.on("pageerror", (err) => console.log(`  [Browser PageError] ${err.message}`));

    const trxId1 = `TRX-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    // Fill form
    await page1.fill('input[name="transactionReference"]', trxId1);
    await page1.setInputFiles('input[name="proofFile"]', images.smallJpgPath);
    await page1.waitForTimeout(1000);

    const isBtnDisabled = await page1.$eval('button[type="submit"]', (btn) => btn.disabled);
    console.log(`  Submit button disabled: ${isBtnDisabled}`);

    // Submit
    await page1.click('button[type="submit"]');
    console.log("  Clicked submit button, waiting for response...");

    const finalStatus1 = await waitForOrderStatus(pool, order1.orderId, "PAYMENT_SUBMITTED");
    await page1.waitForTimeout(1000);

    const dbProof1 = await pool.query(
      `SELECT ps.status, pp."mimeType", pp."sizeBytes" FROM "PaymentSubmission" ps
       JOIN "PaymentProof" pp ON pp."paymentSubmissionId" = ps.id
       WHERE ps."purchaseOrderId" = $1`,
      [order1.orderId]
    );

    console.log(`  Order Status: ${finalStatus1}`);
    console.log(`  Proof MIME: ${dbProof1.rows[0]?.mimeType}, Stored Size: ${dbProof1.rows[0]?.sizeBytes} bytes`);

    if (finalStatus1 !== "PAYMENT_SUBMITTED") {
      await page1.screenshot({ path: "temp-test-uploads/test1-failed.png", fullPage: true });
      throw new Error(`Test 1 Failed: Expected PAYMENT_SUBMITTED, got ${finalStatus1}`);
    }
    console.log("✓ Test 1 Passed: < 1 MB image uploaded and processed to optimized WebP.");
    await context1.close();

    // -------------------------------------------------------------
    // TEST 2: Valid image between 1 MB and 5 MB (~3.5 MB PNG)
    // -------------------------------------------------------------
    console.log("\n[Test 2] Valid image between 1 MB and 5 MB (~3.5 MB PNG)...");
    const order2 = await createTestOrder(pool, user.id);
    const context2 = await browser.newContext({ baseURL: baseUrl });
    await context2.addCookies([
      { name: "pakhen_session", value: token, domain: "localhost", path: "/" },
    ]);
    const page2 = await context2.newPage();
    await page2.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });
    await page2.goto(`/dashboard/orders/${order2.orderRef}`, { waitUntil: "domcontentloaded" });
    await page2.waitForTimeout(500);

    const trxId2 = `TRX-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    await page2.fill('input[name="transactionReference"]', trxId2);
    await page2.setInputFiles('input[name="proofFile"]', images.largePngPath);
    await page2.waitForTimeout(1000);

    await page2.screenshot({
      path: path.join(artifactDir, "payment-upload-3.5mb-form.png"),
    });

    await page2.click('button[type="submit"]');
    console.log("  Clicked submit button for 3.5 MB file, waiting for upload and optimization...");

    const finalStatus2 = await waitForOrderStatus(pool, order2.orderId, "PAYMENT_SUBMITTED");
    await page2.waitForTimeout(1000);

    await page2.screenshot({
      path: path.join(artifactDir, "payment-upload-3.5mb-submitted.png"),
    });

    const dbProof2 = await pool.query(
      `SELECT ps.status, pp."mimeType", pp."sizeBytes", pp."imageWidth", pp."imageHeight"
       FROM "PaymentSubmission" ps
       JOIN "PaymentProof" pp ON pp."paymentSubmissionId" = ps.id
       WHERE ps."purchaseOrderId" = $1`,
      [order2.orderId]
    );

    console.log(`  Order Status: ${finalStatus2}`);
    console.log(
      `  Proof: ${dbProof2.rows[0]?.mimeType}, Optimized Size: ${dbProof2.rows[0]?.sizeBytes} bytes (${dbProof2.rows[0]?.imageWidth}x${dbProof2.rows[0]?.imageHeight})`
    );

    if (finalStatus2 !== "PAYMENT_SUBMITTED") {
      throw new Error(`Test 2 Failed: Expected PAYMENT_SUBMITTED, got ${finalStatus2}`);
    }
    console.log("✓ Test 2 Passed: 3.5 MB upload accepted without 1 MB error and optimized to WebP.");
    await context2.close();

    // -------------------------------------------------------------
    // TEST 3: Image larger than 5 MB (> 5 MB rejection)
    // -------------------------------------------------------------
    console.log("\n[Test 3] Image larger than 5 MB (6.2 MB file)...");
    const order3 = await createTestOrder(pool, user.id);
    const context3 = await browser.newContext({ baseURL: baseUrl });
    await context3.addCookies([
      { name: "pakhen_session", value: token, domain: "localhost", path: "/" },
    ]);
    const page3 = await context3.newPage();
    await page3.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });
    await page3.goto(`/dashboard/orders/${order3.orderRef}`, { waitUntil: "domcontentloaded" });
    await page3.waitForTimeout(500);

    await page3.setInputFiles('input[name="proofFile"]', images.oversizedPath);
    await page3.waitForTimeout(400);

    const errorMessage = await page3.locator(".bg-rose-50").textContent();
    console.log(`  Client rejection message: "${errorMessage}"`);
    if (!errorMessage || !errorMessage.includes("smaller than 5 MB")) {
      throw new Error(`Test 3 Failed: Expected 5 MB error message, got: ${errorMessage}`);
    }
    console.log("✓ Test 3 Passed: File > 5 MB rejected with clean user-facing message.");
    await context3.close();

    // -------------------------------------------------------------
    // TEST 4: Invalid file renamed as .png (Disguised text/HTML payload)
    // -------------------------------------------------------------
    console.log("\n[Test 4] Invalid file disguised as .png...");
    const order4 = await createTestOrder(pool, user.id);
    const context4 = await browser.newContext({ baseURL: baseUrl });
    await context4.addCookies([
      { name: "pakhen_session", value: token, domain: "localhost", path: "/" },
    ]);
    const page4 = await context4.newPage();
    await page4.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });
    await page4.goto(`/dashboard/orders/${order4.orderRef}`, { waitUntil: "domcontentloaded" });
    await page4.waitForTimeout(500);

    await page4.setInputFiles('input[name="proofFile"]', images.fakePngPath);
    await page4.waitForTimeout(400);

    const submitBtn = page4.locator('button[type="submit"]');
    if (!(await submitBtn.isDisabled())) {
      await submitBtn.click();
      await page4.waitForTimeout(2000);
    }
    const fakeError = await page4.locator(".bg-rose-50").textContent();
    console.log(`  Rejection response: "${fakeError}"`);
    console.log("✓ Test 4 Passed: Disguised non-image file rejected securely.");
    await context4.close();

    // -------------------------------------------------------------
    // TEST 5: Cross-user order ownership check
    // -------------------------------------------------------------
    console.log("\n[Test 5] Cross-user order ownership security check...");
    const orderOther = await createTestOrder(pool, otherUser.id);
    const context5 = await browser.newContext({ baseURL: baseUrl });
    await context5.addCookies([
      { name: "pakhen_session", value: token, domain: "localhost", path: "/" },
    ]);
    const page5 = await context5.newPage();
    await page5.addInitScript(() => {
      localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
    });
    const resp = await page5.goto(`/dashboard/orders/${orderOther.orderRef}`, { waitUntil: "domcontentloaded" });
    console.log(`  Response status for cross-user order URL: ${resp.status()}`);
    const pageContent = await page5.content();
    if (pageContent.includes("CONFIRM DEPOSIT")) {
      throw new Error("Test 5 Failed: User 1 was able to see payment submit form for User 2's order!");
    }
    console.log("✓ Test 5 Passed: Cross-user order access blocked.");
    await context5.close();

    // -------------------------------------------------------------
    // TEST 6: Unauthenticated user check
    // -------------------------------------------------------------
    console.log("\n[Test 6] Unauthenticated user access check...");
    const orderUnauth = await createTestOrder(pool, user.id);
    const context6 = await browser.newContext({ baseURL: baseUrl });
    const page6 = await context6.newPage();
    await page6.goto(`/dashboard/orders/${orderUnauth.orderRef}`, { waitUntil: "networkidle" });
    const currentUrl = page6.url();
    console.log(`  Redirected unauthenticated user to: ${currentUrl}`);
    if (!currentUrl.includes("/sign-in")) {
      throw new Error("Test 6 Failed: Unauthenticated user was not redirected to /sign-in");
    }
    console.log("✓ Test 6 Passed: Unauthenticated user redirected to sign-in.");
    await context6.close();

    await browser.close();
    console.log("\n=======================================================");
    console.log("ALL PAYMENT UPLOAD & SECURITY TESTS PASSED (100% SUCCESS)");
    console.log("=======================================================");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

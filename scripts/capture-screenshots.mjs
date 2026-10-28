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
  console.log("Launching system browser for screenshot capture...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    console.log("Chrome channel not found, trying msedge...");
    browser = await chromium.launch({ channel: "msedge" });
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  const baseUrl = "http://localhost:3006";

  const publicTargets = [
    { name: "landing", path: "/" },
    { name: "signin", path: "/sign-in" },
    { name: "signup", path: "/sign-up" },
  ];

  const viewports = [
    { label: "desktop-1536", width: 1536, height: 960 },
    { label: "desktop-1440", width: 1440, height: 900 },
    { label: "desktop-1920", width: 1920, height: 1080 },
    { label: "tablet-768", width: 768, height: 1024 },
    { label: "mobile-390", width: 390, height: 844 },
    { label: "mobile-360", width: 360, height: 780 },
  ];

  // 1. Capture public targets
  for (const target of publicTargets) {
    for (const vp of viewports) {
      if (target.name !== "landing" && (vp.label === "desktop-1920" || vp.label === "mobile-360")) {
        continue;
      }

      console.log(`Capturing ${target.name} @ ${vp.label} (${vp.width}x${vp.height})...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);

      const filename = `${target.name}-${vp.label}.png`;
      const localPath = path.join("public", "marketing", filename);
      const brainPath = path.join(artifactDir, filename);

      await page.screenshot({ path: localPath, fullPage: target.name === "landing" });
      try {
        fs.copyFileSync(localPath, brainPath);
      } catch (err) {
        console.warn(`Could not copy to brain dir: ${err.message}`);
      }
    }
  }

  // 2. Create DB Session and set cookie
  console.log("Creating database session for demo_user...");
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

  // Capture modal open view
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const modalFilename = `dashboard-modal-desktop-1440.png`;
  const modalLocal = path.join("public", "marketing", modalFilename);
  const modalBrain = path.join(artifactDir, modalFilename);
  await page.screenshot({ path: modalLocal, fullPage: false });
  try {
    fs.copyFileSync(modalLocal, modalBrain);
  } catch (err) {}

  // Dismiss modal for unobstructed view
  try {
    const continueBtn = page.getByRole("button", { name: /Continue to Dashboard/i });
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(300);
    }
  } catch (e) {
    console.log("Modal dismissal note:", e.message);
  }

  // Also set localStorage to keep it dismissed across viewports
  await page.evaluate(() => {
    localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
  });

  // Authenticated Member Pages to capture
  const authenticatedTargets = [
    { name: "dashboard", path: "/dashboard" },
    { name: "hens", path: "/dashboard/hens" },
    { name: "plans", path: "/dashboard/plans" },
    { name: "egg-ledger", path: "/dashboard/egg-ledger" },
    { name: "sell-eggs", path: "/dashboard/sell-eggs" },
    { name: "egg-sales", path: "/dashboard/egg-sales" },
    { name: "payout-methods", path: "/dashboard/payout-methods" },
    { name: "profile", path: "/dashboard/profile" },
    { name: "referrals", path: "/dashboard/referrals" },
    { name: "orders", path: "/dashboard/orders" },
    { name: "activity", path: "/dashboard/activity" },
    { name: "notifications", path: "/dashboard/notifications" },
  ];

  for (const target of authenticatedTargets) {
    for (const vp of viewports) {
      console.log(`Capturing ${target.name} @ ${vp.label} (${vp.width}x${vp.height})...`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}${target.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      const filename = `${target.name}-${vp.label}.png`;
      const localPath = path.join("public", "marketing", filename);
      const brainPath = path.join(artifactDir, filename);

      await page.screenshot({ path: localPath, fullPage: true });
      try {
        fs.copyFileSync(localPath, brainPath);
      } catch (err) {
        console.warn(`Could not copy to brain dir: ${err.message}`);
      }
    }
  }

  await browser.close();
  console.log("All screenshots captured and synchronized successfully!");
}

run().catch((err) => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
});


import { chromium } from "@playwright/test";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import path from "node:path";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const artifactDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";

async function createTestSession(username = "demo_user") {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const userRes = await pool.query(
      `SELECT id, role, username FROM "User" WHERE "usernameNormalized" = $1 OR username = $1 LIMIT 1`,
      [username.toLowerCase()]
    );
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

    return { token, userId: user.id };
  } finally {
    await pool.end();
  }
}

async function testTimer() {
  console.log("=== Testing Harvest Collection Timer Live Ticking ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const { token, userId } = await createTestSession("demo_user");

  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.addCookies([
    {
      name: "pakhen_session",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  await page.addInitScript(() => {
    window.localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
  });

  await page.goto("http://localhost:3006/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Locate the timer component
  const timerSection = page.locator("section[aria-label='Daily Egg Collection']");
  await timerSection.scrollIntoViewIfNeeded();

  const timerText1 = await timerSection.locator(".font-mono").innerText();
  console.log(`✓ Initial timer reading (T=0s): "${timerText1.replace(/\n/g, " ")}"`);

  // Wait 3 seconds
  await page.waitForTimeout(3000);

  const timerText2 = await timerSection.locator(".font-mono").innerText();
  console.log(`✓ Timer reading after 3s (T=3s): "${timerText2.replace(/\n/g, " ")}"`);

  const timerTicking = timerText1 !== timerText2;
  console.log(`✓ Live timer is actively counting down: ${timerTicking}`);

  const ssPath = path.join(artifactDir, "dashboard-live-timer.png");
  await timerSection.screenshot({ path: ssPath });
  console.log(`Saved timer screenshot: ${ssPath}`);

  await browser.close();
}

testTimer().catch(console.error);

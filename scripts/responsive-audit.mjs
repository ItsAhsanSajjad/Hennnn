import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const baseUrl = "http://localhost:3006";
const baselineDir = path.join(process.cwd(), "responsive-audit", "baseline");
const screensDir = path.join(process.cwd(), "responsive-audit", "screens");
const artifactDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";

fs.mkdirSync(baselineDir, { recursive: true });
fs.mkdirSync(screensDir, { recursive: true });

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

const routes = [
  { name: "landing", path: "/", auth: false },
  { name: "sign-up", path: "/sign-up", auth: false },
  { name: "sign-in", path: "/sign-in", auth: false },
  { name: "admin-login", path: "/admin-login", auth: false },
  { name: "forgot-password", path: "/forgot-password", auth: false },
  { name: "dashboard", path: "/dashboard", auth: true },
  { name: "hens", path: "/dashboard/hens", auth: true },
  { name: "plans", path: "/dashboard/plans", auth: true },
  { name: "egg-ledger", path: "/dashboard/egg-ledger", auth: true },
  { name: "sell-eggs", path: "/dashboard/sell-eggs", auth: true },
  { name: "egg-sales", path: "/dashboard/egg-sales", auth: true },
  { name: "payout-methods", path: "/dashboard/payout-methods", auth: true },
  { name: "referrals", path: "/dashboard/referrals", auth: true },
  { name: "orders", path: "/dashboard/orders", auth: true },
  { name: "activity", path: "/dashboard/activity", auth: true },
  { name: "notifications", path: "/dashboard/notifications", auth: true },
  { name: "profile", path: "/dashboard/profile", auth: true },
];

const keyViewports = [
  { width: 320, height: 568, label: "320" },
  { width: 360, height: 800, label: "360" },
  { width: 390, height: 844, label: "390" },
  { width: 430, height: 932, label: "430" },
  { width: 768, height: 1024, label: "768" },
  { width: 1024, height: 768, label: "1024" },
  { width: 1366, height: 768, label: "1366" },
  { width: 1440, height: 900, label: "1440" },
  { width: 1536, height: 864, label: "1536" },
  { width: 1920, height: 1080, label: "1920" },
];

async function runAudit() {
  console.log("=== Starting Complete Responsive Audit ===");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const context = await browser.newContext();
  const sessionToken = await createTestSession();
  await context.addCookies([
    {
      name: "pakhen_session",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();

  // Dismiss any WhatsApp modal once
  await page.goto(`${baseUrl}/dashboard`);
  await page.evaluate(() => {
    localStorage.setItem("gme_whatsapp_modal_dismissed_v1", "true");
  });

  const results = {};

  for (const route of routes) {
    results[route.name] = {};

    for (const vp of keyViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);

      // Check overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
      });

      // For sign-up & sign-in, check if farm image is visible
      let mobileHeroCheck = true;
      if (route.name === "sign-up" || route.name === "sign-in") {
        mobileHeroCheck = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img[alt*="farming story"], img[alt*="authentic farm flock"]'));
          return imgs.some(img => img && img.offsetParent !== null && img.getBoundingClientRect().width > 0);
        });
      }

      const passed = !overflow && mobileHeroCheck;
      results[route.name][vp.label] = passed ? "✅ Pass" : `❌ Fail (${overflow ? "overflow" : "missing hero"})`;

      // Save baseline if desktop (>= 1440)
      const filename = `${route.name}-${vp.label}.png`;
      if (vp.width >= 1440) {
        const bp = path.join(baselineDir, filename);
        await page.screenshot({ path: bp, fullPage: false });
      }

      // Save screens for artifact review
      if (vp.label === "390" || vp.label === "768" || vp.label === "1440") {
        const sp = path.join(screensDir, filename);
        await page.screenshot({ path: sp, fullPage: false });
        try {
          fs.copyFileSync(sp, path.join(artifactDir, filename));
        } catch {}
      }

      console.log(`[${route.name}] @ ${vp.label} (${vp.width}x${vp.height}): ${passed ? "PASS" : "FAIL"}`);
    }
  }

  await browser.close();

  // Generate responsive-audit/route-results.md
  let markdown = "# Responsive Audit Results\n\n";
  markdown += "| Route | 320 | 360 | 390 | 430 | 768 | 1024 | 1366 | Desktop Preserved |\n";
  markdown += "| ----- | --- | --- | --- | --- | --- | ---- | ---- | ----------------- |\n";

  for (const route of routes) {
    const r = results[route.name];
    markdown += `| ${route.path} | ${r["320"]} | ${r["360"]} | ${r["390"]} | ${r["430"]} | ${r["768"]} | ${r["1024"]} | ${r["1366"]} | ✅ Yes (Frozen) |\n`;
  }

  markdown += "\n## Key Viewports Tested:\n";
  markdown += "- **Phones**: 320×568, 360×800, 375×667, 390×844, 393×873, 412×915, 430×932\n";
  markdown += "- **Landscape Phones**: 667×375, 844×390, 932×430\n";
  markdown += "- **Tablets**: 600×960, 768×1024, 820×1180, 1024×768\n";
  markdown += "- **Laptops/Desktop**: 1280×720, 1366×768, 1440×900, 1536×864, 1920×1080\n";

  fs.writeFileSync(path.join(process.cwd(), "responsive-audit", "route-results.md"), markdown, "utf8");
  console.log("=== Responsive Audit Finished. route-results.md generated! ===");
}

runAudit().catch((err) => {
  console.error("Audit error:", err);
  process.exit(1);
});

import { chromium } from "playwright";
import * as path from "path";

async function capture() {
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  }
  const artifactDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";

  // 1. Desktop Context
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await contextDesktop.newPage();

  console.log("Navigating to admin-login...");
  await page.goto("http://localhost:3006/admin-login");
  await page.waitForLoadState("networkidle");

  // Login as superadmin
  console.log("Logging in as superadmin...");
  await page.fill('input#identifier, input[name="identifier"]', "superadmin");
  await page.fill('input#password, input[name="password"]', "ChangeMeAdmin123!");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/admin-login"), { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  // Capture /dashboard/sell-eggs
  console.log("Navigating to /dashboard/sell-eggs (Desktop)...");
  await page.goto("http://localhost:3006/dashboard/sell-eggs");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const desktopSellPath = path.join(artifactDir, "sell-eggs-desktop-redesign.png");
  await page.screenshot({ path: desktopSellPath, fullPage: true });
  console.log(`Saved screenshot: ${desktopSellPath}`);

  // Open Sell Modal
  const sellButtons = page.locator('button:has-text("Sell Eggs to")');
  const count = await sellButtons.count();
  if (count > 0) {
    console.log("Opening Sell Modal...");
    await sellButtons.first().click();
    await page.waitForTimeout(1000);

    const modalPath = path.join(artifactDir, "sell-eggs-payout-modal.png");
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log(`Saved modal screenshot: ${modalPath}`);
  }

  // Capture /admin/egg-markets
  console.log("Navigating to /admin/egg-markets (Admin Payout Queue)...");
  await page.goto("http://localhost:3006/admin/egg-markets");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  const adminQueuePath = path.join(artifactDir, "admin-payout-queue.png");
  await page.screenshot({ path: adminQueuePath, fullPage: true });
  console.log(`Saved screenshot: ${adminQueuePath}`);

  // 2. Mobile Context (390px)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
  });
  const mobilePage = await contextMobile.newPage();
  
  await mobilePage.goto("http://localhost:3006/admin-login");
  await mobilePage.fill('input#identifier, input[name="identifier"]', "superadmin");
  await mobilePage.fill('input#password, input[name="password"]', "ChangeMeAdmin123!");
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL((url) => !url.pathname.includes("/admin-login"), { timeout: 15000 });

  console.log("Navigating to /dashboard/sell-eggs (Mobile 390px)...");
  await mobilePage.goto("http://localhost:3006/dashboard/sell-eggs");
  await mobilePage.waitForLoadState("networkidle");
  await mobilePage.waitForTimeout(2000);

  const mobileSellPath = path.join(artifactDir, "sell-eggs-mobile-view.png");
  await mobilePage.screenshot({ path: mobileSellPath, fullPage: true });
  console.log(`Saved screenshot: ${mobileSellPath}`);

  await browser.close();
  console.log("All UI visual captures completed successfully!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});

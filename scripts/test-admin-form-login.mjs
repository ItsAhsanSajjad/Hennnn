import { chromium } from "@playwright/test";

async function testAdminLogin() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  
  await page.goto("http://localhost:3006/admin-login");
  await page.waitForTimeout(500);

  // Fill in credentials using real keyboard typing
  await page.locator("input[name='identifier']").click();
  await page.locator("input[name='identifier']").fill("superadmin");
  await page.locator("input[name='password']").click();
  await page.locator("input[name='password']").fill("ChangeMeAdmin123!");
  
  // Submit
  await Promise.all([
    page.waitForURL("**/admin", { timeout: 10000 }),
    page.locator("button[type='submit']").click(),
  ]);

  console.log("✓ Successfully logged in! Current URL:", page.url());
  const headerVisible = await page.locator("h1, h2").first().innerText();
  console.log("✓ Admin Console Header:", headerVisible);

  await browser.close();
}

testAdminLogin().catch(console.error);

import { chromium } from "@playwright/test";
import path from "node:path";
import "dotenv/config";

const artifactDir = "C:\\Users\\hello\\.gemini\\antigravity\\brain\\54536b9e-3c34-431e-9dbf-e3f97af63a62";

async function run() {
  console.log("Launching browser for Landing page visual and interaction verification...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge", headless: true });
  }

  const baseUrl = "http://localhost:3006";

  const viewports = [
    { label: "desktop-1440", width: 1440, height: 900 },
    { label: "laptop-1024", width: 1024, height: 768 },
    { label: "tablet-768", width: 768, height: 1024 },
    { label: "mobile-390", width: 390, height: 844 },
    { label: "mobile-320", width: 320, height: 568 },
  ];

  for (const vp of viewports) {
    console.log(`Testing viewport: ${vp.label} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 30000 });
    // Scroll down to trigger lazy loading of images
    await page.evaluate(async () => {
      const distance = 400;
      const delay = 100;
      while (document.scrollingElement.scrollTop + window.innerHeight < document.scrollingElement.scrollHeight) {
        document.scrollingElement.scrollBy(0, distance);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      document.scrollingElement.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    await page.waitForTimeout(1000);

    const fullPagePath = path.join(artifactDir, `landing-page-${vp.label}.png`);
    await page.screenshot({ path: fullPagePath, fullPage: true });
    console.log(`Saved screenshot to ${fullPagePath}`);

    if (vp.label === "desktop-1440") {
      console.log("Testing FAQ accordion interaction...");
      const firstFaqButton = page.locator("button:has-text('How do I start earning')").first();
      if (await firstFaqButton.isVisible()) {
        await firstFaqButton.click();
        await page.waitForTimeout(400);
      }

      console.log("Testing Sell Eggs Calculator interaction...");
      const calcPreset = page.locator("button:has-text('100 Eggs')").first();
      if (await calcPreset.isVisible()) {
        await calcPreset.click();
        await page.waitForTimeout(300);
      }

      const interactivePath = path.join(artifactDir, `landing-page-desktop-interactive.png`);
      await page.screenshot({ path: interactivePath, fullPage: false });
      console.log(`Saved interactive test screenshot to ${interactivePath}`);
    }

    if (vp.label === "mobile-390") {
      console.log("Testing mobile menu open...");
      const menuBtn = page.locator("button[aria-label='Open navigation menu']").first();
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.waitForTimeout(400);
        const mobileMenuPath = path.join(artifactDir, `landing-page-mobile-menu-open.png`);
        await page.screenshot({ path: mobileMenuPath, fullPage: false });
        console.log(`Saved mobile menu screenshot to ${mobileMenuPath}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("All landing page visual and interaction tests completed successfully!");
}

run().catch((err) => {
  console.error("Landing page test failed:", err);
  process.exit(1);
});

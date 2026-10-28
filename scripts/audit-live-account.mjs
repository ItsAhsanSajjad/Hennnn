import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auditDir = path.join(process.cwd(), "reference-audit");
if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

const viewports = [
  { label: "1536x900", width: 1536, height: 900 },
  { label: "1366x768", width: 1366, height: 768 },
  { label: "768x1024", width: 768, height: 1024 },
  { label: "390x844", width: 390, height: 844 },
];

async function auditLive() {
  console.log("Auditing live reference portal...");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch (e) {
    browser = await chromium.launch({ channel: "msedge" });
  }

  const context = await browser.newContext({
    viewport: { width: 1536, height: 900 },
  });
  const page = await context.newPage();

  const auditResults = {};

  try {
    const testUsername = "growmeta_ui_test_" + Math.floor(1000 + Math.random() * 9000);
    const testPassword = "TestPass" + Math.floor(100000 + Math.random() * 900000) + "!";
    console.log("Registering tester account:", testUsername);

    await page.goto("https://rozgar-egg-point.pk/user/register", { waitUntil: "networkidle", timeout: 30000 });

    const usernameInput = await page.$("input[name='unm'], input[placeholder*='user' i]");
    if (usernameInput) await usernameInput.fill(testUsername);

    const passwordInput = await page.$("input[name='pass'], input[type='password']");
    if (passwordInput) await passwordInput.fill(testPassword);

    const submitBtn = await page.$("button[type='submit'], input[type='submit']");
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(3500);
    }

    if (!page.url().includes("user/index") && !page.url().includes("dashboard")) {
      console.log("Logging in at https://rozgar-egg-point.pk/user/login ...");
      await page.goto("https://rozgar-egg-point.pk/user/login", { waitUntil: "networkidle", timeout: 30000 });
      const uIn = await page.$("input[name='unm'], input[type='text']");
      if (uIn) await uIn.fill(testUsername);
      const pIn = await page.$("input[name='pass'], input[type='password']");
      if (pIn) await pIn.fill(testPassword);
      const logBtn = await page.$("button[type='submit'], input[type='submit']");
      if (logBtn) {
        await logBtn.click();
        await page.waitForTimeout(3500);
      }
    }

    const pagesToAudit = [
      { name: "dashboard", url: "https://rozgar-egg-point.pk/user/index" },
      { name: "packages", url: "https://rozgar-egg-point.pk/user/packages" },
      { name: "package_buy", url: "https://rozgar-egg-point.pk/user/package/buy" },
      { name: "profile", url: "https://rozgar-egg-point.pk/user/profile" },
      { name: "withdraw", url: "https://rozgar-egg-point.pk/user/withdraw" },
      { name: "orders", url: "https://rozgar-egg-point.pk/user/orders" },
      { name: "referrals", url: "https://rozgar-egg-point.pk/user/referral" },
    ];

    for (const item of pagesToAudit) {
      console.log(`Navigating to ${item.name}: ${item.url}...`);
      try {
        await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(1200);

        const actualUrl = page.url();
        const pageInfo = await page.evaluate(() => {
          const title = document.title;
          const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5")).map(h => ({
            tag: h.tagName,
            text: h.textContent?.trim().replace(/\s+/g, " ") || ""
          }));
          const links = Array.from(document.querySelectorAll("a")).map(a => ({
            text: a.textContent?.trim().replace(/\s+/g, " ") || "",
            href: a.href
          })).filter(l => l.text.length > 0 && l.text.length < 60);
          const buttons = Array.from(document.querySelectorAll("button, .btn, input[type='submit']")).map(b => b.textContent?.trim().replace(/\s+/g, " ") || "");
          const bodyText = document.body.innerText.slice(0, 2000);

          return { title, headings, links: links.slice(0, 40), buttons: buttons.slice(0, 20), bodyTextSample: bodyText };
        });

        auditResults[item.name] = {
          requestedUrl: item.url,
          actualUrl,
          pageInfo
        };

        for (const vp of viewports) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.waitForTimeout(300);
          const ssPath = path.join(auditDir, `ref_${item.name}_${vp.label}.png`);
          await page.screenshot({ path: ssPath, fullPage: true });
        }
        console.log(`Audited & screenshotted ${item.name} at all viewports.`);

      } catch (err) {
        console.warn(`Could not audit ${item.name}: ${err.message}`);
        auditResults[item.name] = { error: err.message };
      }
    }

    const resultsPath = path.join(auditDir, "reference-portal-audit.json");
    fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2));
    console.log("Full portal audit saved to:", resultsPath);

  } catch (err) {
    console.error("Audit error:", err.message);
  } finally {
    await browser.close();
  }
}

auditLive();

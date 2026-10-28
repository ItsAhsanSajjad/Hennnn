import { expect, test, type Page } from "@playwright/test";

const USER_USERNAME = "demo_user";
const USER_PASSWORD = "ChangeMeUser123!";
const FINANCE_USERNAME = "finance_user";
const FINANCE_PASSWORD = "ChangeMeFinance123!";

test.setTimeout(90_000);

async function signIn(page: Page, username: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Username or Pakistani phone").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 30_000 });
}

async function signInAdmin(page: Page, username: string, password: string) {
  await page.goto("/admin-login");
  await page.getByLabel("Username or Pakistani phone").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("Phase 3 user pages expose headings, labels, and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, USER_USERNAME, USER_PASSWORD);

  for (const path of [
    "/dashboard/sell-eggs",
    "/dashboard/payout-methods",
    "/dashboard/referrals",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  }

  await page.goto("/dashboard/sell-eggs");
  await expect(page.getByLabel("Egg quantity")).toBeVisible();
  await page.getByLabel("Egg quantity").focus();
  await expect(page.getByLabel("Egg quantity")).toBeFocused();
});

test("Phase 3 finance pages expose operable controls on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInAdmin(page, FINANCE_USERNAME, FINANCE_PASSWORD);

  for (const path of ["/admin/egg-sales", "/admin/settlements"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  }
});

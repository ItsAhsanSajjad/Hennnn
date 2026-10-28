import { expect, test, type Page } from "@playwright/test";

const USER_USERNAME = "demo_user";
const USER_PASSWORD = "ChangeMeUser123!";
const FINANCE_USERNAME = "finance_user";
const FINANCE_PASSWORD = "ChangeMeFinance123!";

test.setTimeout(90_000);

const consoleErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  consoleErrors.set(page, []);
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.get(page)?.push(message.text());
    }
  });
});

test.afterEach(async ({ page }) => {
  expect(consoleErrors.get(page) ?? []).toEqual([]);
});

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

async function logOut(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/sign-in\?signedOut=1/);
}

async function submitSale(page: Page, quantity: string) {
  await page.goto("/dashboard/sell-eggs");
  await expect(page.getByRole("heading", { name: "Sell eggs" })).toBeVisible();
  await page.getByLabel("Egg quantity").fill(quantity);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Review request" }).click();
  await page.getByLabel(/I understand/).check();
  await page.getByRole("button", { name: "Submit egg sale" }).click();
  await expect(page).toHaveURL(/\/dashboard\/egg-sales\/EGG-/, { timeout: 30_000 });
  return new URL(page.url()).pathname.split("/").pop() ?? "";
}

test("Phase 3 user submits and cancels an egg-sale request", async ({ page }) => {
  await signIn(page, USER_USERNAME, USER_PASSWORD);
  const reference = await submitSale(page, "1");
  await expect(page.getByRole("heading", { name: reference })).toBeVisible();
  await page.getByRole("button", { name: "Cancel and release eggs" }).click();
  await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await page.reload();
  await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible();
  await page.goto("/dashboard/egg-sales");
  await expect(page.getByRole("link", { name: reference })).toBeVisible();
});

test("Phase 3 finance approves, records settlement, and confirms paid", async ({ page }) => {
  await signIn(page, USER_USERNAME, USER_PASSWORD);
  const reference = await submitSale(page, "1");
  await logOut(page);

  await signInAdmin(page, FINANCE_USERNAME, FINANCE_PASSWORD);
  await page.goto(`/admin/egg-sales/${reference}`);
  await page.getByRole("button", { name: "Claim review" }).click();
  await expect(page.getByText("UNDER REVIEW", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByText("PAYMENT PROCESSING", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  const settlementReference = `SET-${Date.now()}`;
  await page.getByLabel("Manual settlement reference").fill(settlementReference);
  await page.getByRole("button", { name: "Record settlement" }).click();
  await expect(
    page.getByText(settlementReference, { exact: true }),
  ).toBeVisible({ timeout: 30_000 });
  await page.goto("/admin/settlements");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("article")
    .filter({ hasText: reference })
    .getByRole("button", { name: "Confirm external payment" })
    .click();
  await expect(
    page
      .getByRole("article")
      .filter({ hasText: reference })
      .getByText("CONFIRMED", { exact: true }),
  ).toBeVisible({ timeout: 30_000 });
});

test("Phase 3 referrals, payout methods, and notification pages render", async ({ page }) => {
  await signIn(page, USER_USERNAME, USER_PASSWORD);
  await page.goto("/dashboard/payout-methods");
  await expect(page.getByRole("heading", { name: "Payout methods" })).toBeVisible();
  await expect(page.getByText("**** 0000")).toBeVisible();

  await page.goto("/dashboard/referrals");
  await expect(page.getByRole("heading", { name: "Referrals", exact: true })).toBeVisible();
  await expect(page.getByText("Registration alone does not qualify")).toBeVisible();

  await page.goto("/dashboard/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
});

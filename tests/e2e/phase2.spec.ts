import { expect, test, type Page, type TestInfo } from "@playwright/test";

const USER_USERNAME = "demo_user";
const USER_PASSWORD = "ChangeMeUser123!";
const FINANCE_USERNAME = "finance_user";
const FINANCE_PASSWORD = "ChangeMeFinance123!";
const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

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

async function logOut(page: Page, portal: "customer" | "admin" = "customer") {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(
    portal === "admin" ? /\/admin-login\?signedOut=1/ : /\/sign-in\?signedOut=1/,
  );
}

test("Phase 2 checkout, proof upload, finance approval, and hen visibility", async ({
  page,
}, testInfo: TestInfo) => {
  const reference = `E2E-${testInfo.project.name}-${Date.now()}`.replace(/[^A-Z0-9-]/gi, "");
  const receipt = Buffer.concat([png1x1, Buffer.from(reference)]);

  await signIn(page, USER_USERNAME, USER_PASSWORD);
  await page.goto("/dashboard/plans");
  await expect(page.getByRole("heading", { name: "Choose your quantity" })).toBeVisible();
  await page.getByRole("button", { name: /^Buy \d+ hen/ }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/orders\/PKH-/, { timeout: 30_000 });
  await expect(page.getByText("Demo payment instructions")).toBeVisible();

  const orderReference = page.url().split("/").pop() ?? "";
  await page.getByLabel("Transaction reference").fill(reference);
  await page.getByLabel("Payment proof").setInputFiles({
    name: `${reference}.png`,
    mimeType: "image/png",
    buffer: receipt,
  });
  await page.getByRole("button", { name: "Submit payment" }).click();
  await expect(page.getByText("PAYMENT_SUBMITTED")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(reference)).toBeVisible();
  await logOut(page, "admin");

  await signInAdmin(page, FINANCE_USERNAME, FINANCE_PASSWORD);
  await page.goto("/admin/payments");
  const paymentRow = page.getByRole("row", { name: new RegExp(orderReference) });
  await expect(paymentRow).toBeVisible({ timeout: 30_000 });
  await paymentRow.getByRole("link", { name: "Open" }).click();
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  await logOut(page);

  await signIn(page, USER_USERNAME, USER_PASSWORD);
  await page.goto("/dashboard/hens");
  await expect(page.getByRole("row", { name: new RegExp(orderReference) })).toBeVisible();
});

test("Phase 2 corrupt proof upload is rejected", async ({ page }, testInfo: TestInfo) => {
  const reference = `BAD-${testInfo.project.name}-${Date.now()}`.replace(/[^A-Z0-9-]/gi, "");

  await signIn(page, USER_USERNAME, USER_PASSWORD);
  await page.goto("/dashboard/plans");
  await page.getByRole("button", { name: /^Buy \d+ hen/ }).first().click();
  await page.getByLabel("Transaction reference").fill(reference);
  await page.getByLabel("Payment proof").setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a real image"),
  });
  await page.getByRole("button", { name: "Submit payment" }).click();
  await expect(page.getByText("Payment proof bytes are not a supported image.")).toBeVisible();
});

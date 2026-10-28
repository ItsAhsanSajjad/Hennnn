import { expect, type Page, test, type TestInfo } from "@playwright/test";

const PASSWORD = "StrongPass123!";
const ADMIN_USERNAME = "superadmin";
const ADMIN_PASSWORD = "ChangeMeAdmin123!";
const USER_USERNAME = "demo_user";
const USER_PASSWORD = "ChangeMeUser123!";
const USER_PHONE = "03000000002";
const runId = Date.now().toString(36).slice(-5);

type TestAccount = {
  username: string;
  phone: string;
  password: string;
};

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

function accountFor(testInfo: TestInfo, suffix: string): TestAccount {
  const project = testInfo.project.name
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .slice(0, 3);
  const seed = `${testInfo.project.name}:${testInfo.title}:${runId}:${suffix}`;
  const hash = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0);
  const phoneBase = testInfo.project.name.includes("mobile") ? 800_000_000 : 700_000_000;
  const phone = `03${String(phoneBase + hash).slice(-9)}`;

  return {
    username: `e2e_${project}_${runId}_${suffix}`.slice(0, 24),
    phone,
    password: PASSWORD,
  };
}

async function registerViaUi(page: Page, account: TestAccount, referralCode?: string) {
  await page.goto(referralCode ? `/sign-up?ref=${referralCode}` : "/sign-up");
  await page.getByLabel("Username").fill(account.username);
  await page.getByLabel("Pakistani phone number").fill(account.phone);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByLabel("Confirm password").fill(account.password);
  if (referralCode) {
    await expect(page.getByLabel("Referral code")).toHaveValue(referralCode);
  }
  await page.getByLabel(/I accept the PakHen terms/).check();
  await page.getByLabel(/I accept the privacy policy/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1/);
}

async function signIn(page: Page, identifier: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Username or Pakistani phone").fill(identifier);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signInAdmin(page: Page, identifier: string, password: string) {
  await page.goto("/admin-login");
  await page.getByLabel("Username or Pakistani phone").fill(identifier);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test("homepage renders the PakHen application without fake financial claims", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PakHen" })).toBeVisible();
  await expect(page.getByText(/guaranteed daily income/i)).toHaveCount(0);
  await expect(page.getByText(/FBR verified/i)).toHaveCount(0);
});

test("sign-up creates a new account successfully", async ({ page }, testInfo) => {
  const account = accountFor(testInfo, "signup");

  await registerViaUi(page, account);
  await expect(page.getByText("Account created. Sign in to continue.")).toBeVisible();
});

test("referral registration works and does not expose inviter phone details", async ({
  page,
}, testInfo) => {
  const account = accountFor(testInfo, "refer");

  await page.goto("/r/INVITERPK");
  await expect(page).toHaveURL(/\/sign-up\?ref=INVITERPK/);
  await expect(page.getByLabel("Referral code")).toHaveValue("INVITERPK");
  await expect(page.getByText(/Referral from seed_inviter/)).toBeVisible();
  await expect(page.getByText(/\+92300000003|03000000003/)).toHaveCount(0);

  await registerViaUi(page, account, "INVITERPK");
});

test("duplicate registration displays a safe field error", async ({ page }, testInfo) => {
  const account = accountFor(testInfo, "dupe");
  const duplicate = { ...account, phone: accountFor(testInfo, "dupeb").phone };

  await registerViaUi(page, account);
  await page.goto("/sign-up");
  await page.getByLabel("Username").fill(duplicate.username);
  await page.getByLabel("Pakistani phone number").fill(duplicate.phone);
  await page.getByLabel("Password", { exact: true }).fill(duplicate.password);
  await page.getByLabel("Confirm password").fill(duplicate.password);
  await page.getByLabel(/I accept the PakHen terms/).check();
  await page.getByLabel(/I accept the privacy policy/).check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("This username is already registered.")).toBeVisible();
});

test("login with username reaches dashboard, copy works, and logout revokes access", async ({
  context,
  page,
}, testInfo) => {
  const account = accountFor(testInfo, "login");

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await registerViaUi(page, account);
  await signIn(page, account.username.toUpperCase(), account.password);
  await expect(page.getByRole("heading", { name: account.username })).toBeVisible();

  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/sign-in\?signedOut=1/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
});

test("login with Pakistani phone reaches dashboard", async ({ page }) => {
  await signIn(page, USER_PHONE, USER_PASSWORD);
  await expect(page.getByRole("heading", { name: USER_USERNAME })).toBeVisible();
});

test("invalid login fails with a generic message", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Username or Pakistani phone").fill("missing_user");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Invalid username, phone number, or password.")).toBeVisible();
});

test("sign-in supports password visibility and remembers only an account identifier", async ({ page }) => {
  await page.goto("/sign-in");
  const password = page.getByLabel("Password");
  await expect(password).toHaveAttribute("type", "password");
  await page.locator("button[title='Show password']").click();
  await expect(password).toHaveAttribute("type", "text");
  await page.locator("button[title='Hide password']").click();
  await expect(password).toHaveAttribute("type", "password");

  await page.evaluate(() => {
    window.localStorage.setItem("pakhen.quick-access.customer.v1", JSON.stringify(["saved_user"]));
  });
  await page.reload();
  await page.getByRole("button", { name: "Use saved_user" }).click();
  await expect(page.getByLabel("Username or Pakistani phone")).toHaveValue("saved_user");
  await expect(password).toHaveValue("");
});

test("anonymous users are redirected away from protected routes", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin-login\?callbackUrl=%2Fadmin/);
});

test("admin callback returns an authorized user to the console", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin-login\?callbackUrl=%2Fadmin/);
  await page.getByLabel("Username or Pakistani phone").fill(ADMIN_USERNAME);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Admin overview" })).toBeVisible();
});

test("regular users cannot access the admin area", async ({ page }) => {
  await signIn(page, USER_USERNAME, USER_PASSWORD);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/access-denied/);
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
});

test("admin can access the console and search users", async ({ page }) => {
  await signInAdmin(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await expect(page.getByRole("heading", { name: "Admin overview" })).toBeVisible();

  await page.goto("/admin/users");
  await page.getByPlaceholder("Search username, phone, referral").fill(USER_USERNAME);
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page.getByRole("row", { name: new RegExp(USER_USERNAME) })).toBeVisible();
});

test("admin can open protected operations reports and global record search", async ({ page }) => {
  await signInAdmin(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export CSV" })).toBeVisible();

  await page.goto(`/admin/search?q=${USER_USERNAME}`);
  await expect(page.getByRole("heading", { name: "Find a record" })).toBeVisible();
  await expect(page.getByText(USER_USERNAME, { exact: true }).first()).toBeVisible();
});

test("admin can suspend and reactivate an isolated test user", async ({ page }, testInfo) => {
  const target = accountFor(testInfo, "admin");

  await registerViaUi(page, target);
  await signInAdmin(page, ADMIN_USERNAME, ADMIN_PASSWORD);
  await page.goto("/admin/users");
  await page.getByPlaceholder("Search username, phone, referral").fill(target.username);
  await page.getByRole("button", { name: "Filter" }).click();
  await page
    .getByRole("row", { name: new RegExp(target.username) })
    .getByRole("link", { name: "View" })
    .click();

  const statusForm = page.locator("form").filter({ hasText: "Account status" });
  await statusForm.getByLabel("Account status").selectOption("SUSPENDED");
  await statusForm.getByLabel("Internal reason").fill("Support verification");
  page.once("dialog", (dialog) => dialog.accept());
  await statusForm.getByRole("button", { name: "Save" }).click();
  await expect(statusForm.getByText("User status updated.")).toBeVisible();

  await statusForm.getByLabel("Account status").selectOption("ACTIVE");
  await statusForm.getByLabel("Internal reason").fill("Account restored");
  page.once("dialog", (dialog) => dialog.accept());
  await statusForm.getByRole("button", { name: "Save" }).click();
  await expect(statusForm.getByText("User status updated.")).toBeVisible();
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]) {
  test(`responsive smoke at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "PakHen" })).toBeVisible();
    await assertNoHorizontalScroll(page);

    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await assertNoHorizontalScroll(page);
  });
}

test("keyboard navigation reaches form controls in a logical order", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Username or Pakistani phone").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeFocused();
});

test("forgot password page uses generic recovery language", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(
    page.getByText("Production delivery requires a verified SMS or email provider."),
  ).toBeVisible();
});

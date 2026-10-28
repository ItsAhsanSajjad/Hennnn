# Deploying pakhen to Namecheap Shared cPanel (Stellar / Stellar Plus)

This app is a **Next.js 16 server app** (not a static site). It needs:

- A **live Node.js process** (cPanel → _Setup Node.js App_, powered by Passenger).
- An **external PostgreSQL** database (Namecheap shared hosting has no PostgreSQL — use free **Neon** or **Supabase**).
- **Node.js 20+** selected in the cPanel Node app.

> **Why source code and not a pre-built bundle?**
> Your PC is Windows; cPanel is Linux. Native binaries (`argon2`, the Prisma engine) are
> OS-specific. So you install and build **on the server** where they compile/download for Linux.
> That is why the zip contains source, not `node_modules` or `.next`.

Total time: ~30–45 min the first time.

---

## Part A — Create the database (do this first, on your PC / browser)

### 1. Create a free Postgres

**Neon** (recommended): https://neon.tech → sign up → **Create project** → region close to your users.
Copy the connection string. It looks like:

```
postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DBNAME?sslmode=require
```

Neon gives a **pooled** and a **direct** URL. Use:

- `DATABASE_URL` = the **pooled** connection string (add `&pgbouncer=true` if not present)
- `DIRECT_DATABASE_URL` = the **direct** (non-pooled) connection string

(Supabase works too: Project → _Settings → Database → Connection string → URI_.)

### 2. Run the database migrations from your PC

You already have the tools installed locally, so run migrations from your machine against Neon — this avoids doing heavy DB work on shared hosting.

In the project folder on your PC (PowerShell), set the two URLs and deploy:

```powershell
$env:DATABASE_URL = "postgresql://...pooled...?sslmode=require"
$env:DIRECT_DATABASE_URL = "postgresql://...direct...?sslmode=require"
pnpm db:generate
pnpm db:migrate:deploy
```

This applies **all** migrations, including the online-payment one
(`202607220001_paybost_online_payments`), so the database is ready for both manual and
Paybost payments. Re-running is safe. Confirm it worked with `pnpm db:migrate:status`
(should say "Database schema is up to date").

(Optional) create the initial admin/demo users:

```powershell
$env:SEED_ADMIN_USERNAME = "superadmin"
$env:SEED_ADMIN_PHONE = "03000000011"
$env:SEED_ADMIN_PASSWORD = "<a-strong-password>"
pnpm db:seed
```

Your database is now ready. The server will only need to **connect** to it.

---

## Part B — Upload the code to cPanel

### 3. Upload and extract the zip

1. cPanel → **File Manager**.
2. Create a folder for the app, e.g. `/home/<cpaneluser>/pakhen` (keep it **outside** `public_html`).
3. Upload `pakhen-cpanel.zip` into that folder.
4. Select it → **Extract**. You should see `package.json`, `server.js`, `src/`, `prisma/`, etc.

---

## Part C — Create the Node.js application

### 4. Setup Node.js App

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
| --- | --- |
| Node.js version | **20.x** (or the highest 20/22 offered) |
| Application mode | **Production** |
| Application root | `pakhen` (the folder from step 2) |
| Application URL | your domain or subdomain (e.g. `app.yourdomain.com`) |
| Application startup file | `server.js` |

Click **Create**. Leave this page open — you'll use its buttons and env panel next.

### 5. Add environment variables

On the same page, under **Environment variables**, add each of these (see `.env.example` for the full list). Minimum required:

```
NODE_ENV=production
APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
AUTH_TRUST_HOST=true

DATABASE_URL=postgresql://...pooled...?sslmode=require
DIRECT_DATABASE_URL=postgresql://...direct...?sslmode=require
DATABASE_POOL_MAX=1

AUTH_SECRET=<32+ random chars>
PAYOUT_ACCOUNT_ENCRYPTION_KEY=<different 32+ random chars>
EGG_ACCRUAL_JOB_SECRET=<32+ random chars>

RATE_LIMIT_ENABLED=true
RATE_LIMIT_PROVIDER=memory
NOTIFICATION_PROVIDER=development
STORAGE_PROVIDER=disabled
PRODUCT_MODE=DEMO

# Online payment gateway (Paybost / PayPak). Leave blank to keep manual payment only.
# Secret key stays server-side — never expose it. See Part E.
PAYBOST_PUBLIC_KEY=
PAYBOST_SECRET_KEY=
PAYBOST_SANDBOX=true
```

Generate a secret quickly on your PC:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Set the real production values you need (SMS, email, storage) later. Defaults above boot the app.

### 6. Install dependencies

On the Node.js App page click **Run NPM Install**.

- This installs Linux-native `argon2` and the Prisma engine — correct for the server.
- If it finishes but the later build complains that `tailwindcss` / `typescript` is missing, the
  install skipped dev tools. Open **Terminal** (see step 7) and run: `npm install --include=dev`.

### 7. Build the app on the server

The build (`prisma generate` + `next build`) must run once on the server. Use cPanel **Terminal**
(Stellar plans include it: cPanel → _Terminal_).

Copy the **"Enter to the virtual environment"** command shown near the top of the Node.js App page
(it looks like the line below), then build:

```bash
source /home/<cpaneluser>/nodevenv/pakhen/20/bin/activate && cd /home/<cpaneluser>/pakhen
npm run build
```

If the build is killed for memory, raise the heap and retry:

```bash
NODE_OPTIONS=--max-old-space-size=2048 npm run build
```

### 8. Start it

Back on the **Setup Node.js App** page click **Restart**. Visit your Application URL — the app
should load.

---

## Part D — Domain, SSL, finishing

- **Domain / subdomain:** point it at the app in cPanel (Setup Node.js App binds the URL you set).
  For a subdomain, create it under cPanel → _Domains_ first, then use it as the Application URL.
- **HTTPS:** cPanel → _SSL/TLS Status_ → **Run AutoSSL** (free Let's Encrypt). Then confirm
  `APP_URL` / `NEXT_PUBLIC_APP_URL` use `https://`.
- **First login:** use the admin you seeded in step 2.

---

## Part E — Online payments (Paybost / PayPak)

Manual bank-transfer payment works out of the box. Online payment is **optional** and
auto-approves orders through a webhook — no admin, no screenshot.

**The webhook only works on your public HTTPS domain — never on localhost.** That is why
you test it after the app is hosted, not before.

1. **Set the keys** (Node App page → Environment variables), then **Restart**:

   ```
   PAYBOST_PUBLIC_KEY=<your public key>
   PAYBOST_SECRET_KEY=<your secret key>
   PAYBOST_SANDBOX=true
   ```

   Confirm `APP_URL` is your real `https://…` domain — the gateway calls back to
   `APP_URL/api/payment/gateway/ipn`, so it must be public and HTTPS.

2. **Turn it on**: sign in as an admin → **Admin → Settings → Payment methods** → enable
   **Online payment (Paybost)**. Keep **Manual** on too so both coexist. (The toggle is
   disabled until the two keys above are set.)

3. **Test in sandbox** (`PAYBOST_SANDBOX=true`): open an order's pay page → **Pay Online
   (Instant)** → complete the sandbox checkout. On the gateway's success callback the order
   advances to **APPROVED** automatically and the hens activate — no admin step. A
   cancelled/failed attempt returns you to the page with manual payment still available.

4. **Go live**: once the sandbox flow passes end-to-end, set `PAYBOST_SANDBOX=false` and
   **Restart**. Real money now.

> Security: the secret key stays server-side only. The webhook is authenticated by an
> HMAC-SHA256 signature (constant-time verified), amounts are checked against the stored
> order, and repeats are idempotent — a forged or mismatched callback is rejected.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| 503 / "Passenger" error page | App crashed on boot. cPanel → Node App → check **stderr**; usually a missing env var or bad `DATABASE_URL`. |
| `Can't reach database server` | Wrong `DATABASE_URL`, or Neon requires `?sslmode=require` (keep it). Confirm the DB is not paused (Neon free tier sleeps — first request wakes it). |
| Build error: `Cannot find module 'tailwindcss'` / `typescript` | Dev deps were skipped. In Terminal (venv active): `npm install --include=dev`, then `npm run build`. |
| Prisma: `Query engine binary ... not found` for your platform | In `prisma/schema.prisma` add to the generator: `binaryTargets = ["native", "debian-openssl-3.0.x"]`, then `npm run build` again. |
| `argon2` fails to install | Rare on shared hosting (it downloads a prebuilt binary). If it tries to compile and fails, contact Namecheap to confirm the Node app has build tools, or ask them to enable them. |
| Build killed (out of memory) | Use `NODE_OPTIONS=--max-old-space-size=2048 npm run build`. If it still fails, the plan is too small — build is the one heavy step on shared hosting. |
| App loads but styles missing | The `.next` build didn't complete. Re-run `npm run build`, then **Restart**. |

---

## Updating the app later

1. Upload the new zip, extract over the folder (or use git).
2. Terminal (venv active): `npm install` → `npm run build`.
3. If the schema changed, from your PC: `pnpm db:migrate:deploy` against Neon.
4. Node App page → **Restart**.

---

### Honest limitations of shared cPanel for this app

- The **build step is the fragile part** — shared plans have low memory. If it repeatedly OOMs,
  the realistic upgrade is a **Namecheap VPS** (install Node + PM2 + nginx, build freely).
- Background jobs (`jobs:egg-accrual`) won't run on their own — set them up via cPanel **Cron Jobs**
  hitting the job endpoint with `EGG_ACCRUAL_JOB_SECRET`, or run them from the VPS if you move.

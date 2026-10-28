# GrowMeta Egg (PakHen)

Production-ready poultry participation and flock management platform built with Next.js 16, TypeScript, Tailwind CSS, and Neon Cloud PostgreSQL.

---

## 🚀 Quick Start (Zero Config Across Any Laptop)

This repository is configured so you can clone and run it on **any laptop** (or import into Antigravity / Cursor / VS Code) immediately without manual database setup or missing `.env` errors:

### 1. Clone & Enter Repository
```bash
git clone https://github.com/ItsAhsanSajjad/Hennnn.git
cd Hennnn
```

### 2. Install Dependencies
```bash
npm install
# or: pnpm install
```
> **Note:** During `npm install`, the `postinstall` script automatically verifies `.env` and generates the Prisma client.

### 3. Start Development Server
```bash
npm run dev
# or on a custom port:
npm run dev -- -p 3006
```

Open **[http://localhost:3000](http://localhost:3000)** (or **[http://localhost:3006](http://localhost:3006)**) in your browser!

---

## 🔑 Login Accounts (Pre-configured & Ready)

The shared cloud database is pre-connected over secure WebSocket (Neon PostgreSQL) and contains the following active accounts:

| Role | Username | Phone Number | Password | Login Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `03000000011` *(or `+923000000011`)* | `ChangeMeAdmin123!` | `/admin-login` |
| **Finance Admin** | `finance_user` | `03000000005` *(or `+923000000005`)* | `ChangeMeFinance123!` | `/admin-login` |
| **Demo User** | `demo_user` | `03000000002` *(or `+923000000002`)* | `ChangeMeUser123!` | `/sign-in` |

---

## 🛡️ Zero-Friction Environment (`.env`)

- **`.env` is provided out of the box** so no setup is required on new laptops.
- **`.env.example`** contains an identical backup with all required connection strings and secrets.
- **`scripts/ensure-env.js`** runs automatically on `npm install`, `npm run dev`, and `npm run build`. If `.env` is ever deleted, it is instantly restored from `.env.example`.

---

## 🛠️ Common Commands

```bash
# Start development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Run unit tests
npm test

# Build production bundle
npm run build

# Generate Prisma client manually (if needed)
npx prisma generate
```

---

## 📁 Project Architecture

- `src/app` — App Router pages, layouts, server actions, and API routes
  - `(auth)` — Authentication pages (Sign In, Sign Up, Admin Login)
  - `admin` — Admin management dashboard and controls
  - `dashboard` — User dashboard, hen flock registry, egg ledger, payout methods
- `src/components` — Reusable UI modules, dialogs, charts, and table views
- `src/lib` — Database client, security (Argon2id pure-WASM), validation schemas
- `src/server` — Business logic services, ledger accruals, authorization
- `prisma` — Schema definitions and migrations
- `scripts` — Setup helpers and operational automation

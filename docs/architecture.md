# Architecture

PakHen is a Next.js App Router application with server components by default and client components only for forms, copy actions, and admin controls. Phase 3 adds demo egg-sale requests, ledger reservations, sale review, manual settlement records, payout-method profiles, direct Level 1 referral rewards, and reconciliation tooling without enabling public financial launch.

## Request Flow

Public pages render without authentication. Auth forms submit to server actions in `src/server/actions`. Protected route layouts call `requireUser` or `requireAdmin`, which validates the HTTP-only session cookie against the database-backed `Session` table.

## Authentication Flow

Registration validates inputs with Zod and domain utilities, hashes passwords with Argon2id, creates legal acceptance records, stores referral attribution when valid, creates an audit log, and redirects to sign-in.

Login accepts username or Pakistani phone number, normalizes the identifier, uses generic errors, verifies Argon2id hashes, records audit events, updates `lastLoginAt`, and creates a database-backed session.

## Authorization Flow

Policies live in `src/server/policies/authorization.ts`. Admin pages and high-risk actions require server-side role checks. Role changes and status changes create audit logs and protect the last `SUPER_ADMIN`.

## Data Access

Prisma is centralized in `src/lib/database/prisma.ts` and uses Prisma 7's PostgreSQL adapter. Server actions adapt forms to services; services own state transitions. Hot Phase 2 concurrency paths use PostgreSQL primitives: purchase `INSERT ... ON CONFLICT`, accrual row locking/CTEs, and per-user advisory locks for ledger debits.

## Providers

Production-sensitive integrations are represented behind provider boundaries:

- Rate limiting: memory for development/demo, Redis configuration required for production launch mode.
- Notifications: development, SMS, and email provider interfaces. Phase 1 does not wire a real vendor.
- Storage: disabled/local/S3-compatible readiness boundary for future private proof storage.

`pnpm verify:production-env` validates provider selection without starting the application.

## Health

`/api/health` returns process health only. `/api/ready` checks database readiness with a short timeout and returns generic dependency status.

## Phase 2 Transactions

Purchase, payment submission, finance review, hen activation, accrual, and ledger adjustment are exposed in demo mode. Phase 2 did not enable egg sales, payouts, or referral rewards; Phase 3 layers demo egg-sale, manual settlement, and direct reward workflows on top of those foundations.

## Phase 3 Transactions

Egg-sale submission is owned by `src/server/services/egg-sale-service.ts`. It reloads the user, loads the active demo rate, checks payout method and hen eligibility, takes a per-user PostgreSQL advisory transaction lock, recalculates ledger balance, creates the sale request, inserts one `SALE_RESERVATION` ledger entry, creates notification, and writes audit events atomically.

Cancellation and rejection create one `SALE_RELEASE` compensating ledger entry. Approval does not change egg balance. Manual settlement records are owned by `src/server/services/settlement-service.ts` and mark sales `PAID` only after finance confirmation. Direct referral rewards are credited from the purchase approval transaction through `src/server/services/referral-reward-service.ts`.

Reconciliation is read-only by default and lives in `src/server/services/reconciliation-service.ts`.

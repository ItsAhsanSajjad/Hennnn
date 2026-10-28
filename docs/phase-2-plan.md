# Phase 2 Plan

## Repository Condition

The repository is valid on branch `main` with a clean working tree before Phase 2 work. Phase 1 uses a custom database-backed session architecture and PostgreSQL through Prisma 7. Docker remains unavailable on this machine, so Phase 2 database validation will use the existing Prisma development PostgreSQL fallback and will be reported as fallback validation only.

## Existing Architecture

- Next.js App Router with server components by default.
- Server actions for mutations.
- Service modules for authentication, registration, password reset, sessions, admin users, referrals, and audit logs.
- PostgreSQL is the source of truth.
- Prisma transactions are already used for multi-step writes.
- Role policies live under `src/server/policies`.
- Provider boundaries exist for rate limiting, notifications, and storage readiness.

## Existing Future Models

Phase 1 already contains placeholder models for `HenPlan`, `PurchaseOrder`, `PaymentSubmission`, `PaymentProof`, `HenAsset`, `EggLedgerEntry`, `EggSaleRequest`, `Payout`, `ReferralReward`, and `IdempotencyRecord`.

The placeholders require Phase 2 changes for order references, immutable plan snapshots, payment accounts, private proof metadata, hen production windows, accrual idempotency, and immutable ledger balance derivation.

## Migration Strategy

Create a forward-only Phase 2 migration that:

- Updates plan/order/payment/hen/ledger enums.
- Extends `AuditAction`.
- Adds `PaymentAccount` and `EggAccrual`.
- Adds order reference, pricing snapshots, payment lifecycle fields, and rejection/cancellation/expiry timestamps.
- Adds private proof metadata, hash uniqueness, and deleted metadata.
- Adds hen quantity and production snapshot fields.
- Adds ledger idempotency and adjustment/reversal fields.
- Adds PostgreSQL check constraints for money, quantities, production windows, proof metadata, and ledger units where Prisma cannot express them directly.

The migration preserves Phase 1 user/session/referral/auth data.

## Feature Sequence

1. Plan catalogue and plan detail pages.
2. Server-priced purchase order creation.
3. User purchase history and order detail with manual payment instructions.
4. Private development storage for proof upload.
5. Payment submission workflow.
6. Finance/admin review queue, proof viewing, rejection, and approval.
7. Atomic hen activation on approval.
8. User hen and egg ledger views.
9. Egg accrual service and protected job route.
10. Admin adjustment workflow.
11. Seed data, tests, documentation, and final validation.

## Security Boundaries

- Browser prices are ignored.
- Server validates all quantities, references, file metadata, and status transitions.
- Users can access only their own orders, submissions, proofs, hens, and ledger.
- FINANCE, ADMIN, and SUPER_ADMIN can review payments.
- ADMIN and SUPER_ADMIN can manage plans and manual adjustments.
- Proofs are stored outside `public` and served only through an authorized route.
- Ledger entries are immutable; corrections use new adjustment or reversal entries.
- Egg balance is derived from ledger entries.
- Internal accrual jobs require `EGG_ACCRUAL_JOB_SECRET`.
- Public payouts, egg sales, and referral rewards remain disabled.

## Testing Strategy

- Unit tests for plan validation, price calculation, reference normalization, file validation, production math, ledger balance, and job-secret validation.
- Real PostgreSQL-compatible integration tests using the available Prisma fallback database.
- Playwright coverage for catalogue, checkout, proof upload, finance review, approval, hen activation, accrual, ledger, adjustment, and authorization boundaries.
- Docker validation remains not run on this host.

## Environment Limitations

Docker and `psql` are unavailable locally. Prisma dev PostgreSQL fallback will be used for integration and E2E validation. Docker results must be marked `NOT RUN`.

## Deferred Phase 3 Scope

- Public payouts.
- Egg selling and sale settlement.
- Referral commissions.
- Automated payment gateways.
- Public financial launch.
- Real payment-account onboarding.
- Malware scanning and production object-storage implementation.
- Legal claims about asset ownership, returns, government approval, or tax status.

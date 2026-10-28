# Phase 2 Audit Report

## Verdict

CONDITIONAL PASS for Phase 3 foundation work. Core Phase 2 security and concurrency gaps found during this audit were remediated and covered by tests. Public financial launch remains blocked.

## Database

- Fresh fallback migration passed on Prisma dev PostgreSQL TCP `51246`.
- Phase 1-to-Phase 2 upgrade passed in isolated schema `phase1_upgrade_audit_*`; representative Phase 1 user count remained `1`, and `PurchaseOrder` plus `EggLedgerEntry` existed after upgrade.
- Drift result: `No difference detected.`
- Docker status: `NOT RUN - intentionally deferred`.

## Critical Fixes

- Added migration `202607130002_phase_2_audit_hardening`.
- Added `PurchaseOrder.idempotencyRequestHash` plus `PurchaseOrder_idempotency_hash_pair_check`.
- Reworked purchase creation to use server pricing and PostgreSQL `ON CONFLICT` idempotency.
- Added byte-level proof validation, dimension bounds, path containment tests, and DB-failure cleanup.
- Added proof-upload audit events.
- Reworked payment approval to claim review state inside the transaction.
- Reworked accrual to a single atomic PostgreSQL statement per asset/date.
- Added per-user advisory locks for ledger debits.
- Changed user order URLs to public order references.
- Added Node runtime declarations for private proof and job routes.
- Added constant-time job-secret comparison and future-date rejection.

## Evidence

PostgreSQL constraints found:

- `HenPlan_positive_values_check`
- `PurchaseOrder_positive_values_check`
- `PurchaseOrder_idempotency_hash_pair_check`
- `PaymentProof_metadata_check`
- `HenAsset_positive_values_check`
- `EggLedgerEntry_signed_units_check`

Unique indexes found:

- `PurchaseOrder_orderReference_key`
- `PurchaseOrder_userId_idempotencyKey_key`
- `PaymentSubmission_transactionReferenceNormalized_key`
- `PaymentProof_storageKey_key`
- `PaymentProof_sha256Hash_key`
- `HenAsset_purchaseOrderId_key`
- `EggAccrual_idempotencyKey_key`
- `EggAccrual_henAssetId_productionDate_key`
- `EggLedgerEntry_idempotencyKey_key`

## Tests Added

- `tests/unit/phase2-storage.test.ts`
- `tests/database/phase2-audit.test.ts`
- `tests/e2e/phase2.spec.ts`

## Validation Results

- Unit/integration: 10 files, 37 tests passed.
- PostgreSQL integration: 3 files, 22 tests passed.
- Playwright: 38 tests passed across `chromium` and `mobile-chrome`.
- Production smoke on `next start` port `3120`: health `200`, readiness `200`, sign-in `200`, job without secret `403`.
- `pnpm audit`: no known vulnerabilities.
- `pnpm verify:production-env`: structurally ready with explicit production-like env values.

## NFT Warning

`pnpm build` still emits a non-fatal Turbopack/NFT warning: `src/server/services/private-storage.ts` is traced through `/api/payment-proofs/[id]`.

The route is explicitly Node.js runtime and production `next start` smoke passed. This is documented as a Next.js 16.2.10 Turbopack tracing limitation for local filesystem storage. Production should replace local storage with a production private storage provider before launch.

## Remaining Limitations

- Docker validation is not run.
- Local filesystem proof storage is demo/local only.
- No malware scanning is implemented.
- Egg sales, payouts, refunds, and live referral rewards remain disabled.
- Legal/product readiness remains unresolved.

## Recommendation

Proceed to Phase 3 planning only after accepting the remaining infrastructure/legal blockers. Do not proceed to public financial launch.

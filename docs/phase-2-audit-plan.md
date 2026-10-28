# Phase 2 Audit Plan

## Scope

This pass verifies Phase 2 only. Phase 3 features, egg sale workflows, payouts, and live referral rewards remain out of scope.

## Areas Reviewed First

- `prisma/migrations/202607130001_phase_2_poultry_orders_ledger/migration.sql`
- `prisma/schema.prisma`
- `src/server/services/purchases.ts`
- `src/server/services/payments.ts`
- `src/server/services/private-storage.ts`
- `src/server/services/egg-accrual.ts`
- `src/server/services/egg-ledger.ts`
- `src/app/api/payment-proofs/[id]/route.ts`
- `src/app/api/internal/jobs/egg-accrual/route.ts`
- `tests/database/phase2-flow.test.ts`

## Initial Risks Identified

- Purchase idempotency did not store or compare a request hash.
- Payment-proof upload trusted browser MIME type and did not decode image bytes.
- Stored proof files were not cleaned up when database writes failed.
- Payment review loaded status before the transaction and did not first claim the submission with a guarded update.
- Ledger debits checked balance before the transaction without a per-user lock.
- Job-secret comparison used direct string equality and allowed weak non-production secrets at the route boundary.
- Proof route did not explicitly declare Node.js runtime.
- Phase 2 tests covered one happy path and did not prove replay, tampering, authorization, or concurrency.

## Database Strategy

Use isolated Prisma dev PostgreSQL fallback because Docker is intentionally deferred on this machine. Docker status remains `NOT RUN`.

Validation targets:

- Fresh migration.
- Phase 1-to-Phase 2 upgrade.
- Migration status.
- Drift comparison from datasource to schema.
- Direct PostgreSQL metadata checks for constraints and indexes.

## Concurrency Strategy

Add real PostgreSQL tests for:

- Concurrent duplicate purchase creation.
- Conflicting idempotency keys.
- Concurrent payment approval.
- Concurrent accrual runs.
- Concurrent ledger debits.

## File-Upload Strategy

Add byte-level validation for JPG, PNG, and WebP. Tests must cover invalid bytes with an allowed MIME type, zero-byte uploads, path traversal names, duplicate hashes, and private route authorization.

## Deferred Docker Status

Docker validation is `NOT RUN - intentionally deferred`. This does not block fallback PostgreSQL audit work, but it remains a production-readiness gate.

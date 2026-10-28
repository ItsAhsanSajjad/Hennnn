# Phase 2 Report

## Implemented

- Plan catalogue and admin plan management
- Payment account administration
- Purchase order creation with plan snapshots
- Purchase idempotency request hashing and PostgreSQL `ON CONFLICT` replay protection
- Manual payment proof upload to private storage
- Byte-level proof validation with dimension bounds
- Finance payment review and rejection reasons
- Approval-driven hen asset activation
- Egg accrual job route and CLI with atomic PostgreSQL accrual writes
- Immutable egg ledger entries and admin adjustments
- Per-user advisory locking for negative-balance debit prevention
- Private proof retrieval route
- Seed data for admin, demo user, finance reviewer, plans, and payment accounts
- Phase 2 DB tests covering order replay, authorization, duplicate references, duplicate proof
  hashes, concurrent approval, concurrent accrual, and concurrent debits

## Still Disabled

- Egg sales
- Payouts
- Live referral rewards
- Automated deposits or gateway settlement
- Public financial launch claims

## Environment Note

Docker is not available in this workspace, so database validation used Prisma dev PostgreSQL fallback. Docker-backed PostgreSQL validation remains required before production readiness can be claimed.

## Known Build Warning

Next.js 16.2.10 Turbopack still reports an NFT trace warning for `src/server/services/private-storage.ts` through `/api/payment-proofs/[id]`. The route is explicitly Node runtime and production `next start` smoke testing passed. Production launch should replace local filesystem storage with a production private storage provider.

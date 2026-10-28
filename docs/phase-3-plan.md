# Phase 3 Plan

## Repository State

- Branch inspected: `main`.
- Recent commit inspected: `f81ab87 chore: finalize phase 1 readiness`.
- Worktree state at Phase 3 start: not clean. Phase 2 implementation files, migrations, tests, and docs were already modified or untracked. Phase 3 treats that state as the current baseline and does not revert it.
- Docker status: NOT RUN - intentionally deferred in this environment.
- Product mode remains `DEMO` by default.

## Existing Models Reused

- `User`, `Session`, `ReferralRelationship`, `Notification`, `AuditLog`, and `IdempotencyRecord` remain the identity, session, attribution, message, audit, and retry foundations.
- `PurchaseOrder`, `PaymentSubmission`, `PaymentProof`, `HenAsset`, `EggAccrual`, and `EggLedgerEntry` remain the Phase 2 source of truth for purchases, finance approval, hen activation, production, and eggs.
- Placeholder `EggSaleRequest`, `Payout`, and `ReferralReward` are evolved in place rather than duplicated.

## New And Finalized Models

- `EggSaleRate` stores server-controlled demo sale rates in integer paisa.
- `EggSaleRequest` stores public references, status timeline fields, rate snapshots, amount snapshots, idempotency data, review data, and payout-method linkage.
- `PayoutMethod` stores user payout-method profiles using masked/protected identifiers only.
- `Payout` is finalized as the manual settlement record for an approved sale request.
- `ReferralRule` stores direct Level 1 reward configuration.
- `ReferralReward` stores one reward per direct relationship and qualifying purchase order, linked to one immutable ledger credit.
- `EggLedgerEntry` gains `SALE_RESERVATION`, `SALE_RELEASE`, and `REFERRAL_CREDIT` entry types plus `EGG_SALE` and `REFERRAL_REWARD` source types.

## Migration Strategy

- Add one forward-only migration: `202607130003_phase_3_egg_sales_referrals_settlements`.
- Preserve Phase 1 and Phase 2 migrations.
- Alter placeholder tables in place.
- Add PostgreSQL check constraints for positive quantities, integer paisa amounts, valid dates, valid sale snapshots, and signed ledger entries.
- Add uniqueness for sale public references, sale idempotency, one reservation per sale, one release per sale, one settlement per sale, settlement reference normalization, and one referral reward per relationship and qualifying purchase.

## Egg Reservation Design

- Canonical available balance is `SUM("EggLedgerEntry"."eggUnits")` for the user.
- Credits are positive.
- Debits and sale reservations are negative.
- Sale releases are positive compensating entries.
- Submission inserts an `EggSaleRequest` and a `SALE_RESERVATION` ledger entry in one transaction.
- Cancellation and rejection insert one `SALE_RELEASE` entry in the same transaction as the status transition.
- Approval and paid transitions do not debit eggs again.

## Payout And Settlement Design

- The application records manual settlement metadata only.
- There is no external transfer API, bank API, wallet API, Easypaisa API, JazzCash API, or crypto integration.
- User payout methods are masked in all UI and audit paths.
- Settlement amount is always copied from the server-calculated sale amount snapshot.
- A sale moves to `PAID` only when a finance/admin user confirms the manual settlement record.

## Referral Reward Design

- Only direct Level 1 relationships are eligible.
- Registration alone is not a qualifying event.
- The qualifying event is approval of the invitee's purchase order.
- The inviter receives a configured whole-egg reward through one immutable `REFERRAL_CREDIT` ledger entry.
- `ReferralReward` has a unique `(relationshipId, qualifyingPurchaseOrderId)` constraint to block duplicates.
- No Level 2 or multi-level reward path is implemented.

## Authorization Matrix

- `USER`: create own payout methods, view own sale/referral data, submit eligible sale requests, cancel own `SUBMITTED` sale requests.
- `FINANCE`: view sale queue, claim sales, approve/reject sales, record and confirm manual settlements, view finance reports.
- `ADMIN`: all finance permissions plus sale-rate, referral-rule, reconciliation, and operational configuration.
- `SUPER_ADMIN`: all admin permissions and sensitive future policy authority.

Every action and service rechecks authorization server-side.

## Security Risks And Controls

- Client cannot provide sale rate, sale amount, user id, review role, settlement amount, or ledger effect.
- Server actions validate input with Zod.
- Sale submission and ledger debits use per-user PostgreSQL advisory transaction locks.
- Idempotency keys are scoped by user and request hash.
- Payout identifiers are masked and not logged in full.
- Audit metadata remains bounded and excludes secrets/raw payout identifiers.
- Production mode remains blocked for public financial launch pending legal, provider, encryption, storage, tax, anti-fraud, and accessibility approvals.

## Transaction Boundaries

- Sale submission: authenticate, reload user, rate lookup, payout-method check, hen eligibility, user ledger lock, balance calculation, sale insert, reservation insert, notification, audit.
- Sale cancellation: authenticate owner, user ledger lock, status guard, sale update, release insert, notification, audit.
- Finance review: authorize reviewer, guarded status update, approval or rejection, release on rejection, notification, audit.
- Settlement: authorize finance/admin, lock sale, copy server amount, create/confirm settlement, mark paid, notification, audit.
- Referral reward: purchase approval transaction triggers direct reward creation and immutable ledger credit.

## Concurrency Strategy

- Per-user advisory locks protect all egg-balance debits and sale releases.
- Unique indexes protect idempotency, reservations, releases, settlement references, one settlement per sale, and one reward per qualifying event.
- Guarded `updateMany` status transitions prevent double review and double paid transitions.
- Reconciliation detects invariant drift without auto-repair.

## Testing Strategy

- Unit tests cover validation, exact money math, masking, status transitions, idempotency hashing, referral eligibility, and reconciliation detection.
- PostgreSQL integration tests cover valid sale submission, insufficient balance, no eligible hen, idempotency, cancellation, review, settlement, referral rewards, and ledger effects.
- Concurrency tests cover overspend, duplicate idempotency, cancel/review races, approval/rejection races, settlement confirmation races, and referral reward duplicate triggers.
- Playwright tests cover the main user, finance, payout, referral, notification, and responsive paths with a serious/critical accessibility scan where tooling is available.

## Deferred Scope

- Docker validation: NOT RUN.
- Production private object storage, malware scanning, payout-method encryption, external settlement providers, legal classification, tax policy, anti-fraud policy, public launch approval, and complete axe audit remain deferred.
- No public financial launch is enabled by Phase 3.

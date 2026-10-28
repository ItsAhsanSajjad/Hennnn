# Egg Ledger

Phase 2 treats egg units as an append-only accounting ledger.

- Production credits are written by the accrual job.
- Admin credits and debits are written through `/admin/ledger`.
- Admin debits are blocked when they would make the user's egg balance negative.
- Debits use a per-user PostgreSQL advisory transaction lock before reading balance and inserting the debit.
- Ledger rows have idempotency keys and source metadata.
- Existing ledger rows are not updated by application code.

## Phase 3 Entries

- `SALE_RESERVATION` entries are negative and are created atomically with an `EggSaleRequest`.
- `SALE_RELEASE` entries are positive compensating entries created on user cancellation or finance rejection.
- `REFERRAL_CREDIT` entries are positive and credit direct Level 1 referral rewards after qualifying approved purchases.

Approval and paid settlement transitions do not create another egg debit. Manual settlement records affect monetary workflow state only.

## Invariants

- Available balance is `SUM("EggLedgerEntry"."eggUnits")` for the user.
- One reservation is allowed per sale request.
- One release is allowed per sale request.
- Approved or paid sale requests must not have a release entry.
- Rejected and cancelled sale requests should have a release entry.
- One referral credit is allowed per referral reward.

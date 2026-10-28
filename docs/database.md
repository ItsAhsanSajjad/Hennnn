# Database

PostgreSQL is the source of truth. Prisma migrations live in `prisma/migrations`.

The active schema uses PakHen-owned credentials and session tables. A follow-up audit migration, `202607120002_remove_unused_authjs_models`, removes unused Auth.js adapter-only tables from earlier scaffolding.

## Core Entities

- `User` - identity, role, status, referral code, password hash
- `Session` - database-backed session records using hashed tokens
- `ReferralRelationship` - one inviter per invitee
- `LegalAcceptance` - terms/privacy consent versions
- `AuditLog` - security and admin event trail
- `PasswordResetToken` - hashed reset tokens with expiration and one-time use
- `Notification` - account and system messages
- `AppSetting` - application settings
- `IdempotencyRecord` - future safe retry foundation

## Phase 3 Entities

Phase 2 activates `HenPlan`, `PurchaseOrder`, `PaymentSubmission`, `PaymentProof`, `HenAsset`, `EggAccrual`, and `EggLedgerEntry` for demo manual-payment and egg-accrual workflows.

Phase 3 finalizes:

- `EggSaleRate` - server-controlled demo egg-sale rates in integer paisa.
- `EggSaleRequest` - sale public reference, status timeline, rate snapshot, amount snapshot, payout-method link, and idempotency data.
- `PayoutMethod` - user payout-method profile with masked/protected identifiers only.
- `Payout` - manual settlement record for one approved sale request.
- `ReferralRule` - direct Level 1 reward configuration.
- `ReferralReward` - one direct reward per relationship and qualifying purchase, linked to one ledger credit.

## Constraints

The initial migration adds unique constraints for username, phone, referral code, sessions, and referral invitees. Extra PostgreSQL checks enforce no self-referral, lowercase normalized usernames, positive money/quantity values, valid expiration dates, and valid hen asset date windows.

Phase 2 critical constraints include `HenPlan_positive_values_check`, `PurchaseOrder_positive_values_check`, `PurchaseOrder_idempotency_hash_pair_check`, `PaymentProof_metadata_check`, `HenAsset_positive_values_check`, and `EggLedgerEntry_signed_units_check`. Unique indexes protect order references, order idempotency, normalized payment references, proof storage keys, proof hashes, one hen asset per order, one accrual per hen/date, accrual idempotency, and ledger idempotency.

Phase 3 adds `EggSaleRate_positive_rate_check`, `EggSaleRate_effective_window_check`, `EggSaleRequest_positive_snapshot_check`, `PayoutMethod_mask_check`, `Payout_positive_amount_check`, `ReferralRule_positive_reward_check`, `ReferralRule_effective_window_check`, `ReferralReward_positive_egg_units_check`, and `ReferralReward_no_self_reward_check`. Unique indexes protect sale public references, sale idempotency, one active rate per code, one default active payout method per user, one settlement per sale, normalized settlement references, one active referral rule per code, one reward per direct relationship and qualifying purchase, one sale reservation per sale, one release per sale, and one referral credit per reward.

## Money and Eggs

Money is stored as integer paisa using `BigInt`. Eggs are stored as whole integer units. Egg balances are calculated from immutable ledger entries, not editable balance fields. Sale reservations are negative ledger entries; sale releases and referral rewards are positive ledger entries.

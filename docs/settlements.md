# Settlements

Phase 3 settlements are manual records only. PakHen does not integrate live payout, bank, Easypaisa, JazzCash, wallet, or cryptocurrency transfer APIs.

## Payout-Method Privacy

Users create payout-method profiles in demo mode. The application stores masked/protected identifiers and last-four values only. Production payout-method encryption remains a public-launch blocker.

## Settlement Statuses

- `RECORDED`: finance/admin recorded a manual settlement reference for an approved sale.
- `CONFIRMED`: finance/admin confirmed the manual settlement and the sale moved to `PAID`.
- `FAILED`: finance/admin marked the settlement failed.
- `CANCELLED`: reserved for controlled future cancellation policy.

## Paid Transition

`confirmManualSettlement` verifies:

- Actor is finance/admin.
- Settlement is `RECORDED`.
- Sale is `APPROVED`.
- Amount is copied from `EggSaleRequest.totalAmountPaisa`.

Then it marks settlement `CONFIRMED` and sale `PAID`. Egg balance does not change.

## Duplicate Prevention

- `Payout.eggSaleRequestId` is unique.
- `Payout.settlementReferenceNormalized` is unique.
- The service returns an existing settlement if the sale already has one.

## External Providers

No external provider adapter exists in Phase 3. Any future provider requires legal approval, settlement reconciliation policy, secret management, audit review, and production readiness updates.

# Egg Sales

Phase 3 egg sales are demo-only review requests. They do not guarantee approval, value, payout speed, or public financial launch readiness.

## Eligibility

A user may submit only when all server checks pass:

- The user account is active.
- The user has at least one approved non-refunded hen asset.
- The user has positive available egg balance.
- The user has an active masked payout method.
- An active `DEMO-EGG-SALE` rate exists and is effective.

Current asset activity does not erase legitimately accrued eggs. The approved non-refunded hen condition accepts approved hen assets except `PENDING_ACTIVATION`, `CANCELLED`, and `REFUNDED`.

## Rate Snapshots

`EggSaleRate` stores integer `ratePaisaPerEgg`. Users cannot supply rates. `EggSaleRequest` stores `rateCodeSnapshot`, `ratePaisaPerEggSnapshot`, and `totalAmountPaisa`.

Amount calculation:

```text
totalAmountPaisa = eggQuantity * ratePaisaPerEgg
```

## Reservation

Submission creates one `SALE_RESERVATION` ledger entry:

- Negative `eggUnits`
- `sourceType = EGG_SALE`
- `sourceId = EggSaleRequest.id`
- Unique idempotency key `sale-reservation:{saleRequestId}`

Available balance decreases immediately.

## Cancellation

Only `SUBMITTED` requests can be cancelled by the owner. Cancellation creates one positive `SALE_RELEASE` entry and marks the sale `CANCELLED`.

## Review

Finance/admin users can claim, approve, or reject. Approval preserves the reservation and does not debit eggs again. Rejection creates one positive `SALE_RELEASE` entry.

## Paid State

Paid state is reached only after a manual settlement record is confirmed. Paid transition does not create another egg ledger entry.

## Concurrency Rules

Sale submission and release paths take a per-user PostgreSQL advisory transaction lock. Unique indexes enforce one reservation and one release per sale request.

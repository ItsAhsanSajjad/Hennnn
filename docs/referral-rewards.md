# Referral Rewards

Phase 3 implements direct Level 1 demo referral rewards only.

## Scope

- Direct inviter to invitee only.
- No registration-only reward.
- No Level 2 or multi-level reward.
- No cash commission.
- No public earnings claim.

## Qualifying Event

The qualifying event is approval of the invitee's purchase order. The reward is triggered inside the finance approval transaction after the purchase is marked `APPROVED`.

## Idempotency

`ReferralReward` is unique by `(relationshipId, qualifyingPurchaseOrderId)`. The ledger credit uses idempotency key:

```text
ledger:referral-reward:{relationshipId}:{purchaseOrderId}
```

Concurrent triggers create at most one reward and one ledger credit.

## Ledger Credit

Rewards credit whole egg units through one immutable `REFERRAL_CREDIT` entry with `sourceType = REFERRAL_REWARD`.

## Privacy

Referral dashboards show masked invitee identity only. Private phone and payout data are not exposed to inviters.

## Reversal Boundary

Phase 3 does not implement automatic reversal of credited referral rewards. Any future reversal must use an explicit compensating ledger model, audit logs, and legal/product approval.

# Reconciliation

Phase 3 reconciliation is detection-only by default. It does not repair or mutate financial records during detection.

## Checks

`runPhase3Reconciliation` detects:

- Sale without reservation
- Reservation without sale
- Rejected sale without release
- Cancelled sale without release
- Approved or paid sale with release
- Paid sale without confirmed settlement
- Duplicate settlement
- Referral reward without ledger entry
- Referral ledger entry without reward
- Rate/amount mismatch
- Negative available balance

## Commands

```powershell
pnpm reconcile:phase3
pnpm reconcile:phase3:json
```

## Safe Repair Policy

Phase 3 does not perform automatic repair. Any repair must be a separate controlled workflow with role authorization, audit logging, and compensating immutable ledger entries where egg balances are involved.

## Audit

Admin-triggered reconciliation runs should create a `RECONCILIATION_RUN` audit event. Passive page display uses read-only detection without creating a state-changing GET request.

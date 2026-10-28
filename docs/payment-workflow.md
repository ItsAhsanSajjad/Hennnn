# Payment Workflow

Phase 2 uses manual payment review in demo mode.

1. A user selects an active hen plan and creates a purchase order.
2. The order stores plan snapshots: price, daily egg units, maximum egg units, validity, and terms version.
3. The user sends funds outside the app using an active admin-managed payment account.
4. The user uploads a JPG, PNG, or WebP receipt image. The file is written to private storage, not `public/`.
5. A finance reviewer opens `/admin/payments`, inspects the private proof link, and approves or rejects the submission.
6. Approval marks the order and submission approved and creates one active hen asset.
7. Rejection returns the order to a rejected state with a reason so the user can resubmit proof.

Automated deposits, gateway settlement, refunds, and external payouts are outside Phase 2.

## Phase 3 Manual Settlement

Phase 3 adds manual settlement records for approved demo egg-sale requests:

1. User submits an egg-sale request.
2. The system reserves eggs through the immutable ledger.
3. Finance approves or rejects the request.
4. If approved, finance records a manual settlement reference.
5. Finance confirms the manual settlement.
6. The sale is marked `PAID`.

No external payout transfer is executed by the application. Settlement amount is copied from the server-calculated sale snapshot and does not create another egg ledger debit.

Security notes:

- Order totals are calculated from the server-loaded plan only.
- Idempotency keys are scoped to user and request hash.
- Duplicate transaction references are rejected after normalization.
- Duplicate proof bytes are rejected by SHA-256 hash.
- Approval uses guarded status transitions and creates at most one hen asset per order.
- Sale settlement is manual, server-amount-controlled, and one confirmed settlement is allowed per sale.

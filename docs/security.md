# Security

## Threat Model

Phase 1 protects against credential stuffing, account enumeration, weak passwords, client-side privilege escalation, unsafe session storage, referral tampering, and sensitive audit leakage.

Phase 2 adds manual-payment, private proof, finance review, hen activation, accrual, and ledger risks. Phase 3 adds demo egg-sale, reservation, manual settlement, payout-method profile, and direct referral reward risks. These are constrained to demo mode and do not enable public financial launch or external payout transfers.

## Controls

- Argon2id password hashing
- Server-side Zod validation
- Database uniqueness and check constraints
- HTTP-only session cookies
- Hashed session tokens in the database
- Generic authentication errors
- Rate-limit provider boundary with memory for development/demo and Redis configuration required for production launch mode
- Server-side route and action authorization
- Audit logging for registration, login, password reset, referral, and admin actions
- Security headers in `next.config.ts`
- Same-origin checks for mutating requests in `src/proxy.ts`
- No authentication tokens in localStorage
- Private proof storage outside `public/`
- Byte-level payment-proof image validation
- Payment review and ledger adjustment role checks
- PostgreSQL idempotency and concurrency controls for orders, approvals, accruals, and debits
- Server-controlled egg-sale rates and integer paisa calculations
- Per-user advisory locks for sale reservations and releases
- Sale idempotency scoped by user and request hash
- Manual settlement amount copied from sale snapshots
- Payout identifiers masked in UI and audit metadata
- Direct Level 1 referral reward uniqueness by relationship and qualifying purchase
- Reconciliation detection without automatic repair

## Secrets

`.env` is ignored. `.env.example` contains placeholders only. Production launch mode (`PRODUCT_MODE=PRODUCTION`) rejects development secrets, local HTTP application URLs, development notification delivery, missing provider credentials, and memory-only rate limiting.

## Remaining Production Work

Before launch, configure Redis-backed rate limits, real notification providers, private storage scanning for payment proofs, payout-method encryption, settlement provider approval, legal copy, incident logging, monitoring, anti-fraud review, tax treatment, and deployment-specific CSP review. Run `pnpm verify:production-env` before deploying.

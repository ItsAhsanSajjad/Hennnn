# Authentication

PakHen uses credentials authentication with database-backed sessions.

## Registration

- Username: 4-24 characters, letters/numbers/underscore, case-insensitive uniqueness
- Phone: normalized to Pakistan E.164 mobile format
- Password: 10-128 characters, hashed with Argon2id
- Consent: terms and privacy versions are stored per user
- Referral: valid active referral codes attach one inviter relationship

## Login

Users sign in with username or Pakistani phone number. Invalid credentials return a generic message. Suspended, disabled, deleted, and inactive users are blocked.

## Sessions

The browser stores only a random session token in an HTTP-only cookie. The database stores a SHA-256 hash of that token in the `Session` table.

Session lookup rejects expired records, suspended users, disabled users, and soft-deleted users. Rejected session records are deleted as part of lookup cleanup.

## Password Recovery

The reset flow stores only hashed high-entropy tokens, applies expiration, marks tokens used, invalidates active sessions, and records audit events. Production delivery requires a configured SMS or email provider.

## Auth.js Boundary

The Phase 1 audit found Auth.js packages and adapter models were present but not wired into the runtime. Stable `next-auth` credentials authentication is coupled to JWT sessions, which conflicts with the Phase 1 requirement for first-party database-backed credentials sessions. The application therefore uses one custom architecture instead of a misleading hybrid.

Remediation completed:

- Removed unused `next-auth` and `@auth/prisma-adapter` dependencies.
- Removed adapter-only Prisma models (`Account`, `VerificationToken`, `Authenticator`).
- Added migration `202607120002_remove_unused_authjs_models`.
- Added database integration tests for registration, login, sessions, password reset, referral attribution, and admin protections.

The remaining `Session` model is PakHen's own hashed-token session table, not an Auth.js adapter table.

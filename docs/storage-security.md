# Storage Security

Payment proofs are private Phase 2 assets.

- Uploads accept JPG, PNG, and WebP only.
- Server-side validation checks image bytes and rejects files that only pretend to be images.
- PNG/JPEG dimensions are decoded; extended WebP dimensions are decoded.
- Images larger than 10,000 pixels in either dimension are rejected.
- `PAYMENT_PROOF_MAX_BYTES` limits receipt size.
- Files are stored under `PRIVATE_STORAGE_DIR`, which defaults to `.private-storage`.
- Proofs are never stored in `public/`.
- Database rows store a storage key, safe display name, MIME type, size, and SHA-256 hash.
- Duplicate SHA-256 proof hashes are rejected by PostgreSQL.
- `/api/payment-proofs/[id]` authorizes the owner or finance/admin reviewers before reading the file.
- Proof responses use `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`.

Production launch still requires a production-grade private storage provider, retention policy, access logging, and deletion process.

Known limitation: local private storage uses Node filesystem APIs and triggers a non-fatal Turbopack NFT trace warning in Next.js 16.2.10 builds. The proof route is Node-only and was smoke-tested under `next start`.

## Phase 3 Note

Payout-method profiles store masked/protected identifiers only in the demo build. Real payout-account storage remains blocked until encryption, retention, access logging, provider approval, and legal review are completed. Manual settlement records store masked payout snapshots and external reference text only; no provider transfer files are stored by Phase 3.

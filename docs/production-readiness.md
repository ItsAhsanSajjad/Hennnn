# Production Readiness

Every unresolved item in this checklist blocks public financial launch.

## Legal and Business

- [ ] Confirm legal business entity. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm business address. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm support contact details. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm privacy-policy owner. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm terms version. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm product classification. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm whether a hen represents a real asset, simulation, participation product, or contractual agricultural product. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm egg ownership rules. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm production rules. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm expiry rules. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm refund policy. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm dispute process. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm manual payment handling. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm payout handling. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm payout-method encryption and masking policy. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm external settlement-provider approval. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm settlement reconciliation operating procedure. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm referral reward eligibility. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm referral reward legal review. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm consumer disclosures for egg-sale requests. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm egg-sale valuation policy. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm tax obligations. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm tax treatment of manual settlements and referral rewards. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm anti-fraud review for sale and referral workflows. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm consumer-protection obligations. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm data-retention requirements. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm SMS consent requirements. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm marketing consent requirements. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm payment-proof retention rules. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Confirm whether financial, investment, crowdfunding, or securities regulation could apply. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Obtain review from qualified Pakistani legal and accounting professionals. BLOCKS PUBLIC FINANCIAL LAUNCH.

PakHen must not claim FBR verification, government approval, guaranteed return, guaranteed income, risk-free earning, or ownership of real poultry unless independently verified documentation is provided later.

## Technical Launch Gates

- [ ] Docker PostgreSQL validation completed on a Docker-enabled host.
- [ ] Production `AUTH_SECRET` generated and stored in secret management.
- [ ] Redis or equivalent distributed rate limiter configured.
- [ ] SMS or email provider configured and tested without logging raw reset tokens.
- [ ] Private storage provider configured before enabling proof uploads.
- [ ] Production private storage provider configured before enabling financial document uploads. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Malware scanning configured for uploaded financial proof files. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Payout-method encryption implemented and validated. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Payment-proof retention and deletion process implemented for production storage.
- [ ] Data-retention schedule approved for payout methods, settlement records, referral rewards, and ledger records. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Egg accrual job secret configured and rotated through secret management.
- [ ] Finance review operating procedure approved.
- [ ] Manual payment account ownership independently verified.
- [ ] Manual settlement operating procedure approved. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Ledger adjustment approval policy defined.
- [ ] Database backup and restore process tested.
- [ ] Full accessibility audit completed for Phase 3 sale, settlement, referral, and reconciliation pages. BLOCKS PUBLIC FINANCIAL LAUNCH.
- [ ] Monitoring, uptime checks, and error reporting configured.
- [ ] Admin account creation process documented without development seed passwords.

## Phase 2 Validation Note

This workspace validated Phase 2 against Prisma dev PostgreSQL fallback because Docker is not available in the current environment. Docker-backed validation remains a production-readiness gate and must not be marked complete from this run.

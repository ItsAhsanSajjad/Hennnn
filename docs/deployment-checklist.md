# Deployment Checklist

## Environment

- [ ] `pnpm verify:production-env` passes with production secrets.
- [ ] `NODE_ENV=production`.
- [ ] `PRODUCT_MODE=PRODUCTION`.
- [ ] `APP_URL` and `NEXT_PUBLIC_APP_URL` use HTTPS.
- [ ] Strong `AUTH_SECRET` stored outside source control.
- [ ] `DATABASE_URL` and migration connection values are correct.
- [ ] Redis or equivalent distributed rate limiter configured.
- [ ] Production notification provider configured.
- [ ] Private storage provider configured before enabling uploads.
- [ ] Payout-method encryption configured before enabling production settlement workflows.
- [ ] External settlement provider, if any, legally and technically approved.

## Database

- [ ] Backups enabled.
- [ ] Restore tested.
- [ ] Migration deployment rehearsed.
- [ ] `pnpm db:migrate:status` reports current.
- [ ] Schema drift check reports no difference.
- [ ] Development seed credentials are not used for production admin setup.

## Application

- [ ] `pnpm check` passes.
- [ ] `pnpm check:phase3` passes in a PostgreSQL-backed environment.
- [ ] `pnpm check:full` passes in a PostgreSQL-backed environment.
- [ ] `pnpm reconcile:phase3` reports no critical findings.
- [ ] `/api/health` returns process health.
- [ ] `/api/ready` returns database readiness.
- [ ] HTTPS, DNS, and secure cookies verified.
- [ ] Monitoring, error reporting, and uptime checks configured.
- [ ] Rollback plan documented and tested.

## Operations

- [ ] Admin account creation process approved.
- [ ] Incident-response owner assigned.
- [ ] Support channel active.
- [ ] Backup retention policy approved.
- [ ] Controlled beta release criteria documented.
- [ ] Docker validation completed on a Docker-enabled host; current local status is NOT RUN.
- [ ] Phase 3 accessibility audit completed for sale, payout-method, referral, finance, and reconciliation pages.
- [ ] Public financial launch blocked until `docs/production-readiness.md` is complete.

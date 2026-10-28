# PakHen Phase 1 Implementation Plan

## Repository Discovery

- Workspace: `D:\pak_hen`
- Repository state before work: empty directory, not a Git repository.
- Existing framework: none.
- Existing package manager: none selected by project; Phase 1 will use pnpm.
- Existing source, routes, components, auth, database, tests, deployment files: none found.

## Architecture Direction

Phase 1 will scaffold an original Next.js App Router application using TypeScript strict mode, Tailwind CSS, Prisma, PostgreSQL, Argon2id password hashing, Zod validation, role-based authorization, database-backed sessions, and a mobile-first interface.

The application will centralize brand and site configuration in `src/config`, keep server-only database and security logic under `src/lib` and `src/server`, and separate UI components from route handlers and server actions.

## Implementation Steps

1. Create the application scaffold, package scripts, environment examples, Docker Compose, CI, linting, formatting, testing, and TypeScript configuration.
2. Add centralized PakHen brand, navigation, validation, environment, security, formatting, and authorization utilities.
3. Create the Prisma schema, migration SQL, seed script, and PostgreSQL development setup.
4. Implement registration, referral attribution, login, logout, password reset foundation, protected dashboard, and admin foundation.
5. Build accessible public, auth, legal, dashboard, admin, error, and not-found pages.
6. Add unit, integration, and Playwright end-to-end tests for the requested Phase 1 flows.
7. Document architecture, database, authentication, security, product rules, and final Phase 1 results.
8. Run formatting, linting, type checking, tests, end-to-end tests where possible, and production build; record exact results in `docs/phase-1-report.md`.

## Phase 1 Boundaries

- No real deposits, payouts, guaranteed returns, daily earnings, live referral commissions, balance editing, or enabled purchase/sale workflows.
- Future transactional models may exist in the database to validate architecture, but public transaction actions remain disabled.
- Unverified legal, business, registration, support, ownership, and certification details remain neutral placeholders.

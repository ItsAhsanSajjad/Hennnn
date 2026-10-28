# Docker Validation

Docker is required for a full Phase 1 PASS. Do not claim Docker validation passed unless these commands run successfully against Docker PostgreSQL.

## Prerequisites

- Docker Desktop or Docker Engine with Compose.
- At least 10 GB free disk space on the Docker data drive.
- Node.js 24 and pnpm 11.7.0.
- No unrelated service bound to the selected PostgreSQL port.

## Start PostgreSQL

```powershell
docker compose config
docker compose pull
docker compose up -d postgres
docker compose ps
docker compose exec postgres pg_isready -U pakhen -d pakhen_dev
docker compose exec postgres psql -U pakhen -d pakhen_dev -c "select version();"
```

Use this URL for local validation, with the password kept out of logs where possible:

```text
postgresql://pakhen:<redacted>@localhost:5432/pakhen_dev?schema=public
```

## Migrate and Seed

```powershell
$env:DATABASE_URL="postgresql://pakhen:pakhen_dev_password@localhost:5432/pakhen_dev?schema=public"
$env:DIRECT_DATABASE_URL=$env:DATABASE_URL
$env:AUTH_SECRET="local-docker-auth-secret-change-before-launch"
$env:PRODUCT_MODE="DEMO"
pnpm install --frozen-lockfile
pnpm prisma format
pnpm prisma validate
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:migrate:status
pnpm prisma migrate diff --exit-code --from-config-datasource --to-schema=prisma/schema.prisma
pnpm db:seed
pnpm db:seed
```

The second seed must not duplicate development users, referral relationships, hen plans, sessions, or application settings.

## Test Database

```powershell
docker compose --profile test up -d postgres-test
$env:DATABASE_URL="postgresql://pakhen:pakhen_test_password@localhost:55432/pakhen_test?schema=public"
$env:DIRECT_DATABASE_URL=$env:DATABASE_URL
pnpm db:migrate:deploy
pnpm test:db
pnpm db:seed
pnpm db:seed
pnpm test:e2e
```

## Persistence Test

```powershell
docker compose exec postgres psql -U pakhen -d pakhen_dev -c "select count(*) from \"User\";"
docker compose stop postgres
docker compose up -d postgres
docker compose exec postgres pg_isready -U pakhen -d pakhen_dev
docker compose exec postgres psql -U pakhen -d pakhen_dev -c "select count(*) from \"User\";"
pnpm db:migrate:status
```

Counts and migration status must remain stable after restart.

## Development Reset

The reset command is development-only and guarded:

```powershell
$env:PRODUCT_MODE="DEMO"
$env:PAKHEN_CONFIRM_DOCKER_RESET="pakhen-dev-reset"
pnpm docker:reset
docker compose up -d postgres
pnpm db:migrate:deploy
pnpm db:seed
```

Never run Docker volume reset with production credentials or `PRODUCT_MODE=PRODUCTION`.

## Troubleshooting

- If `docker` is not recognized, install Docker Desktop for Windows and restart the terminal.
- If port 5432 is occupied, set `POSTGRES_PORT` in `.env`.
- If tests need isolation, use `postgres-test` on `POSTGRES_TEST_PORT` instead of the development database.
- If disk is low on `C:`, move Docker Desktop data to a drive with adequate space before pulling images.

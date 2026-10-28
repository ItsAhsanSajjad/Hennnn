-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EGG_MARKET_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EGG_MARKET_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EGG_MARKET_SALE_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EGG_MARKET_SALE_REVERSED';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EggMarketSaleStatus" AS ENUM ('COMPLETED', 'REVERSED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "EggMarket" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "minEggs" INTEGER NOT NULL DEFAULT 1,
    "maxEggs" INTEGER NOT NULL DEFAULT 100,
    "pricePerEggPaisa" BIGINT NOT NULL,
    "icon" VARCHAR(80),
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "dailyLimitEggs" INTEGER,
    "totalCapacityEggs" INTEGER,
    "totalEggsPurchased" INTEGER NOT NULL DEFAULT 0,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "EggMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EggMarketSale" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicReference" VARCHAR(40) NOT NULL,
    "userId" UUID NOT NULL,
    "marketId" UUID NOT NULL,
    "eggQuantity" INTEGER NOT NULL,
    "pricePerEggPaisaSnapshot" BIGINT NOT NULL,
    "totalAmountPaisa" BIGINT NOT NULL,
    "status" "EggMarketSaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "eggLedgerEntryId" UUID,
    "idempotencyKey" VARCHAR(120) NOT NULL,
    "idempotencyRequestHash" VARCHAR(128),
    "metadata" JSONB,
    "reversedAt" TIMESTAMP(3),
    "reversedByUserId" UUID,
    "reversalReason" VARCHAR(500),
    "reversalEggLedgerEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EggMarketSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EggMarket_code_key" ON "EggMarket"("code");
CREATE INDEX IF NOT EXISTS "EggMarket_isActive_isPaused_displayOrder_idx" ON "EggMarket"("isActive", "isPaused", "displayOrder");
CREATE INDEX IF NOT EXISTS "EggMarket_archivedAt_idx" ON "EggMarket"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EggMarketSale_publicReference_key" ON "EggMarketSale"("publicReference");
CREATE UNIQUE INDEX IF NOT EXISTS "EggMarketSale_eggLedgerEntryId_key" ON "EggMarketSale"("eggLedgerEntryId");
CREATE UNIQUE INDEX IF NOT EXISTS "EggMarketSale_reversalEggLedgerEntryId_key" ON "EggMarketSale"("reversalEggLedgerEntryId");
CREATE UNIQUE INDEX IF NOT EXISTS "EggMarketSale_userId_idempotencyKey_key" ON "EggMarketSale"("userId", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "EggMarketSale_userId_status_idx" ON "EggMarketSale"("userId", "status");
CREATE INDEX IF NOT EXISTS "EggMarketSale_marketId_idx" ON "EggMarketSale"("marketId");
CREATE INDEX IF NOT EXISTS "EggMarketSale_status_createdAt_idx" ON "EggMarketSale"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "EggMarketSale_createdAt_idx" ON "EggMarketSale"("createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "EggMarket" ADD CONSTRAINT "EggMarket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EggMarket" ADD CONSTRAINT "EggMarket_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EggMarketSale" ADD CONSTRAINT "EggMarketSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EggMarketSale" ADD CONSTRAINT "EggMarketSale_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "EggMarket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EggMarketSale" ADD CONSTRAINT "EggMarketSale_eggLedgerEntryId_fkey" FOREIGN KEY ("eggLedgerEntryId") REFERENCES "EggLedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EggMarketSale" ADD CONSTRAINT "EggMarketSale_reversalEggLedgerEntryId_fkey" FOREIGN KEY ("reversalEggLedgerEntryId") REFERENCES "EggLedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "EggMarketSale" ADD CONSTRAINT "EggMarketSale_reversedByUserId_fkey" FOREIGN KEY ("reversedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

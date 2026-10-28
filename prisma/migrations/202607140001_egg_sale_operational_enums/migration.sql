-- Add operational enum values in their own migration. PostgreSQL requires a commit
-- before an enum value can be used by defaults, constraints, or data updates.
ALTER TYPE "EggSaleStatus" ADD VALUE IF NOT EXISTS 'AWAITING_REVIEW';
ALTER TYPE "EggSaleStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_PROCESSING';
ALTER TYPE "EggLedgerEntryType" ADD VALUE IF NOT EXISTS 'SALE_FINALIZED';

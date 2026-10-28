-- Immutable payout snapshots make a submitted egg-sale request independent from
-- future payout-method changes. Nullable columns retain compatibility with old rows.
ALTER TABLE "EggSaleRequest"
  ADD COLUMN "payoutProviderSnapshot" "PayoutMethodProvider",
  ADD COLUMN "payoutAccountTitleSnapshot" VARCHAR(120),
  ADD COLUMN "payoutIdentifierMaskedSnapshot" VARCHAR(180),
  ADD COLUMN "paymentProcessingAt" TIMESTAMP(3);

UPDATE "EggSaleRequest" AS sale
SET
  "payoutProviderSnapshot" = method."provider",
  "payoutAccountTitleSnapshot" = method."accountTitle",
  "payoutIdentifierMaskedSnapshot" = method."accountIdentifierProtected"
FROM "PayoutMethod" AS method
WHERE sale."payoutMethodId" = method."id"
  AND sale."payoutProviderSnapshot" IS NULL;

-- Existing lifecycle rows are migrated into the current operations vocabulary.
UPDATE "EggSaleRequest"
SET "status" = 'AWAITING_REVIEW'
WHERE "status" IN ('DRAFT', 'SUBMITTED');

UPDATE "EggSaleRequest"
SET
  "status" = 'PAYMENT_PROCESSING',
  "paymentProcessingAt" = COALESCE("approvedAt", "reviewedAt", "updatedAt")
WHERE "status" = 'APPROVED';

ALTER TABLE "EggSaleRequest"
  ALTER COLUMN "status" SET DEFAULT 'AWAITING_REVIEW';

-- Reservation remains the balance-moving debit. Finalization is a zero-unit,
-- append-only ledger event proving that the reserved eggs were settled.
ALTER TABLE "EggLedgerEntry" DROP CONSTRAINT IF EXISTS "EggLedgerEntry_signed_units_check";
ALTER TABLE "EggLedgerEntry" ADD CONSTRAINT "EggLedgerEntry_signed_units_check" CHECK (
  (
    "entryType" IN (
      'PRODUCTION_CREDIT',
      'ADMIN_CREDIT',
      'REVERSAL',
      'FUTURE_REFERRAL_CREDIT',
      'SALE_RELEASE',
      'REFERRAL_CREDIT'
    )
    AND "eggUnits" > 0
  )
  OR
  (
    "entryType" IN (
      'ADMIN_DEBIT',
      'FUTURE_SALE_HOLD',
      'FUTURE_SALE_DEBIT',
      'SALE_RESERVATION'
    )
    AND "eggUnits" < 0
  )
  OR ("entryType" = 'SALE_FINALIZED' AND "eggUnits" = 0)
);

CREATE UNIQUE INDEX "EggLedgerEntry_sale_finalized_once_key"
  ON "EggLedgerEntry"("sourceType", "sourceId", "entryType")
  WHERE "sourceType" = 'EGG_SALE' AND "entryType" = 'SALE_FINALIZED';

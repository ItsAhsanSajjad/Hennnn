ALTER TABLE "PayoutMethod"
  ALTER COLUMN "accountIdentifierProtected" TYPE VARCHAR(255);

ALTER TABLE "EggSaleRequest"
  ADD COLUMN "payoutIdentifierProtectedSnapshot" VARCHAR(255);

ALTER TABLE "Payout"
  ADD COLUMN "payoutIdentifierProtectedSnapshot" VARCHAR(255);

-- Phase 3 structural migration.
-- Existing EggSaleRequest, Payout, and ReferralReward tables were Phase 1/2
-- placeholders and were not used by active product flows. They are recreated
-- here as the finalized Phase 3 models.

ALTER TABLE "EggLedgerEntry" DROP CONSTRAINT IF EXISTS "EggLedgerEntry_signed_units_check";

DROP TABLE IF EXISTS "ReferralReward" CASCADE;
DROP TABLE IF EXISTS "Payout" CASCADE;
DROP TABLE IF EXISTS "EggSaleRequest" CASCADE;

DROP TYPE IF EXISTS "PayoutStatus";
CREATE TYPE "PayoutStatus" AS ENUM ('DRAFT', 'RECORDED', 'CONFIRMED', 'FAILED', 'CANCELLED');

DROP TYPE IF EXISTS "ReferralRewardStatus";
CREATE TYPE "ReferralRewardStatus" AS ENUM ('PENDING', 'CREDITED', 'REVERSED', 'VOID');

CREATE TABLE "EggSaleRate" (
  "id" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "ratePaisaPerEgg" BIGINT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdByUserId" UUID,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),

  CONSTRAINT "EggSaleRate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EggSaleRate_positive_rate_check" CHECK ("ratePaisaPerEgg" > 0),
  CONSTRAINT "EggSaleRate_effective_window_check" CHECK (
    "effectiveUntil" IS NULL OR "effectiveUntil" > "effectiveFrom"
  )
);

CREATE TABLE "PayoutMethod" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "provider" "PayoutMethodProvider" NOT NULL,
  "accountTitle" VARCHAR(120) NOT NULL,
  "accountIdentifierProtected" VARCHAR(180) NOT NULL,
  "accountIdentifierLastFour" VARCHAR(12) NOT NULL,
  "status" "PayoutMethodStatus" NOT NULL DEFAULT 'ACTIVE',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),

  CONSTRAINT "PayoutMethod_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PayoutMethod_mask_check" CHECK (
    length("accountIdentifierProtected") >= 4
    AND length("accountIdentifierLastFour") >= 2
  )
);

CREATE TABLE "EggSaleRequest" (
  "id" UUID NOT NULL,
  "publicReference" VARCHAR(40) NOT NULL,
  "userId" UUID NOT NULL,
  "payoutMethodId" UUID,
  "status" "EggSaleStatus" NOT NULL DEFAULT 'SUBMITTED',
  "eggQuantity" INTEGER NOT NULL,
  "rateId" UUID NOT NULL,
  "rateCodeSnapshot" VARCHAR(40) NOT NULL,
  "ratePaisaPerEggSnapshot" BIGINT NOT NULL,
  "totalAmountPaisa" BIGINT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "underReviewAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" UUID,
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "rejectionCategory" VARCHAR(80),
  "userVisibleReason" TEXT,
  "internalReviewNotes" TEXT,
  "idempotencyKey" VARCHAR(120) NOT NULL,
  "idempotencyRequestHash" VARCHAR(128) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EggSaleRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EggSaleRequest_positive_snapshot_check" CHECK (
    "eggQuantity" > 0
    AND "ratePaisaPerEggSnapshot" > 0
    AND "totalAmountPaisa" = ("eggQuantity"::bigint * "ratePaisaPerEggSnapshot")
  )
);

CREATE TABLE "Payout" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "eggSaleRequestId" UUID NOT NULL,
  "payoutMethodId" UUID,
  "amountPaisa" BIGINT NOT NULL,
  "status" "PayoutStatus" NOT NULL DEFAULT 'RECORDED',
  "settlementReference" VARCHAR(120) NOT NULL,
  "settlementReferenceNormalized" VARCHAR(120) NOT NULL,
  "payoutProviderSnapshot" VARCHAR(40) NOT NULL,
  "payoutIdentifierMaskedSnapshot" VARCHAR(180) NOT NULL,
  "notes" TEXT,
  "createdByUserId" UUID,
  "confirmedByUserId" UUID,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payout_positive_amount_check" CHECK ("amountPaisa" > 0)
);

CREATE TABLE "ReferralRule" (
  "id" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "rewardEggUnits" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveUntil" TIMESTAMP(3),
  "notes" TEXT,
  "createdByUserId" UUID,
  "updatedByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),

  CONSTRAINT "ReferralRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReferralRule_positive_reward_check" CHECK ("rewardEggUnits" > 0),
  CONSTRAINT "ReferralRule_effective_window_check" CHECK (
    "effectiveUntil" IS NULL OR "effectiveUntil" > "effectiveFrom"
  )
);

CREATE TABLE "ReferralReward" (
  "id" UUID NOT NULL,
  "inviterUserId" UUID NOT NULL,
  "inviteeUserId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "ruleId" UUID NOT NULL,
  "qualifyingPurchaseOrderId" UUID NOT NULL,
  "ledgerEntryId" UUID,
  "rewardEggUnits" INTEGER NOT NULL,
  "status" "ReferralRewardStatus" NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" VARCHAR(160) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "creditedAt" TIMESTAMP(3),
  "voidedAt" TIMESTAMP(3),

  CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReferralReward_positive_egg_units_check" CHECK ("rewardEggUnits" > 0),
  CONSTRAINT "ReferralReward_no_self_reward_check" CHECK ("inviterUserId" <> "inviteeUserId")
);

CREATE INDEX "EggSaleRate_code_isActive_effectiveFrom_effectiveUntil_idx"
  ON "EggSaleRate"("code", "isActive", "effectiveFrom", "effectiveUntil");
CREATE INDEX "EggSaleRate_archivedAt_idx" ON "EggSaleRate"("archivedAt");
CREATE UNIQUE INDEX "EggSaleRate_one_active_code_key"
  ON "EggSaleRate"("code")
  WHERE "isActive" = true AND "archivedAt" IS NULL;

CREATE INDEX "PayoutMethod_userId_status_isDefault_idx"
  ON "PayoutMethod"("userId", "status", "isDefault");
CREATE INDEX "PayoutMethod_archivedAt_idx" ON "PayoutMethod"("archivedAt");
CREATE UNIQUE INDEX "PayoutMethod_one_default_active_key"
  ON "PayoutMethod"("userId")
  WHERE "isDefault" = true AND "status" = 'ACTIVE' AND "archivedAt" IS NULL;

CREATE UNIQUE INDEX "EggSaleRequest_publicReference_key" ON "EggSaleRequest"("publicReference");
CREATE UNIQUE INDEX "EggSaleRequest_userId_idempotencyKey_key"
  ON "EggSaleRequest"("userId", "idempotencyKey");
CREATE INDEX "EggSaleRequest_userId_status_idx" ON "EggSaleRequest"("userId", "status");
CREATE INDEX "EggSaleRequest_status_submittedAt_idx"
  ON "EggSaleRequest"("status", "submittedAt");
CREATE INDEX "EggSaleRequest_rateId_idx" ON "EggSaleRequest"("rateId");
CREATE INDEX "EggSaleRequest_payoutMethodId_idx" ON "EggSaleRequest"("payoutMethodId");
CREATE INDEX "EggSaleRequest_createdAt_idx" ON "EggSaleRequest"("createdAt");

CREATE UNIQUE INDEX "Payout_eggSaleRequestId_key" ON "Payout"("eggSaleRequestId");
CREATE UNIQUE INDEX "Payout_settlementReferenceNormalized_key"
  ON "Payout"("settlementReferenceNormalized");
CREATE INDEX "Payout_userId_status_idx" ON "Payout"("userId", "status");
CREATE INDEX "Payout_eggSaleRequestId_idx" ON "Payout"("eggSaleRequestId");
CREATE INDEX "Payout_createdAt_idx" ON "Payout"("createdAt");

CREATE UNIQUE INDEX "ReferralRule_code_key" ON "ReferralRule"("code");
CREATE INDEX "ReferralRule_isActive_effectiveFrom_effectiveUntil_idx"
  ON "ReferralRule"("isActive", "effectiveFrom", "effectiveUntil");
CREATE INDEX "ReferralRule_archivedAt_idx" ON "ReferralRule"("archivedAt");
CREATE UNIQUE INDEX "ReferralRule_one_active_key"
  ON "ReferralRule"("code")
  WHERE "isActive" = true AND "archivedAt" IS NULL;

CREATE UNIQUE INDEX "ReferralReward_ledgerEntryId_key" ON "ReferralReward"("ledgerEntryId");
CREATE UNIQUE INDEX "ReferralReward_idempotencyKey_key" ON "ReferralReward"("idempotencyKey");
CREATE UNIQUE INDEX "ReferralReward_relationshipId_qualifyingPurchaseOrderId_key"
  ON "ReferralReward"("relationshipId", "qualifyingPurchaseOrderId");
CREATE INDEX "ReferralReward_inviterUserId_status_idx"
  ON "ReferralReward"("inviterUserId", "status");
CREATE INDEX "ReferralReward_inviteeUserId_idx" ON "ReferralReward"("inviteeUserId");
CREATE INDEX "ReferralReward_relationshipId_idx" ON "ReferralReward"("relationshipId");
CREATE INDEX "ReferralReward_qualifyingPurchaseOrderId_idx"
  ON "ReferralReward"("qualifyingPurchaseOrderId");

ALTER TABLE "EggSaleRate" ADD CONSTRAINT "EggSaleRate_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EggSaleRate" ADD CONSTRAINT "EggSaleRate_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PayoutMethod" ADD CONSTRAINT "PayoutMethod_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EggSaleRequest" ADD CONSTRAINT "EggSaleRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EggSaleRequest" ADD CONSTRAINT "EggSaleRequest_payoutMethodId_fkey"
  FOREIGN KEY ("payoutMethodId") REFERENCES "PayoutMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EggSaleRequest" ADD CONSTRAINT "EggSaleRequest_rateId_fkey"
  FOREIGN KEY ("rateId") REFERENCES "EggSaleRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EggSaleRequest" ADD CONSTRAINT "EggSaleRequest_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_eggSaleRequestId_fkey"
  FOREIGN KEY ("eggSaleRequestId") REFERENCES "EggSaleRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payoutMethodId_fkey"
  FOREIGN KEY ("payoutMethodId") REFERENCES "PayoutMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_confirmedByUserId_fkey"
  FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralRule" ADD CONSTRAINT "ReferralRule_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReferralRule" ADD CONSTRAINT "ReferralRule_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_inviterUserId_fkey"
  FOREIGN KEY ("inviterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_inviteeUserId_fkey"
  FOREIGN KEY ("inviteeUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "ReferralRelationship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_ruleId_fkey"
  FOREIGN KEY ("ruleId") REFERENCES "ReferralRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_qualifyingPurchaseOrderId_fkey"
  FOREIGN KEY ("qualifyingPurchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_ledgerEntryId_fkey"
  FOREIGN KEY ("ledgerEntryId") REFERENCES "EggLedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
);

CREATE UNIQUE INDEX "EggLedgerEntry_sale_reservation_once_key"
  ON "EggLedgerEntry"("sourceType", "sourceId", "entryType")
  WHERE "sourceType" = 'EGG_SALE' AND "entryType" = 'SALE_RESERVATION';
CREATE UNIQUE INDEX "EggLedgerEntry_sale_release_once_key"
  ON "EggLedgerEntry"("sourceType", "sourceId", "entryType")
  WHERE "sourceType" = 'EGG_SALE' AND "entryType" = 'SALE_RELEASE';
CREATE UNIQUE INDEX "EggLedgerEntry_referral_credit_once_key"
  ON "EggLedgerEntry"("sourceType", "sourceId", "entryType")
  WHERE "sourceType" = 'REFERRAL_REWARD' AND "entryType" = 'REFERRAL_CREDIT';

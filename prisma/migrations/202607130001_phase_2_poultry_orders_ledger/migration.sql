-- Phase 2 replaces Phase 1 placeholder transaction tables with the reviewed
-- order, payment, hen-activation, accrual, and immutable ledger foundation.
-- Phase 1 identity, auth/session, referral, legal, notification, setting, and
-- audit tables are preserved.

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'HEN_PLAN_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'HEN_PLAN_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_ACCOUNT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PURCHASE_ORDER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_PROOF_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PAYMENT_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'HEN_ASSET_ACTIVATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'HEN_ASSET_SUSPENDED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EGG_ACCRUAL_RUN';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EGG_LEDGER_ADJUSTED';

DROP TABLE IF EXISTS "ReferralReward" CASCADE;
DROP TABLE IF EXISTS "Payout" CASCADE;
DROP TABLE IF EXISTS "EggSaleRequest" CASCADE;
DROP TABLE IF EXISTS "EggLedgerEntry" CASCADE;
DROP TABLE IF EXISTS "HenAsset" CASCADE;
DROP TABLE IF EXISTS "PaymentProof" CASCADE;
DROP TABLE IF EXISTS "PaymentSubmission" CASCADE;
DROP TABLE IF EXISTS "PurchaseOrder" CASCADE;
DROP TABLE IF EXISTS "HenPlan" CASCADE;

DROP TYPE IF EXISTS "PurchaseOrderStatus";
DROP TYPE IF EXISTS "PaymentSubmissionStatus";
DROP TYPE IF EXISTS "HenAssetStatus";
DROP TYPE IF EXISTS "EggLedgerDirection";
DROP TYPE IF EXISTS "EggLedgerSource";
DROP TYPE IF EXISTS "EggSaleStatus";
DROP TYPE IF EXISTS "PayoutStatus";
DROP TYPE IF EXISTS "ReferralRewardStatus";

CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentSubmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "PaymentAccountProvider" AS ENUM ('EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER', 'OTHER');
CREATE TYPE "HenAssetStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "EggLedgerEntryType" AS ENUM ('PRODUCTION_CREDIT', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'REVERSAL', 'FUTURE_SALE_HOLD', 'FUTURE_SALE_DEBIT', 'FUTURE_REFERRAL_CREDIT');
CREATE TYPE "EggLedgerSourceType" AS ENUM ('EGG_ACCRUAL', 'ADMIN_ADJUSTMENT', 'REVERSAL', 'FUTURE_SYSTEM');
CREATE TYPE "EggSaleStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "PayoutStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED');
CREATE TYPE "ReferralRewardStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'VOID');

CREATE TABLE "HenPlan" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "shortDescription" VARCHAR(220) NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "pricePaisa" BIGINT NOT NULL,
    "dailyEggUnits" INTEGER NOT NULL,
    "maximumEggUnits" INTEGER NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "maximumQuantity" INTEGER NOT NULL DEFAULT 1,
    "status" "HenPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "termsVersion" VARCHAR(32) NOT NULL,
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "HenPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HenPlan_positive_values_check" CHECK (
        "pricePaisa" > 0 AND
        "dailyEggUnits" > 0 AND
        "maximumEggUnits" > 0 AND
        "validityDays" > 0 AND
        "minimumQuantity" > 0 AND
        "maximumQuantity" >= "minimumQuantity"
    )
);

CREATE TABLE "PaymentAccount" (
    "id" UUID NOT NULL,
    "provider" "PaymentAccountProvider" NOT NULL,
    "accountTitle" VARCHAR(120) NOT NULL,
    "accountIdentifierProtected" VARCHAR(180) NOT NULL,
    "accountIdentifierLastFour" VARCHAR(12) NOT NULL,
    "instructions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "orderReference" VARCHAR(40) NOT NULL,
    "userId" UUID NOT NULL,
    "henPlanId" UUID NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "quantity" INTEGER NOT NULL,
    "unitPricePaisa" BIGINT NOT NULL,
    "totalAmountPaisa" BIGINT NOT NULL,
    "planNameSnapshot" VARCHAR(120) NOT NULL,
    "planCodeSnapshot" VARCHAR(40) NOT NULL,
    "dailyEggUnitsSnapshot" INTEGER NOT NULL,
    "maximumEggUnitsSnapshot" INTEGER NOT NULL,
    "validityDaysSnapshot" INTEGER NOT NULL,
    "termsVersionSnapshot" VARCHAR(32) NOT NULL,
    "paymentDueAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "idempotencyKey" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PurchaseOrder_positive_values_check" CHECK (
        "quantity" > 0 AND
        "unitPricePaisa" > 0 AND
        "totalAmountPaisa" = ("quantity"::bigint * "unitPricePaisa") AND
        "dailyEggUnitsSnapshot" > 0 AND
        "maximumEggUnitsSnapshot" > 0 AND
        "validityDaysSnapshot" > 0
    ),
    CONSTRAINT "PurchaseOrder_rejection_reason_check" CHECK (
        "status" <> 'REJECTED' OR length(coalesce("rejectionReason", '')) > 0
    )
);

CREATE TABLE "PaymentSubmission" (
    "id" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "paymentAccountId" UUID NOT NULL,
    "submittedByUserId" UUID NOT NULL,
    "transactionReference" VARCHAR(120) NOT NULL,
    "transactionReferenceNormalized" VARCHAR(120) NOT NULL,
    "amountPaisaSnapshot" BIGINT NOT NULL,
    "status" "PaymentSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" UUID,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSubmission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentSubmission_positive_amount_check" CHECK ("amountPaisaSnapshot" > 0),
    CONSTRAINT "PaymentSubmission_rejection_reason_check" CHECK (
        "status" <> 'REJECTED' OR length(coalesce("rejectionReason", '')) > 0
    )
);

CREATE TABLE "PaymentProof" (
    "id" UUID NOT NULL,
    "paymentSubmissionId" UUID NOT NULL,
    "storageProvider" VARCHAR(40) NOT NULL,
    "storageKey" VARCHAR(300) NOT NULL,
    "originalFileName" VARCHAR(180) NOT NULL,
    "safeFileName" VARCHAR(180) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256Hash" VARCHAR(64) NOT NULL,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "uploadedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentProof_metadata_check" CHECK (
        "sizeBytes" > 0 AND
        ("imageWidth" IS NULL OR "imageWidth" > 0) AND
        ("imageHeight" IS NULL OR "imageHeight" > 0)
    )
);

CREATE TABLE "HenAsset" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "henPlanId" UUID NOT NULL,
    "status" "HenAssetStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "quantity" INTEGER NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "productionStartDate" TIMESTAMP(3),
    "productionEndDate" TIMESTAMP(3),
    "dailyEggUnitsPerHen" INTEGER NOT NULL,
    "maximumEggUnitsPerHen" INTEGER NOT NULL,
    "totalMaximumEggUnits" INTEGER NOT NULL,
    "totalEggUnitsProduced" INTEGER NOT NULL DEFAULT 0,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HenAsset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HenAsset_positive_values_check" CHECK (
        "quantity" > 0 AND
        "dailyEggUnitsPerHen" > 0 AND
        "maximumEggUnitsPerHen" > 0 AND
        "totalMaximumEggUnits" = ("quantity" * "maximumEggUnitsPerHen") AND
        "totalEggUnitsProduced" >= 0 AND
        "totalEggUnitsProduced" <= "totalMaximumEggUnits"
    ),
    CONSTRAINT "HenAsset_window_check" CHECK (
        "productionStartDate" IS NULL OR
        "productionEndDate" IS NULL OR
        "productionEndDate" >= "productionStartDate"
    )
);

CREATE TABLE "EggAccrual" (
    "id" UUID NOT NULL,
    "henAssetId" UUID NOT NULL,
    "productionDate" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "eggUnits" INTEGER NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EggAccrual_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EggAccrual_positive_values_check" CHECK ("quantity" > 0 AND "eggUnits" > 0)
);

CREATE TABLE "EggLedgerEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "henAssetId" UUID,
    "eggAccrualId" UUID,
    "entryType" "EggLedgerEntryType" NOT NULL,
    "eggUnits" INTEGER NOT NULL,
    "description" VARCHAR(240) NOT NULL,
    "sourceType" "EggLedgerSourceType" NOT NULL,
    "sourceId" VARCHAR(120),
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "metadata" JSONB,
    "reversedEntryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EggLedgerEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EggLedgerEntry_signed_units_check" CHECK (
        ("entryType" IN ('PRODUCTION_CREDIT', 'ADMIN_CREDIT', 'REVERSAL', 'FUTURE_REFERRAL_CREDIT') AND "eggUnits" > 0) OR
        ("entryType" IN ('ADMIN_DEBIT', 'FUTURE_SALE_HOLD', 'FUTURE_SALE_DEBIT') AND "eggUnits" < 0)
    )
);

CREATE TABLE "EggSaleRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerEggPaisa" BIGINT NOT NULL,
    "status" "EggSaleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "EggSaleRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EggSaleRequest_positive_values_check" CHECK ("quantity" > 0 AND "pricePerEggPaisa" > 0)
);

CREATE TABLE "Payout" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eggSaleRequestId" UUID,
    "amountPaisa" BIGINT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payout_positive_amount_check" CHECK ("amountPaisa" > 0)
);

CREATE TABLE "ReferralReward" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationshipId" UUID NOT NULL,
    "amountPaisa" BIGINT NOT NULL,
    "status" "ReferralRewardStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReferralReward_positive_amount_check" CHECK ("amountPaisa" > 0)
);

CREATE UNIQUE INDEX "HenPlan_code_key" ON "HenPlan"("code");
CREATE UNIQUE INDEX "HenPlan_slug_key" ON "HenPlan"("slug");
CREATE INDEX "HenPlan_status_isActive_displayOrder_idx" ON "HenPlan"("status", "isActive", "displayOrder");
CREATE INDEX "HenPlan_archivedAt_idx" ON "HenPlan"("archivedAt");

CREATE INDEX "PaymentAccount_isActive_displayOrder_idx" ON "PaymentAccount"("isActive", "displayOrder");
CREATE INDEX "PaymentAccount_archivedAt_idx" ON "PaymentAccount"("archivedAt");

CREATE UNIQUE INDEX "PurchaseOrder_orderReference_key" ON "PurchaseOrder"("orderReference");
CREATE UNIQUE INDEX "PurchaseOrder_userId_idempotencyKey_key" ON "PurchaseOrder"("userId", "idempotencyKey");
CREATE INDEX "PurchaseOrder_userId_status_idx" ON "PurchaseOrder"("userId", "status");
CREATE INDEX "PurchaseOrder_henPlanId_idx" ON "PurchaseOrder"("henPlanId");
CREATE INDEX "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");
CREATE INDEX "PurchaseOrder_paymentDueAt_idx" ON "PurchaseOrder"("paymentDueAt");

CREATE UNIQUE INDEX "PaymentSubmission_transactionReferenceNormalized_key" ON "PaymentSubmission"("transactionReferenceNormalized");
CREATE INDEX "PaymentSubmission_submittedByUserId_status_idx" ON "PaymentSubmission"("submittedByUserId", "status");
CREATE INDEX "PaymentSubmission_purchaseOrderId_idx" ON "PaymentSubmission"("purchaseOrderId");
CREATE INDEX "PaymentSubmission_submittedAt_idx" ON "PaymentSubmission"("submittedAt");

CREATE UNIQUE INDEX "PaymentProof_storageKey_key" ON "PaymentProof"("storageKey");
CREATE UNIQUE INDEX "PaymentProof_sha256Hash_key" ON "PaymentProof"("sha256Hash");
CREATE INDEX "PaymentProof_paymentSubmissionId_idx" ON "PaymentProof"("paymentSubmissionId");
CREATE INDEX "PaymentProof_uploadedByUserId_idx" ON "PaymentProof"("uploadedByUserId");
CREATE INDEX "PaymentProof_createdAt_idx" ON "PaymentProof"("createdAt");

CREATE UNIQUE INDEX "HenAsset_purchaseOrderId_key" ON "HenAsset"("purchaseOrderId");
CREATE INDEX "HenAsset_userId_status_idx" ON "HenAsset"("userId", "status");
CREATE INDEX "HenAsset_henPlanId_idx" ON "HenAsset"("henPlanId");
CREATE INDEX "HenAsset_productionStartDate_productionEndDate_idx" ON "HenAsset"("productionStartDate", "productionEndDate");

CREATE UNIQUE INDEX "EggAccrual_idempotencyKey_key" ON "EggAccrual"("idempotencyKey");
CREATE UNIQUE INDEX "EggAccrual_henAssetId_productionDate_key" ON "EggAccrual"("henAssetId", "productionDate");
CREATE INDEX "EggAccrual_productionDate_idx" ON "EggAccrual"("productionDate");

CREATE UNIQUE INDEX "EggLedgerEntry_idempotencyKey_key" ON "EggLedgerEntry"("idempotencyKey");
CREATE INDEX "EggLedgerEntry_userId_createdAt_idx" ON "EggLedgerEntry"("userId", "createdAt");
CREATE INDEX "EggLedgerEntry_henAssetId_idx" ON "EggLedgerEntry"("henAssetId");
CREATE INDEX "EggLedgerEntry_eggAccrualId_idx" ON "EggLedgerEntry"("eggAccrualId");
CREATE INDEX "EggLedgerEntry_sourceType_sourceId_idx" ON "EggLedgerEntry"("sourceType", "sourceId");

CREATE INDEX "EggSaleRequest_userId_status_idx" ON "EggSaleRequest"("userId", "status");
CREATE INDEX "EggSaleRequest_createdAt_idx" ON "EggSaleRequest"("createdAt");

CREATE INDEX "Payout_userId_status_idx" ON "Payout"("userId", "status");
CREATE INDEX "Payout_createdAt_idx" ON "Payout"("createdAt");

CREATE INDEX "ReferralReward_userId_status_idx" ON "ReferralReward"("userId", "status");
CREATE INDEX "ReferralReward_relationshipId_idx" ON "ReferralReward"("relationshipId");

ALTER TABLE "HenPlan" ADD CONSTRAINT "HenPlan_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HenPlan" ADD CONSTRAINT "HenPlan_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAccount" ADD CONSTRAINT "PaymentAccount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAccount" ADD CONSTRAINT "PaymentAccount_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_henPlanId_fkey" FOREIGN KEY ("henPlanId") REFERENCES "HenPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentSubmission" ADD CONSTRAINT "PaymentSubmission_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_paymentSubmissionId_fkey" FOREIGN KEY ("paymentSubmissionId") REFERENCES "PaymentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HenAsset" ADD CONSTRAINT "HenAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HenAsset" ADD CONSTRAINT "HenAsset_henPlanId_fkey" FOREIGN KEY ("henPlanId") REFERENCES "HenPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HenAsset" ADD CONSTRAINT "HenAsset_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EggAccrual" ADD CONSTRAINT "EggAccrual_henAssetId_fkey" FOREIGN KEY ("henAssetId") REFERENCES "HenAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EggLedgerEntry" ADD CONSTRAINT "EggLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EggLedgerEntry" ADD CONSTRAINT "EggLedgerEntry_henAssetId_fkey" FOREIGN KEY ("henAssetId") REFERENCES "HenAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EggLedgerEntry" ADD CONSTRAINT "EggLedgerEntry_eggAccrualId_fkey" FOREIGN KEY ("eggAccrualId") REFERENCES "EggAccrual"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EggLedgerEntry" ADD CONSTRAINT "EggLedgerEntry_reversedEntryId_fkey" FOREIGN KEY ("reversedEntryId") REFERENCES "EggLedgerEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EggSaleRequest" ADD CONSTRAINT "EggSaleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_eggSaleRequestId_fkey" FOREIGN KEY ("eggSaleRequestId") REFERENCES "EggSaleRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

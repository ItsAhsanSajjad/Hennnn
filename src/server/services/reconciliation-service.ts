import type { Prisma, User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { canRunReconciliation } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";

export type ReconciliationFinding = {
  code: string;
  severity: "warning" | "critical";
  entityType: string;
  entityId: string | null;
  message: string;
};

export async function runPhase3Reconciliation(actor?: Pick<User, "id" | "role"> | null) {
  if (actor && !canRunReconciliation(actor.role)) {
    throw new Error("You are not allowed to run reconciliation.");
  }

  const findings: ReconciliationFinding[] = [];

  const [
    saleWithoutReservation,
    reservationWithoutSale,
    terminalWithoutRelease,
    processingOrPaidWithRelease,
    paidWithoutSettlement,
    paidWithoutFinalization,
    duplicateSettlementRows,
    rewardWithoutLedger,
    ledgerWithoutReward,
    amountMismatch,
    negativeBalances,
  ] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT s."id"
      FROM "EggSaleRequest" s
      WHERE s."status" IN ('AWAITING_REVIEW', 'UNDER_REVIEW', 'PAYMENT_PROCESSING', 'PAID')
        AND NOT EXISTS (
          SELECT 1 FROM "EggLedgerEntry" l
          WHERE l."sourceType" = 'EGG_SALE'
            AND l."sourceId" = s."id"::text
            AND l."entryType" = 'SALE_RESERVATION'
        )
    `,
    prisma.$queryRaw<{ id: string; sourceId: string | null }[]>`
      SELECT l."id", l."sourceId"
      FROM "EggLedgerEntry" l
      WHERE l."sourceType" = 'EGG_SALE'
        AND l."entryType" = 'SALE_RESERVATION'
        AND NOT EXISTS (
          SELECT 1 FROM "EggSaleRequest" s WHERE s."id"::text = l."sourceId"
        )
    `,
    prisma.$queryRaw<{ id: string; status: string }[]>`
      SELECT s."id", s."status"::text
      FROM "EggSaleRequest" s
      WHERE s."status" IN ('REJECTED', 'CANCELLED')
        AND NOT EXISTS (
          SELECT 1 FROM "EggLedgerEntry" l
          WHERE l."sourceType" = 'EGG_SALE'
            AND l."sourceId" = s."id"::text
            AND l."entryType" = 'SALE_RELEASE'
        )
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT s."id"
      FROM "EggSaleRequest" s
      WHERE s."status" IN ('PAYMENT_PROCESSING', 'PAID')
        AND EXISTS (
          SELECT 1 FROM "EggLedgerEntry" l
          WHERE l."sourceType" = 'EGG_SALE'
            AND l."sourceId" = s."id"::text
            AND l."entryType" = 'SALE_RELEASE'
        )
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT s."id"
      FROM "EggSaleRequest" s
      WHERE s."status" = 'PAID'
        AND NOT EXISTS (
          SELECT 1 FROM "Payout" p
          WHERE p."eggSaleRequestId" = s."id"
            AND p."status" = 'CONFIRMED'
        )
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT s."id"
      FROM "EggSaleRequest" s
      WHERE s."status" = 'PAID'
        AND NOT EXISTS (
          SELECT 1 FROM "EggLedgerEntry" l
          WHERE l."sourceType" = 'EGG_SALE'
            AND l."sourceId" = s."id"::text
            AND l."entryType" = 'SALE_FINALIZED'
        )
    `,
    prisma.$queryRaw<{ eggSaleRequestId: string; count: bigint }[]>`
      SELECT "eggSaleRequestId", COUNT(*) AS count
      FROM "Payout"
      GROUP BY "eggSaleRequestId"
      HAVING COUNT(*) > 1
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT r."id"
      FROM "ReferralReward" r
      WHERE r."status" = 'CREDITED'
        AND r."ledgerEntryId" IS NULL
    `,
    prisma.$queryRaw<{ id: string; sourceId: string | null }[]>`
      SELECT l."id", l."sourceId"
      FROM "EggLedgerEntry" l
      WHERE l."sourceType" = 'REFERRAL_REWARD'
        AND l."entryType" = 'REFERRAL_CREDIT'
        AND NOT EXISTS (
          SELECT 1 FROM "ReferralReward" r WHERE r."id"::text = l."sourceId"
        )
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "EggSaleRequest"
      WHERE "totalAmountPaisa" <> ("eggQuantity"::bigint * "ratePaisaPerEggSnapshot")
    `,
    prisma.$queryRaw<{ userId: string; balance: bigint }[]>`
      SELECT "userId", SUM("eggUnits") AS balance
      FROM "EggLedgerEntry"
      GROUP BY "userId"
      HAVING SUM("eggUnits") < 0
    `,
  ]);

  for (const item of saleWithoutReservation) {
    findings.push({
      code: "SALE_WITHOUT_RESERVATION",
      severity: "critical",
      entityType: "EggSaleRequest",
      entityId: item.id,
      message: "Active sale request is missing its reservation ledger entry.",
    });
  }
  for (const item of reservationWithoutSale) {
    findings.push({
      code: "RESERVATION_WITHOUT_SALE",
      severity: "critical",
      entityType: "EggLedgerEntry",
      entityId: item.id,
      message: `Reservation points to missing sale ${item.sourceId ?? "unknown"}.`,
    });
  }
  for (const item of terminalWithoutRelease) {
    findings.push({
      code: `${item.status}_WITHOUT_RELEASE`,
      severity: "critical",
      entityType: "EggSaleRequest",
      entityId: item.id,
      message: "Terminal rejected/cancelled sale is missing a release ledger entry.",
    });
  }
  for (const item of processingOrPaidWithRelease) {
    findings.push({
      code: "PROCESSING_OR_PAID_WITH_RELEASE",
      severity: "critical",
      entityType: "EggSaleRequest",
      entityId: item.id,
      message: "Payment-processing or paid sale has a release entry.",
    });
  }
  for (const item of paidWithoutSettlement) {
    findings.push({
      code: "PAID_WITHOUT_CONFIRMED_SETTLEMENT",
      severity: "critical",
      entityType: "EggSaleRequest",
      entityId: item.id,
      message: "Paid sale has no confirmed settlement.",
    });
  }
  for (const item of paidWithoutFinalization) {
    findings.push({
      code: "PAID_WITHOUT_FINALIZATION",
      severity: "critical",
      entityType: "EggSaleRequest",
      entityId: item.id,
      message: "Paid sale is missing its finalization ledger event.",
    });
  }
  for (const item of duplicateSettlementRows) {
    findings.push({
      code: "DUPLICATE_SETTLEMENT",
      severity: "critical",
      entityType: "EggSaleRequest",
      entityId: item.eggSaleRequestId,
      message: `Sale has ${item.count.toString()} settlement rows.`,
    });
  }
  for (const item of rewardWithoutLedger) {
    findings.push({
      code: "REFERRAL_REWARD_WITHOUT_LEDGER",
      severity: "critical",
      entityType: "ReferralReward",
      entityId: item.id,
      message: "Credited referral reward is missing its ledger entry.",
    });
  }
  for (const item of ledgerWithoutReward) {
    findings.push({
      code: "REFERRAL_LEDGER_WITHOUT_REWARD",
      severity: "critical",
      entityType: "EggLedgerEntry",
      entityId: item.id,
      message: `Referral ledger entry points to missing reward ${item.sourceId ?? "unknown"}.`,
    });
  }
  for (const item of amountMismatch) {
    findings.push({
      code: "SALE_AMOUNT_MISMATCH",
      severity: "critical",
      entityType: "EggSaleRequest",
      entityId: item.id,
      message: "Sale total amount does not match quantity times rate snapshot.",
    });
  }
  for (const item of negativeBalances) {
    findings.push({
      code: "NEGATIVE_AVAILABLE_BALANCE",
      severity: "critical",
      entityType: "User",
      entityId: item.userId,
      message: `User has negative available egg balance ${item.balance.toString()}.`,
    });
  }

  if (actor) {
    await createAuditLog({
      actorUserId: actor.id,
      action: "RECONCILIATION_RUN",
      entityType: "Phase3Reconciliation",
      metadata: {
        findings: findings.length,
        critical: findings.filter((finding) => finding.severity === "critical").length,
      } satisfies Prisma.InputJsonValue,
    });
  }

  return {
    ok: findings.length === 0,
    findings,
  };
}

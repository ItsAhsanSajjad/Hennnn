import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { ProfitClient, ProfitRecordItem } from "@/components/profit-egg/profit-client";
import { ensureEggAccrualsCurrent } from "@/server/services/egg-accrual";

export const dynamic = "force-dynamic";

export default async function ProfitEggPage() {
  const user = await requireUser();
  await ensureEggAccrualsCurrent();

  const rawEntries = await prisma.eggLedgerEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const records: ProfitRecordItem[] = rawEntries.map((e) => {
    let source: "DAILY_COLLECTION" | "REFERRAL_COMMISSION" | "REWARD_CLAIM" | "EGG_SALE" | "ADMIN_ADJUSTMENT" | "REVERSAL" | "OTHER" = "OTHER";
    let sourceLabel = "Ledger Record";
    let status: "PAID" | "PENDING" | "OTHER" = "PAID";
    let statusLabel = "Paid";
    let pkrAmount: number | null = null;

    if (e.sourceType === "EGG_ACCRUAL" || e.entryType === "PRODUCTION_CREDIT") {
      source = "DAILY_COLLECTION";
      sourceLabel = "Daily Collection";
      status = "PAID";
      statusLabel = "Paid";
    } else if (e.sourceType === "REFERRAL_REWARD") {
      source = "REFERRAL_COMMISSION";
      sourceLabel = "Referral Bonus";
      status = "PAID";
      statusLabel = "Paid";
    } else if (e.entryType === "REFERRAL_CREDIT") {
      source = "REWARD_CLAIM";
      sourceLabel = "Reward Claim";
      status = "PAID";
      statusLabel = "Paid";
    } else if (e.sourceType === "EGG_SALE" || e.entryType.includes("SALE")) {
      source = "EGG_SALE";
      sourceLabel = "Egg Sale";
      if (e.entryType === "FUTURE_SALE_HOLD" || e.entryType === "SALE_RESERVATION") {
        status = "PENDING";
        statusLabel = "Pending";
      } else {
        status = "PAID";
        statusLabel = "Completed";
      }
      if (e.metadata && typeof e.metadata === "object") {
        const meta = e.metadata as Record<string, unknown>;
        if (typeof meta.pkrGross === "number") {
          pkrAmount = meta.pkrGross;
        } else if (typeof meta.pkrNet === "number") {
          pkrAmount = meta.pkrNet;
        } else if (typeof meta.pkrAmount === "number") {
          pkrAmount = meta.pkrAmount;
        }
      }
    } else if (e.sourceType === "ADMIN_ADJUSTMENT" || e.entryType.includes("ADMIN")) {
      source = "ADMIN_ADJUSTMENT";
      sourceLabel = "Admin Adjustment";
      status = "OTHER";
      statusLabel = "Adjusted";
    } else if (e.sourceType === "REVERSAL" || e.entryType === "REVERSAL") {
      source = "REVERSAL";
      sourceLabel = "Reversal";
      status = "OTHER";
      statusLabel = "Reversed";
    }

    return {
      id: e.id,
      reference: e.idempotencyKey,
      source,
      sourceLabel,
      description: e.description,
      eggUnits: e.eggUnits,
      isCredit: e.eggUnits >= 0,
      pkrAmount,
      status,
      statusLabel,
      createdAt: e.createdAt.toISOString(),
    };
  });

  const totalRecords = records.length;
  const paidRecords = records.filter((r) => r.status === "PAID").length;
  const pendingRecords = records.filter((r) => r.status === "PENDING").length;
  const totalEggUnits = records.reduce((sum, r) => sum + r.eggUnits, 0);

  return (
    <ProfitClient
      records={records}
      totalRecords={totalRecords}
      paidRecords={paidRecords}
      pendingRecords={pendingRecords}
      initialTotalEggs={totalEggUnits}
    />
  );
}


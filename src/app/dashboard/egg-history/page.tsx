import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { EggHistoryClient, EggLedgerRecord } from "@/components/history/egg-history-client";

export const dynamic = "force-dynamic";

export default async function EggHistoryPage() {
  const user = await requireUser();

  const [entries, statsRow] = await Promise.all([
    prisma.eggLedgerEntry.findMany({
      where: { userId: user.id },
      include: {
        henAsset: { include: { henPlan: true } },
        eggMarketSale: { include: { market: true } },
        referralReward: { include: { invitee: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.$queryRaw<
      {
        balance: number;
        totalProduced: number;
        totalSold: number;
        totalReferral: number;
      }[]
    >`
      SELECT
        COALESCE(SUM("eggUnits"), 0)::int AS "balance",
        COALESCE(SUM(CASE WHEN "entryType" = 'PRODUCTION_CREDIT' THEN "eggUnits" ELSE 0 END), 0)::int AS "totalProduced",
        COALESCE(SUM(CASE WHEN "entryType" IN ('FUTURE_SALE_DEBIT', 'SALE_FINALIZED') THEN ABS("eggUnits") ELSE 0 END), 0)::int AS "totalSold",
        COALESCE(SUM(CASE WHEN "entryType" IN ('FUTURE_REFERRAL_CREDIT', 'REFERRAL_CREDIT') THEN "eggUnits" ELSE 0 END), 0)::int AS "totalReferral"
      FROM "EggLedgerEntry"
      WHERE "userId" = ${user.id}::uuid
    `,
  ]);

  const records: EggLedgerRecord[] = entries.map((e) => {
    let displayEventType = "Harvest Credit";
    let relatedEntity: EggLedgerRecord["relatedEntity"] = undefined;

    if (e.entryType === "PRODUCTION_CREDIT") {
      displayEventType = "Daily Egg Harvest";
      relatedEntity = {
        type: "HEN",
        label: e.henAsset?.henPlan?.name || "Active Flock",
        subtext: e.henAsset ? `${e.henAsset.quantity} Hens` : undefined,
        href: "/dashboard/hens/history",
      };
    } else if (e.sourceType === "EGG_SALE" || e.entryType === "SALE_FINALIZED" || e.entryType === "FUTURE_SALE_DEBIT" || e.entryType === "SALE_RESERVATION") {
      displayEventType = "Egg Sale Debit";
      relatedEntity = {
        type: "SALE",
        label: e.eggMarketSale ? `Trade ${e.eggMarketSale.publicReference}` : "Market Sale",
        subtext: e.eggMarketSale?.market?.name || "Marketplace",
        href: "/dashboard/sales-history",
      };
    } else if (e.sourceType === "REFERRAL_REWARD" || e.entryType === "REFERRAL_CREDIT" || e.entryType === "FUTURE_REFERRAL_CREDIT") {
      displayEventType = "Referral Bonus";
      relatedEntity = {
        type: "REFERRAL",
        label: e.referralReward?.invitee?.username ? `@${e.referralReward.invitee.username}` : "Friend Referral",
        subtext: "Bonus Reward",
        href: "/dashboard/referrals",
      };
    } else if (e.entryType === "REVERSAL" || e.sourceType === "REVERSAL") {
      displayEventType = "Balance Adjustment";
      relatedEntity = {
        type: "ADMIN",
        label: "Adjustment / Reversal",
        subtext: "System correction",
      };
    } else {
      displayEventType = "Admin Credit";
      relatedEntity = {
        type: "ADMIN",
        label: "System Adjustment",
        subtext: "Administrative note",
      };
    }

    return {
      id: e.id,
      reference: `EGG-${e.id.slice(0, 8).toUpperCase()}`,
      entryType: e.entryType,
      displayEventType,
      eggUnits: e.eggUnits,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      status: e.reversedEntryId ? "REVERSED" : "COMPLETED",
      relatedEntity,
      metadata: (e.metadata as any) ?? null,
    };
  });

  return (
    <EggHistoryClient
      records={records}
      availableBalance={Number(statsRow[0]?.balance ?? 0)}
      totalHarvested={Number(statsRow[0]?.totalProduced ?? 0)}
      totalSoldEggs={Number(statsRow[0]?.totalSold ?? 0)}
      referralBonusEggs={Number(statsRow[0]?.totalReferral ?? 0)}
    />
  );
}

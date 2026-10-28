import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env/server";
import { CommissionsClient, CommissionRecordData } from "@/components/commissions/commissions-client";

export const dynamic = "force-dynamic";

export default async function ReferBonusPage() {
  const user = await requireUser();

  const [rewards, activeReferralsCount] = await Promise.all([
    prisma.referralReward.findMany({
      where: { inviterUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        invitee: { select: { username: true } },
        qualifyingPurchaseOrder: {
          select: {
            orderReference: true,
            planNameSnapshot: true,
            totalAmountPaisa: true,
          },
        },
      },
    }),
    prisma.referralRelationship.count({
      where: { inviterId: user.id },
    }),
  ]);

  const totalBonusEggs = rewards
    .filter((r) => r.status === "CREDITED")
    .reduce((acc, curr) => acc + curr.rewardEggUnits, 0);

  const qualifyingOrdersCount = rewards.filter((r) => r.status === "CREDITED").length;

  const records: CommissionRecordData[] = rewards.map((r) => ({
    id: r.id,
    inviteeUsername: r.invitee.username,
    orderReference: r.qualifyingPurchaseOrder.orderReference,
    planName: r.qualifyingPurchaseOrder.planNameSnapshot,
    orderAmountRs: Number(r.qualifyingPurchaseOrder.totalAmountPaisa / 100n),
    rewardEggUnits: r.rewardEggUnits,
    status: r.status as "CREDITED" | "PENDING" | "VOIDED",
    createdAt: r.createdAt.toISOString(),
    creditedAt: r.creditedAt ? r.creditedAt.toISOString() : null,
  }));

  const appBaseUrl = env.NEXT_PUBLIC_APP_URL || "https://growmeta-egg.pk";
  const referralLink = `${appBaseUrl}/register?ref=${user.referralCode}`;

  return (
    <CommissionsClient
      totalBonusEggs={totalBonusEggs}
      activeReferralsCount={activeReferralsCount}
      qualifyingOrdersCount={qualifyingOrdersCount}
      referralCode={user.referralCode}
      referralLink={referralLink}
      records={records}
    />
  );
}

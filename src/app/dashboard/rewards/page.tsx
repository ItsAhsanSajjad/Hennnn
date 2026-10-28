import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { RewardsClient, RewardClaimRecord } from "@/components/rewards/rewards-client";
import { VIP_REWARD_TIERS } from "@/lib/rewards/config";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const user = await requireUser();

  // 1. Get all Level 1 direct referral relationships
  const directRelationships = await prisma.referralRelationship.findMany({
    where: { inviterId: user.id },
    include: {
      invitee: {
        select: {
          id: true,
          status: true,
          purchaseOrders: {
            where: { status: "APPROVED" },
            select: { totalAmountPaisa: true },
          },
        },
      },
    },
  });

  const activeLevelOneMembers = directRelationships.filter(
    (r) => r.invitee.status === "ACTIVE"
  ).length;

  const verifiedLevelOneInvestment = directRelationships.reduce((sum, r) => {
    const memberSum = r.invitee.purchaseOrders.reduce(
      (orderSum, o) => orderSum + Number(o.totalAmountPaisa / 100n),
      0
    );
    return sum + memberSum;
  }, 0);

  // 2. Fetch milestone claims
  const claimsRaw = await prisma.milestoneRewardClaim.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const claims: RewardClaimRecord[] = claimsRaw.map((c) => ({
    id: c.id,
    milestoneKey: c.milestoneKey,
    milestoneName: c.milestoneName,
    tierNumber: c.tierNumber,
    rewardEggUnits: c.rewardEggUnits,
    status: c.status as "PENDING" | "UNDER_REVIEW" | "APPROVED" | "COLLECTED" | "REJECTED",
    createdAt: c.createdAt.toISOString(),
    collectedAt: c.collectedAt ? c.collectedAt.toISOString() : null,
    ledgerEntryId: c.ledgerEntryId,
  }));

  const collectedClaimKeys = new Set(
    claims
      .filter((c) => c.status === "COLLECTED" || c.status === "APPROVED")
      .map((c) => c.milestoneKey)
  );

  const totalGoldenEggRewards = claims
    .filter((c) => c.status === "COLLECTED" || c.status === "APPROVED")
    .reduce((sum, c) => sum + c.rewardEggUnits, 0);

  // Collectible eggs are from tiers where requirement is met but not yet collected
  const collectibleGoldenEggs = VIP_REWARD_TIERS
    .filter(
      (t) =>
        verifiedLevelOneInvestment >= t.requiredLevel1InvestmentRs &&
        !collectedClaimKeys.has(t.id)
    )
    .reduce((sum, t) => sum + t.goldenEggReward, 0);

  return (
    <RewardsClient
      verifiedLevelOneInvestment={verifiedLevelOneInvestment}
      activeLevelOneMembers={activeLevelOneMembers}
      totalGoldenEggRewards={totalGoldenEggRewards}
      collectibleGoldenEggs={collectibleGoldenEggs}
      rewardRecordCount={claims.length}
      claims={claims}
    />
  );
}

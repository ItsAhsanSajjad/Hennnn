import { prisma } from "@/lib/database/prisma";
import { maskTeamIdentity } from "@/lib/utilities/phase3";

export async function getReferralDashboard(userId: string) {
  const members = await prisma.referralRelationship.findMany({
    where: { inviterId: userId },
    orderBy: { createdAt: "desc" },
    include: { invitee: true },
    take: 50,
  });
  const rewards = await prisma.referralReward.findMany({
    where: { inviterUserId: userId },
    orderBy: { createdAt: "desc" },
    include: { invitee: true, qualifyingPurchaseOrder: true },
    take: 50,
  });
  // Inviter commission hens are stored as zero-price purchase orders created by the
  // referral benefit (idempotency key prefix "referral-hen-benefit:").
  const henRewardOrders = await prisma.purchaseOrder.findMany({
    where: { userId, idempotencyKey: { startsWith: "referral-hen-benefit:" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, quantity: true, orderReference: true, createdAt: true },
    take: 50,
  });
  const totalRewardHens = henRewardOrders.reduce((sum, order) => sum + order.quantity, 0);

  // How many hens each referred member has actually bought (approved orders only,
  // excluding any referral-reward orders they may hold from their own invites).
  // This is the number the inviter's commission is a percentage of.
  const inviteeIds = members.map((member) => member.inviteeId);
  const purchasedByMember = inviteeIds.length
    ? await prisma.purchaseOrder.groupBy({
        by: ["userId"],
        where: {
          userId: { in: inviteeIds },
          status: "APPROVED",
          NOT: { idempotencyKey: { startsWith: "referral-hen-benefit:" } },
        },
        _sum: { quantity: true },
      })
    : [];
  const purchasedMap = new Map(
    purchasedByMember.map((row) => [row.userId, row._sum.quantity ?? 0]),
  );

  return {
    members: members.map((member) => ({
      id: member.id,
      joinedAt: member.createdAt,
      sourceCode: member.sourceCode,
      hensPurchased: purchasedMap.get(member.inviteeId) ?? 0,
      maskedIdentity: maskTeamIdentity({
        username: member.invitee.username,
        phoneE164: member.invitee.phoneE164,
      }),
    })),
    rewards,
    henRewards: henRewardOrders,
    totalRewardHens,
  };
}

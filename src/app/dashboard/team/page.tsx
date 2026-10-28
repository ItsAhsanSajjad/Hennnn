import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env/server";
import { TeamClient, TeamMemberData } from "@/components/team/team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireUser();

  // 1. Fetch direct referrals (Level 1)
  const [level1Relationships, sponsorRow, totalTeamRewards] = await Promise.all([
    prisma.referralRelationship.findMany({
      where: { inviterId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        invitee: {
          select: {
            id: true,
            username: true,
            status: true,
            createdAt: true,
            henAssets: {
              where: { status: "ACTIVE" },
              select: { quantity: true },
            },
            purchaseOrders: {
              where: { status: "APPROVED" },
              select: { totalAmountPaisa: true },
            },
          },
        },
      },
    }),
    prisma.referralRelationship.findUnique({
      where: { inviteeId: user.id },
      include: { inviter: { select: { username: true } } },
    }),
    prisma.referralReward.aggregate({
      where: { inviterUserId: user.id, status: "CREDITED" },
      _sum: { rewardEggUnits: true },
    }),
  ]);

  const level1UserIds = level1Relationships.map((r) => r.invitee.id);

  // 2. Fetch indirect referrals (Level 2)
  const level2Relationships =
    level1UserIds.length > 0
      ? await prisma.referralRelationship.findMany({
          where: { inviterId: { in: level1UserIds } },
          orderBy: { createdAt: "desc" },
          include: {
            invitee: {
              select: {
                id: true,
                username: true,
                status: true,
                createdAt: true,
                henAssets: {
                  where: { status: "ACTIVE" },
                  select: { quantity: true },
                },
                purchaseOrders: {
                  where: { status: "APPROVED" },
                  select: { totalAmountPaisa: true },
                },
              },
            },
          },
        })
      : [];

  // 3. Fetch rewards broken down per invitee
  const rewardsPerInvitee = await prisma.referralReward.groupBy({
    by: ["inviteeUserId"],
    where: { inviterUserId: user.id, status: "CREDITED" },
    _sum: { rewardEggUnits: true },
  });

  const rewardMap = new Map<string, number>();
  for (const r of rewardsPerInvitee) {
    rewardMap.set(r.inviteeUserId, r._sum.rewardEggUnits ?? 0);
  }

  // Map Level 1 members
  const level1Members: TeamMemberData[] = level1Relationships.map((r) => {
    const inv = r.invitee;
    const activeHens = inv.henAssets.reduce((sum, h) => sum + h.quantity, 0);
    const verifiedInvestmentRs = inv.purchaseOrders.reduce(
      (sum, p) => sum + Number(p.totalAmountPaisa / 100n),
      0
    );
    const commissionEarnedEggs = rewardMap.get(inv.id) ?? 0;

    return {
      id: inv.id,
      username: inv.username,
      status: inv.status,
      createdAt: r.createdAt.toISOString(),
      activeHens,
      verifiedInvestmentRs,
      commissionEarnedEggs,
      level: 1,
    };
  });

  // Map Level 2 members
  const level2Members: TeamMemberData[] = level2Relationships.map((r) => {
    const inv = r.invitee;
    const activeHens = inv.henAssets.reduce((sum, h) => sum + h.quantity, 0);
    const verifiedInvestmentRs = inv.purchaseOrders.reduce(
      (sum, p) => sum + Number(p.totalAmountPaisa / 100n),
      0
    );

    return {
      id: inv.id,
      username: inv.username,
      status: inv.status,
      createdAt: r.createdAt.toISOString(),
      activeHens,
      verifiedInvestmentRs,
      commissionEarnedEggs: 0,
      level: 2,
    };
  });

  const totalMembers = level1Members.length + level2Members.length;
  const activeMembers =
    level1Members.filter((m) => m.status === "ACTIVE").length +
    level2Members.filter((m) => m.status === "ACTIVE").length;
  const totalTeamHens =
    level1Members.reduce((sum, m) => sum + m.activeHens, 0) +
    level2Members.reduce((sum, m) => sum + m.activeHens, 0);
  const totalEarnedEggs = totalTeamRewards._sum.rewardEggUnits ?? 0;

  const appBaseUrl = env.NEXT_PUBLIC_APP_URL || "https://growmeta-egg.pk";
  const referralLink = `${appBaseUrl}/register?ref=${user.referralCode}`;

  return (
    <TeamClient
      userReferralCode={user.referralCode}
      referralLink={referralLink}
      totalMembers={totalMembers}
      activeMembers={activeMembers}
      totalTeamHens={totalTeamHens}
      totalEarnedEggs={totalEarnedEggs}
      sponsorUsername={sponsorRow?.inviter?.username ?? null}
      level1Members={level1Members}
      level2Members={level2Members}
    />
  );
}

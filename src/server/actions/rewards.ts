"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { VIP_REWARD_TIERS } from "@/lib/rewards/config";
import { randomUUID } from "node:crypto";

export interface ClaimRewardResult {
  success: boolean;
  message: string;
  claimId?: string;
  rewardEggUnits?: number;
}

export async function submitMilestoneRewardClaimAction(
  milestoneKey: string
): Promise<ClaimRewardResult> {
  const user = await requireUser();

  // 1. Find milestone config
  const milestone = VIP_REWARD_TIERS.find((t) => t.id === milestoneKey || t.levelCode === milestoneKey);
  if (!milestone) {
    return { success: false, message: "Invalid reward milestone selected." };
  }

  // 2. Fetch direct Level 1 referred users
  const directReferrals = await prisma.referralRelationship.findMany({
    where: { inviterId: user.id },
    select: { inviteeId: true },
  });
  const directUserIds = directReferrals.map((r) => r.inviteeId);

  // 3. Compute verified Level 1 investment from approved purchase orders
  const level1Orders =
    directUserIds.length > 0
      ? await prisma.purchaseOrder.findMany({
          where: {
            userId: { in: directUserIds },
            status: "APPROVED",
          },
          select: { totalAmountPaisa: true },
        })
      : [];

  const verifiedLevel1InvestmentRs = level1Orders.reduce(
    (sum, o) => sum + Number(o.totalAmountPaisa / 100n),
    0
  );

  // 4. Validate eligibility
  if (verifiedLevel1InvestmentRs < milestone.requiredLevel1InvestmentRs) {
    return {
      success: false,
      message: `Eligibility requirement not met. You have PKR ${verifiedLevel1InvestmentRs.toLocaleString()} in Level 1 investment, but PKR ${milestone.requiredLevel1InvestmentRs.toLocaleString()} is required.`,
    };
  }

  // 5. Check duplicate claims
  const existingClaim = await prisma.milestoneRewardClaim.findUnique({
    where: {
      userId_milestoneKey: {
        userId: user.id,
        milestoneKey: milestone.id,
      },
    },
  });

  if (existingClaim && (existingClaim.status === "COLLECTED" || existingClaim.status === "APPROVED")) {
    return {
      success: false,
      message: `You have already collected the ${milestone.levelCode} milestone reward.`,
    };
  }

  // 6. Execute atomic transaction to record claim and credit Golden Egg units
  const idempotencyKey = `milestone-reward:${user.id}:${milestone.id}:${randomUUID()}`;

  const result = await prisma.$transaction(async (tx) => {
    // A. Create or update claim record
    const claim = await tx.milestoneRewardClaim.upsert({
      where: {
        userId_milestoneKey: {
          userId: user.id,
          milestoneKey: milestone.id,
        },
      },
      create: {
        userId: user.id,
        milestoneKey: milestone.id,
        milestoneName: milestone.levelCode,
        tierNumber: milestone.levelNumber,
        requiredLevel1InvestmentRs: milestone.requiredLevel1InvestmentRs,
        verifiedLevel1InvestmentRs,
        rewardEggUnits: milestone.goldenEggReward,
        status: "COLLECTED",
        collectedAt: new Date(),
      },
      update: {
        status: "COLLECTED",
        verifiedLevel1InvestmentRs,
        collectedAt: new Date(),
      },
    });

    // B. Credit Golden Egg ledger entry
    const ledgerEntry = await tx.eggLedgerEntry.create({
      data: {
        userId: user.id,
        entryType: "REFERRAL_CREDIT",
        sourceType: "REFERRAL_REWARD",
        sourceId: claim.id,
        eggUnits: milestone.goldenEggReward,
        description: `Milestone Reward: ${milestone.levelCode} (+${milestone.goldenEggReward.toLocaleString()} Golden Eggs)`,
        idempotencyKey,
      },
    });

    // C. Update claim with ledger entry id
    await tx.milestoneRewardClaim.update({
      where: { id: claim.id },
      data: { ledgerEntryId: ledgerEntry.id },
    });

    return claim;
  });

  revalidatePath("/dashboard/rewards");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profit-egg");

  return {
    success: true,
    message: `Successfully collected ${milestone.goldenEggReward.toLocaleString()} Golden Eggs for ${milestone.levelCode}!`,
    claimId: result.id,
    rewardEggUnits: milestone.goldenEggReward,
  };
}

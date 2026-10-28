import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { createAuditLog } from "@/server/services/audit";

export async function creditDirectReferralRewardForPurchase({
  tx,
  purchaseOrderId,
}: {
  tx: Prisma.TransactionClient;
  purchaseOrderId: string;
}) {
  const order = await tx.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    select: { id: true, userId: true, status: true },
  });
  if (!order || order.status !== "APPROVED") return null;

  const relationship = await tx.referralRelationship.findUnique({
    where: { inviteeId: order.userId },
    include: { inviter: true, invitee: true },
  });
  if (!relationship || relationship.inviterId === relationship.inviteeId) return null;
  if (relationship.inviter.status !== "ACTIVE" || relationship.inviter.deletedAt) return null;

  const now = new Date();
  const rule = await tx.referralRule.findFirst({
    where: {
      isActive: true,
      archivedAt: null,
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!rule) return null;

  const existing = await tx.referralReward.findUnique({
    where: {
      relationshipId_qualifyingPurchaseOrderId: {
        relationshipId: relationship.id,
        qualifyingPurchaseOrderId: order.id,
      },
    },
  });
  if (existing) return existing;

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${relationship.inviterId}))`;
  const rewardId = randomUUID();
  const idempotencyKey = `referral-reward:${relationship.id}:${order.id}`;
  const inserted = await tx.$queryRaw<{ id: string }[]>`
    INSERT INTO "ReferralReward" (
      "id",
      "inviterUserId",
      "inviteeUserId",
      "relationshipId",
      "ruleId",
      "qualifyingPurchaseOrderId",
      "rewardEggUnits",
      "status",
      "idempotencyKey",
      "createdAt"
    )
    VALUES (
      ${rewardId}::uuid,
      ${relationship.inviterId}::uuid,
      ${relationship.inviteeId}::uuid,
      ${relationship.id}::uuid,
      ${rule.id}::uuid,
      ${order.id}::uuid,
      ${rule.rewardEggUnits},
      'PENDING'::"ReferralRewardStatus",
      ${idempotencyKey},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("relationshipId", "qualifyingPurchaseOrderId") DO NOTHING
    RETURNING "id"
  `;

  const reward = inserted[0]
    ? await tx.referralReward.findUniqueOrThrow({ where: { id: inserted[0].id } })
    : await tx.referralReward.findUniqueOrThrow({
        where: {
          relationshipId_qualifyingPurchaseOrderId: {
            relationshipId: relationship.id,
            qualifyingPurchaseOrderId: order.id,
          },
        },
      });

  if (reward.status === "CREDITED") return reward;

  const ledgerEntry = await tx.eggLedgerEntry.create({
    data: {
      userId: relationship.inviterId,
      entryType: "REFERRAL_CREDIT",
      eggUnits: rule.rewardEggUnits,
      description: "Direct referral reward for approved demo purchase",
      sourceType: "REFERRAL_REWARD",
      sourceId: reward.id,
      idempotencyKey: `ledger:${idempotencyKey}`,
      metadata: {
        relationshipId: relationship.id,
        qualifyingPurchaseOrderId: order.id,
        rewardEggUnits: rule.rewardEggUnits,
      } satisfies Prisma.InputJsonValue,
    },
  });

  const credited = await tx.referralReward.update({
    where: { id: reward.id },
    data: {
      status: "CREDITED",
      ledgerEntryId: ledgerEntry.id,
      creditedAt: new Date(),
    },
  });

  await tx.notification.create({
    data: {
      userId: relationship.inviterId,
      type: "REFERRAL",
      title: "Direct referral reward credited",
      message: `${rule.rewardEggUnits} eggs were credited for a qualifying direct referral purchase.`,
      metadata: {
        referralRewardId: reward.id,
        qualifyingPurchaseOrderId: order.id,
      },
    },
  });
  await createAuditLog(
    {
      actorUserId: null,
      action: "REFERRAL_REWARD_CREDITED",
      entityType: "ReferralReward",
      entityId: reward.id,
      metadata: {
        inviterUserId: relationship.inviterId,
        inviteeUserId: relationship.inviteeId,
        qualifyingPurchaseOrderId: order.id,
        rewardEggUnits: rule.rewardEggUnits,
      } satisfies Prisma.InputJsonValue,
    },
    tx,
  );

  return credited;
}

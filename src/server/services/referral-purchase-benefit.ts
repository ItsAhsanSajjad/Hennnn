import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import {
  addUtcDays,
  createOrderReference,
  stableJsonHash,
  toUtcDate,
} from "@/lib/utilities/phase2";
import { createAuditLog } from "@/server/services/audit";

export const referralPurchaseBenefitSettingKey = "referral_purchase_benefit";

export type ReferralPurchaseBenefitConfig = {
  isActive: boolean;
  qualifyingHenQuantity: number;
  inviterHenRewardPercent: number;
  inviteeDiscountPaisaPerHen: number;
  notes: string;
};

export const referralPurchaseBenefitDefaults: ReferralPurchaseBenefitConfig = {
  isActive: true,
  qualifyingHenQuantity: 1,
  inviterHenRewardPercent: 20,
  inviteeDiscountPaisaPerHen: 10_000,
  notes:
    "Direct referral campaign. A referred customer gets a per-hen discount; the inviter earns a percentage of the referred customer's hens after a qualifying approved purchase.",
};

function parseConfig(value: unknown): ReferralPurchaseBenefitConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const config = value as Record<string, unknown>;
  const isActive = config.isActive;
  const qualifyingHenQuantity = config.qualifyingHenQuantity;
  // Backward compatible: older stored settings used a fixed inviterHenRewardQuantity
  // and no percentage. Fall back to the default percent when it is absent.
  const inviterHenRewardPercent =
    typeof config.inviterHenRewardPercent === "number"
      ? config.inviterHenRewardPercent
      : referralPurchaseBenefitDefaults.inviterHenRewardPercent;
  const inviteeDiscountPaisaPerHen = config.inviteeDiscountPaisaPerHen;
  const notes = config.notes;

  if (
    typeof isActive !== "boolean" ||
    typeof qualifyingHenQuantity !== "number" ||
    !Number.isInteger(qualifyingHenQuantity) ||
    qualifyingHenQuantity < 1 ||
    !Number.isInteger(inviterHenRewardPercent) ||
    inviterHenRewardPercent < 0 ||
    inviterHenRewardPercent > 100 ||
    typeof inviteeDiscountPaisaPerHen !== "number" ||
    !Number.isInteger(inviteeDiscountPaisaPerHen) ||
    inviteeDiscountPaisaPerHen < 0 ||
    typeof notes !== "string"
  ) {
    return null;
  }

  return {
    isActive,
    qualifyingHenQuantity,
    inviterHenRewardPercent,
    inviteeDiscountPaisaPerHen,
    notes,
  };
}

export async function getReferralPurchaseBenefitConfig() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: referralPurchaseBenefitSettingKey },
    select: { value: true },
  });
  return parseConfig(setting?.value);
}

export async function getReferralPurchaseDiscount({
  userId,
  baseUnitPricePaisa,
}: {
  userId: string;
  baseUnitPricePaisa: bigint;
}) {
  const config = await getReferralPurchaseBenefitConfig();
  if (!config?.isActive || config.inviteeDiscountPaisaPerHen === 0) {
    return { config, discountPaisaPerHen: 0n };
  }

  const relationship = await prisma.referralRelationship.findUnique({
    where: { inviteeId: userId },
    select: { id: true },
  });
  if (!relationship) return { config, discountPaisaPerHen: 0n };

  const configuredDiscount = BigInt(config.inviteeDiscountPaisaPerHen);
  return {
    config,
    discountPaisaPerHen:
      configuredDiscount > baseUnitPricePaisa ? baseUnitPricePaisa : configuredDiscount,
  };
}

export async function applyReferralPurchaseBenefitForApprovedOrder({
  tx,
  purchaseOrderId,
}: {
  tx: Prisma.TransactionClient;
  purchaseOrderId: string;
}) {
  const setting = await tx.appSetting.findUnique({
    where: { key: referralPurchaseBenefitSettingKey },
    select: { value: true },
  });
  const config = parseConfig(setting?.value);
  if (!config?.isActive) return null;

  const order = await tx.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    select: {
      id: true,
      userId: true,
      status: true,
      quantity: true,
      henPlanId: true,
      planNameSnapshot: true,
      planCodeSnapshot: true,
      dailyEggUnitsSnapshot: true,
      maximumEggUnitsSnapshot: true,
      validityDaysSnapshot: true,
      termsVersionSnapshot: true,
      orderReference: true,
      idempotencyKey: true,
    },
  });
  if (
    !order ||
    order.status !== "APPROVED" ||
    order.quantity < config.qualifyingHenQuantity ||
    order.idempotencyKey?.startsWith("referral-hen-benefit:")
  ) {
    return null;
  }

  // The inviter earns a percentage of the referred customer's purchased hens,
  // rounded down. Small orders that round to zero create no reward.
  const rewardHens = Math.floor((order.quantity * config.inviterHenRewardPercent) / 100);
  if (rewardHens < 1) return null;

  const relationship = await tx.referralRelationship.findUnique({
    where: { inviteeId: order.userId },
    include: { inviter: true },
  });
  if (!relationship || relationship.inviterId === order.userId) return null;
  if (relationship.inviter.status !== "ACTIVE" || relationship.inviter.deletedAt) return null;

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${relationship.inviterId}))`;
  const idempotencyKey = `referral-hen-benefit:${relationship.id}:${order.id}`;
  const existing = await tx.purchaseOrder.findUnique({
    where: { userId_idempotencyKey: { userId: relationship.inviterId, idempotencyKey } },
  });
  if (existing) return existing;

  const now = new Date();
  const productionStart = toUtcDate(now);
  const productionEnd = addUtcDays(productionStart, order.validityDaysSnapshot - 1);
  const rewardOrder = await tx.purchaseOrder.create({
    data: {
      orderReference: createOrderReference(),
      userId: relationship.inviterId,
      henPlanId: order.henPlanId,
      status: "APPROVED",
      quantity: rewardHens,
      unitPricePaisa: 0n,
      totalAmountPaisa: 0n,
      planNameSnapshot: `Referral benefit: ${order.planNameSnapshot}`.slice(0, 120),
      planCodeSnapshot: order.planCodeSnapshot,
      dailyEggUnitsSnapshot: order.dailyEggUnitsSnapshot,
      maximumEggUnitsSnapshot: order.maximumEggUnitsSnapshot,
      validityDaysSnapshot: order.validityDaysSnapshot,
      termsVersionSnapshot: order.termsVersionSnapshot,
      paymentDueAt: now,
      approvedAt: now,
      idempotencyKey,
      idempotencyRequestHash: stableJsonHash({
        type: "referral-hen-benefit",
        relationshipId: relationship.id,
        sourceOrderId: order.id,
        quantity: rewardHens,
      }),
    },
  });

  const asset = await tx.henAsset.create({
    data: {
      userId: relationship.inviterId,
      purchaseOrderId: rewardOrder.id,
      henPlanId: order.henPlanId,
      status: "ACTIVE",
      quantity: rewardHens,
      activatedAt: now,
      productionStartDate: productionStart,
      productionEndDate: productionEnd,
      dailyEggUnitsPerHen: order.dailyEggUnitsSnapshot,
      maximumEggUnitsPerHen: order.maximumEggUnitsSnapshot,
      totalMaximumEggUnits: order.maximumEggUnitsSnapshot * rewardHens,
    },
  });

  await tx.notification.create({
    data: {
      userId: relationship.inviterId,
      type: "REFERRAL",
      title: "Referral hens activated",
      message: `${rewardHens} hens were added after a direct referral completed a qualifying purchase.`,
      metadata: {
        sourceOrderReference: order.orderReference,
        referralRelationshipId: relationship.id,
        rewardOrderReference: rewardOrder.orderReference,
        rewardHenQuantity: rewardHens,
      } satisfies Prisma.InputJsonValue,
    },
  });
  await createAuditLog(
    {
      actorUserId: null,
      action: "REFERRAL_REWARD_CREDITED",
      entityType: "ReferralHenBenefit",
      entityId: rewardOrder.id,
      metadata: {
        relationshipId: relationship.id,
        sourceOrderId: order.id,
        rewardOrderId: rewardOrder.id,
        henAssetId: asset.id,
        rewardHenQuantity: rewardHens,
      } satisfies Prisma.InputJsonValue,
    },
    tx,
  );

  return rewardOrder;
}

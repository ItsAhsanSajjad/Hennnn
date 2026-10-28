import type { Prisma, User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { canManageReferralRules, canManageSaleRates } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";

export async function saveEggSaleRate({
  actor,
  id,
  code,
  name,
  ratePaisaPerEgg,
  effectiveFrom,
  effectiveUntil,
  isActive,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  id?: string;
  code: string;
  name: string;
  ratePaisaPerEgg: number;
  effectiveFrom: Date;
  effectiveUntil?: Date | null;
  isActive: boolean;
  notes?: string;
}) {
  if (!canManageSaleRates(actor.role)) {
    throw new Error("You are not allowed to manage egg-sale rates.");
  }

  return prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.eggSaleRate.updateMany({
        where: { code, isActive: true, archivedAt: null, id: id ? { not: id } : undefined },
        data: { isActive: false, updatedByUserId: actor.id },
      });
    }

    const data = {
      code,
      name,
      ratePaisaPerEgg: BigInt(ratePaisaPerEgg),
      effectiveFrom,
      effectiveUntil,
      isActive,
      notes,
      updatedByUserId: actor.id,
    };
    const rate = id
      ? await tx.eggSaleRate.update({ where: { id }, data })
      : await tx.eggSaleRate.create({
          data: {
            ...data,
            createdByUserId: actor.id,
          },
        });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: id ? "EGG_SALE_RATE_UPDATED" : "EGG_SALE_RATE_CREATED",
        entityType: "EggSaleRate",
        entityId: rate.id,
        metadata: {
          code: rate.code,
          isActive: rate.isActive,
          ratePaisaPerEgg: rate.ratePaisaPerEgg.toString(),
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    return rate;
  });
}

export async function saveReferralRule({
  actor,
  id,
  code,
  name,
  rewardEggUnits,
  effectiveFrom,
  effectiveUntil,
  isActive,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  id?: string;
  code: string;
  name: string;
  rewardEggUnits: number;
  effectiveFrom: Date;
  effectiveUntil?: Date | null;
  isActive: boolean;
  notes?: string;
}) {
  if (!canManageReferralRules(actor.role)) {
    throw new Error("You are not allowed to manage referral rules.");
  }

  return prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.referralRule.updateMany({
        where: { code, isActive: true, archivedAt: null, id: id ? { not: id } : undefined },
        data: { isActive: false, updatedByUserId: actor.id },
      });
    }

    const data = {
      code,
      name,
      rewardEggUnits,
      effectiveFrom,
      effectiveUntil,
      isActive,
      notes,
      updatedByUserId: actor.id,
    };
    const rule = id
      ? await tx.referralRule.update({ where: { id }, data })
      : await tx.referralRule.create({
          data: {
            ...data,
            createdByUserId: actor.id,
          },
        });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: id ? "REFERRAL_RULE_UPDATED" : "REFERRAL_RULE_CREATED",
        entityType: "ReferralRule",
        entityId: rule.id,
        metadata: {
          code: rule.code,
          isActive: rule.isActive,
          rewardEggUnits: rule.rewardEggUnits,
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    return rule;
  });
}

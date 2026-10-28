import type { Prisma, User } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/database/prisma";
import { addUtcDays, createOrderReference, stableJsonHash } from "@/lib/utilities/phase2";
import { createAuditLog } from "@/server/services/audit";
import { getActivePlanPromotionForPlan } from "@/server/services/plan-promotions";
import {
  getPurchaseDiscountForQuantity,
  getPurchaseDiscountTiers,
} from "@/server/services/purchase-discount-tiers";
import { getReferralPurchaseDiscount } from "@/server/services/referral-purchase-benefit";

export async function createPurchaseOrderForUser({
  user,
  planId,
  quantity,
  idempotencyKey,
}: {
  user: Pick<User, "id">;
  planId: string;
  quantity: number;
  idempotencyKey?: string;
}) {
  const plan = await prisma.henPlan.findFirst({
    where: { id: planId, status: "ACTIVE", isActive: true, archivedAt: null },
  });

  if (!plan) {
    throw new Error("This hen plan is not available.");
  }
  if (quantity < plan.minimumQuantity || quantity > plan.maximumQuantity) {
    throw new Error("Selected quantity is outside the plan limits.");
  }

  const planPromotion = await getActivePlanPromotionForPlan({
    planId: plan.id,
    baseUnitPricePaisa: plan.pricePaisa,
  });
  const priceAfterPlanPromotion = plan.pricePaisa - planPromotion.discountPaisaPerHen;
  const referralBenefit = await getReferralPurchaseDiscount({
    userId: user.id,
    baseUnitPricePaisa: priceAfterPlanPromotion,
  });
  const priceAfterReferralDiscount = priceAfterPlanPromotion - referralBenefit.discountPaisaPerHen;
  const quantityDiscount = getPurchaseDiscountForQuantity({
    tiers: await getPurchaseDiscountTiers(),
    quantity,
    baseUnitPricePaisa: priceAfterReferralDiscount,
  });
  const unitPricePaisa = priceAfterReferralDiscount - quantityDiscount.discountPaisaPerHen;
  const totalAmountPaisa = unitPricePaisa * BigInt(quantity);
  const requestHash = idempotencyKey
    ? stableJsonHash({
        operation: "purchase-order:create",
        planId,
        quantity,
        unitPricePaisa: unitPricePaisa.toString(),
      })
    : null;

  if (idempotencyKey) {
    const orderId = randomUUID();
    const inserted = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "PurchaseOrder" (
        "id",
        "orderReference",
        "userId",
        "henPlanId",
        "status",
        "quantity",
        "unitPricePaisa",
        "totalAmountPaisa",
        "planNameSnapshot",
        "planCodeSnapshot",
        "dailyEggUnitsSnapshot",
        "maximumEggUnitsSnapshot",
        "validityDaysSnapshot",
        "termsVersionSnapshot",
        "paymentDueAt",
        "idempotencyKey",
        "idempotencyRequestHash",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${orderId}::uuid,
        ${createOrderReference()},
        ${user.id}::uuid,
        ${plan.id}::uuid,
        'AWAITING_PAYMENT'::"PurchaseOrderStatus",
        ${quantity},
        ${unitPricePaisa},
        ${totalAmountPaisa},
        ${plan.name},
        ${plan.code},
        ${plan.dailyEggUnits},
        ${plan.maximumEggUnits},
        ${plan.validityDays},
        ${plan.termsVersion},
        ${addUtcDays(new Date(), 1)},
        ${idempotencyKey},
        ${requestHash},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("userId", "idempotencyKey") DO NOTHING
      RETURNING "id"
    `;

    const order = inserted[0]
      ? await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: inserted[0].id } })
      : await prisma.purchaseOrder.findUniqueOrThrow({
          where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } },
        });

    if (order.idempotencyRequestHash !== requestHash) {
      throw new Error("Idempotency key was already used for a different order request.");
    }

    if (inserted[0]) {
      await createAuditLog({
        actorUserId: user.id,
        action: "PURCHASE_ORDER_CREATED",
        entityType: "PurchaseOrder",
        entityId: order.id,
        metadata: {
          orderReference: order.orderReference,
          planCode: order.planCodeSnapshot,
          quantity,
          totalAmountPaisa: order.totalAmountPaisa.toString(),
          planPromotionDiscountPaisaPerHen: planPromotion.discountPaisaPerHen.toString(),
          planPromotionLabel: planPromotion.promotion?.label ?? null,
          referralDiscountPaisaPerHen: referralBenefit.discountPaisaPerHen.toString(),
          quantityDiscountPercent: quantityDiscount.tier?.discountPercent ?? 0,
          quantityDiscountPaisaPerHen: quantityDiscount.discountPaisaPerHen.toString(),
        } satisfies Prisma.InputJsonValue,
      });
    }

    return order;
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.create({
      data: {
        orderReference: createOrderReference(),
        userId: user.id,
        henPlanId: plan.id,
        status: "AWAITING_PAYMENT",
        quantity,
        unitPricePaisa,
        totalAmountPaisa,
        planNameSnapshot: plan.name,
        planCodeSnapshot: plan.code,
        dailyEggUnitsSnapshot: plan.dailyEggUnits,
        maximumEggUnitsSnapshot: plan.maximumEggUnits,
        validityDaysSnapshot: plan.validityDays,
        termsVersionSnapshot: plan.termsVersion,
        paymentDueAt: addUtcDays(new Date(), 1),
      },
    });

    await createAuditLog(
      {
        actorUserId: user.id,
        action: "PURCHASE_ORDER_CREATED",
        entityType: "PurchaseOrder",
        entityId: order.id,
        metadata: {
          orderReference: order.orderReference,
          planCode: order.planCodeSnapshot,
          quantity,
          totalAmountPaisa: order.totalAmountPaisa.toString(),
          planPromotionDiscountPaisaPerHen: planPromotion.discountPaisaPerHen.toString(),
          planPromotionLabel: planPromotion.promotion?.label ?? null,
          referralDiscountPaisaPerHen: referralBenefit.discountPaisaPerHen.toString(),
          quantityDiscountPercent: quantityDiscount.tier?.discountPercent ?? 0,
          quantityDiscountPaisaPerHen: quantityDiscount.discountPaisaPerHen.toString(),
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );

    return order;
  });
}

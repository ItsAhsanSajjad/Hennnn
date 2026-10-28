import { prisma } from "@/lib/database/prisma";

export const planPromotionsSettingKey = "plan_promotions";

export type PlanPromotion = {
  planId: string;
  label: string;
  description: string;
  discountPaisaPerHen: number;
  isActive: boolean;
};

function parsePromotion(value: unknown): PlanPromotion | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const promotion = value as Record<string, unknown>;

  if (
    typeof promotion.planId !== "string" ||
    typeof promotion.label !== "string" ||
    typeof promotion.description !== "string" ||
    typeof promotion.discountPaisaPerHen !== "number" ||
    !Number.isSafeInteger(promotion.discountPaisaPerHen) ||
    promotion.discountPaisaPerHen < 0 ||
    typeof promotion.isActive !== "boolean"
  ) {
    return null;
  }

  return {
    planId: promotion.planId,
    label: promotion.label,
    description: promotion.description,
    discountPaisaPerHen: promotion.discountPaisaPerHen,
    isActive: promotion.isActive,
  };
}

export function parsePlanPromotions(value: unknown): PlanPromotion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parsePromotion)
    .filter((promotion): promotion is PlanPromotion => promotion !== null);
}

export async function getPlanPromotions() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: planPromotionsSettingKey },
    select: { value: true },
  });
  return parsePlanPromotions(setting?.value);
}

export function getActivePlanPromotion({
  promotions,
  planId,
  baseUnitPricePaisa,
}: {
  promotions: PlanPromotion[];
  planId: string;
  baseUnitPricePaisa: bigint;
}) {
  const promotion = promotions.find(
    (candidate) => candidate.planId === planId && candidate.isActive,
  );
  if (!promotion || promotion.discountPaisaPerHen === 0) {
    return { promotion: null, discountPaisaPerHen: 0n };
  }

  const configuredDiscount = BigInt(promotion.discountPaisaPerHen);
  return {
    promotion,
    discountPaisaPerHen:
      configuredDiscount > baseUnitPricePaisa ? baseUnitPricePaisa : configuredDiscount,
  };
}

export async function getActivePlanPromotionForPlan({
  planId,
  baseUnitPricePaisa,
}: {
  planId: string;
  baseUnitPricePaisa: bigint;
}) {
  return getActivePlanPromotion({
    promotions: await getPlanPromotions(),
    planId,
    baseUnitPricePaisa,
  });
}

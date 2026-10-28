import type { HenPlan } from "@prisma/client";

import { getActivePlanPromotion, type PlanPromotion } from "@/server/services/plan-promotions";
import type { PublicPlanPackageSetting } from "@/server/services/public-plan-package-settings";
import {
  getPurchaseDiscountForQuantity,
  type PurchaseDiscountTier,
} from "@/server/services/purchase-discount-tiers";

type PublicPlan = Pick<
  HenPlan,
  | "id"
  | "name"
  | "slug"
  | "shortDescription"
  | "pricePaisa"
  | "validityDays"
  | "minimumQuantity"
  | "maximumQuantity"
  | "isFeatured"
  | "termsVersion"
>;

export type PublicPlanPackage = {
  key: string;
  planId: string;
  planSlug: string;
  name: string;
  hens: number;
  totalPaisa: bigint;
  originalTotalPaisa: bigint;
  pricePerHenPaisa: bigint;
  originalPricePerHenPaisa: bigint;
  bundleDiscountPercent: number;
  bundleDiscountPaisaPerHen: bigint;
  validityDays: number;
  badge?: string;
  audience: string;
  termsVersion: string;
  offerDescription?: string;
};

type PackageInput = {
  key: string;
  name: string;
  hens: number;
  audience: string;
  badge?: string;
};

function packageFor(
  plan: PublicPlan,
  promotions: PlanPromotion[],
  purchaseDiscountTiers: PurchaseDiscountTier[],
  { key, name, hens, audience, badge }: PackageInput,
): PublicPlanPackage {
  const activeOffer = getActivePlanPromotion({
    promotions,
    planId: plan.id,
    baseUnitPricePaisa: plan.pricePaisa,
  });
  const priceAfterPlanPromotion = plan.pricePaisa - activeOffer.discountPaisaPerHen;
  const packageDiscount = getPurchaseDiscountForQuantity({
    tiers: purchaseDiscountTiers,
    quantity: hens,
    baseUnitPricePaisa: priceAfterPlanPromotion,
  });
  const pricePerHenPaisa = priceAfterPlanPromotion - packageDiscount.discountPaisaPerHen;

  return {
    key,
    planId: plan.id,
    planSlug: plan.slug,
    name,
    hens,
    totalPaisa: pricePerHenPaisa * BigInt(hens),
    originalTotalPaisa: plan.pricePaisa * BigInt(hens),
    pricePerHenPaisa,
    originalPricePerHenPaisa: plan.pricePaisa,
    bundleDiscountPercent: packageDiscount.tier?.discountPercent ?? 0,
    bundleDiscountPaisaPerHen: packageDiscount.discountPaisaPerHen,
    validityDays: plan.validityDays,
    badge: activeOffer.promotion?.label ?? badge,
    audience,
    termsVersion: plan.termsVersion,
    offerDescription: activeOffer.promotion?.description,
  };
}

export function buildPublicPlanPackages(
  plans: PublicPlan[],
  promotions: PlanPromotion[] = [],
  packageSettings?: PublicPlanPackageSetting[],
  purchaseDiscountTiers: PurchaseDiscountTier[] = [],
): PublicPlanPackage[] {
  if (plans.length === 0) return [];

  // Preserve the familiar 1, 5 and 10 hen options while only one base plan is published.
  if (plans.length === 1) {
    const [plan] = plans;
    const defaults = [
      {
        key: "starter",
        name: "Starter Plan",
        hens: 1,
        audience: "A clear place to begin",
      },
      {
        key: "recommended",
        name: "Recommended Plan",
        hens: 5,
        badge: "Recommended",
        audience: "For households adding several hens",
      },
      {
        key: "premium",
        name: "Premium Plan",
        hens: 10,
        audience: "For a larger recorded flock",
      },
    ] as const;
    const cards = packageSettings?.length === 3 ? packageSettings : defaults;
    return cards.map((card) => packageFor(plan, promotions, purchaseDiscountTiers, card));
  }

  return plans.map((plan) => {
    const hens =
      plan.minimumQuantity === plan.maximumQuantity ? plan.minimumQuantity : plan.minimumQuantity;
    return packageFor(plan, promotions, purchaseDiscountTiers, {
      key: plan.id,
      name: plan.name,
      hens,
      badge: plan.isFeatured ? "Recommended" : undefined,
      audience: plan.shortDescription,
    });
  });
}

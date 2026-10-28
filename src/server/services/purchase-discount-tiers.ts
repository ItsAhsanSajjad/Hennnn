import { prisma } from "@/lib/database/prisma";

export const purchaseDiscountTiersSettingKey = "purchase_quantity_discount_tiers";

export type PurchaseDiscountTier = {
  key: "tierOne" | "tierTwo" | "tierThree";
  label: string;
  minimumQuantity: number;
  maximumQuantity: number | null;
  discountPercent: number;
};

export const purchaseDiscountTierDefaults: PurchaseDiscountTier[] = [];

function parseTier(value: unknown): PurchaseDiscountTier | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const tier = value as Record<string, unknown>;
  if (
    (tier.key !== "tierOne" && tier.key !== "tierTwo" && tier.key !== "tierThree") ||
    typeof tier.label !== "string" ||
    tier.label.trim().length < 3 ||
    typeof tier.minimumQuantity !== "number" ||
    !Number.isInteger(tier.minimumQuantity) ||
    tier.minimumQuantity < 1 ||
    (tier.maximumQuantity !== null &&
      (typeof tier.maximumQuantity !== "number" ||
        !Number.isInteger(tier.maximumQuantity) ||
        tier.maximumQuantity < tier.minimumQuantity)) ||
    typeof tier.discountPercent !== "number" ||
    !Number.isInteger(tier.discountPercent) ||
    tier.discountPercent < 0 ||
    tier.discountPercent > 90
  ) {
    return null;
  }

  return {
    key: tier.key,
    label: tier.label.trim(),
    minimumQuantity: tier.minimumQuantity,
    maximumQuantity: tier.maximumQuantity as number | null,
    discountPercent: tier.discountPercent,
  };
}

export function parsePurchaseDiscountTiers(value: unknown): PurchaseDiscountTier[] {
  if (!Array.isArray(value)) return purchaseDiscountTierDefaults;
  const tiers = value.map(parseTier).filter((tier): tier is PurchaseDiscountTier => tier !== null);
  if (tiers.length !== purchaseDiscountTierDefaults.length) return purchaseDiscountTierDefaults;

  const ordered = [...tiers].sort((left, right) => left.minimumQuantity - right.minimumQuantity);
  const valid = ordered.every((tier, index) => {
    if (index === 0) return true;
    const previousMaximum = ordered[index - 1].maximumQuantity;
    return previousMaximum !== null && tier.minimumQuantity > previousMaximum;
  });
  return valid ? ordered : purchaseDiscountTierDefaults;
}

export async function getPurchaseDiscountTiers() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: purchaseDiscountTiersSettingKey },
    select: { value: true },
  });
  return parsePurchaseDiscountTiers(setting?.value);
}

export function getPurchaseDiscountForQuantity({
  tiers,
  quantity,
  baseUnitPricePaisa,
}: {
  tiers: PurchaseDiscountTier[];
  quantity: number;
  baseUnitPricePaisa: bigint;
}) {
  if (!tiers || tiers.length === 0) {
    return { tier: null, discountPaisaPerHen: 0n };
  }
  const tier = tiers.find(
    (candidate) =>
      quantity >= candidate.minimumQuantity &&
      (candidate.maximumQuantity === null || quantity <= candidate.maximumQuantity),
  );
  if (!tier || tier.discountPercent === 0) {
    return { tier: null, discountPaisaPerHen: 0n };
  }

  return {
    tier,
    discountPaisaPerHen: (baseUnitPricePaisa * BigInt(tier.discountPercent)) / 100n,
  };
}

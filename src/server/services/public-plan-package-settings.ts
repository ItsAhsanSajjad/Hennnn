import { prisma } from "@/lib/database/prisma";

export const publicPlanPackageSettingsKey = "public_plan_package_settings";

export type PublicPlanPackageKey = "starter" | "recommended" | "premium";

export type PublicPlanPackageSetting = {
  key: PublicPlanPackageKey;
  name: string;
  hens: number;
  audience: string;
  badge?: string;
};

export const publicPlanPackageDefaults: PublicPlanPackageSetting[] = [
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
];

function isPackageKey(value: unknown): value is PublicPlanPackageKey {
  return value === "starter" || value === "recommended" || value === "premium";
}

function parsePackage(value: unknown): PublicPlanPackageSetting | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    !isPackageKey(item.key) ||
    typeof item.name !== "string" ||
    item.name.trim().length < 3 ||
    typeof item.hens !== "number" ||
    !Number.isInteger(item.hens) ||
    item.hens < 1 ||
    item.hens > 10_000 ||
    typeof item.audience !== "string" ||
    item.audience.trim().length < 3 ||
    (item.badge !== undefined && typeof item.badge !== "string")
  ) {
    return null;
  }
  return {
    key: item.key,
    name: item.name.trim(),
    hens: item.hens,
    audience: item.audience.trim(),
    badge: typeof item.badge === "string" && item.badge.trim() ? item.badge.trim() : undefined,
  };
}

export function parsePublicPlanPackageSettings(value: unknown): PublicPlanPackageSetting[] {
  if (!Array.isArray(value)) return publicPlanPackageDefaults;
  const configured = value
    .map(parsePackage)
    .filter((item): item is PublicPlanPackageSetting => item !== null);

  if (configured.length !== publicPlanPackageDefaults.length) return publicPlanPackageDefaults;
  return publicPlanPackageDefaults.map((fallback) => ({
    ...fallback,
    ...configured.find((item) => item.key === fallback.key),
  }));
}

export async function getPublicPlanPackageSettings() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: publicPlanPackageSettingsKey },
    select: { value: true },
  });
  return parsePublicPlanPackageSettings(setting?.value);
}

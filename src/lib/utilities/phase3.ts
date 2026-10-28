import { randomBytes } from "node:crypto";

import { stableJsonHash } from "@/lib/utilities/phase2";

export function createEggSaleReference() {
  return `EGG-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function createEggMarketSaleReference() {
  return `EMS-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function calculateEggSaleAmountPaisa({
  eggQuantity,
  ratePaisaPerEgg,
}: {
  eggQuantity: number;
  ratePaisaPerEgg: bigint;
}) {
  if (!Number.isInteger(eggQuantity) || eggQuantity <= 0) {
    throw new Error("Egg quantity must be a positive whole number.");
  }
  if (ratePaisaPerEgg <= BigInt(0)) {
    throw new Error("Egg sale rate must be positive.");
  }
  return BigInt(eggQuantity) * ratePaisaPerEgg;
}

export function createEggSaleIdempotencyHash({
  eggQuantity,
  rateId,
  ratePaisaPerEgg,
  payoutMethodId,
}: {
  eggQuantity: number;
  rateId: string;
  ratePaisaPerEgg: bigint;
  payoutMethodId?: string;
}) {
  return stableJsonHash({
    operation: "egg-sale:create",
    eggQuantity,
    rateId,
    ratePaisaPerEgg: ratePaisaPerEgg.toString(),
    payoutMethodId: payoutMethodId ?? null,
  });
}

export function normalizeSettlementReference(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function maskPayoutIdentifier(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  const compact = normalized.replace(/[^A-Za-z0-9]/g, "");
  const lastFour = compact.slice(-4) || "0000";
  const visiblePrefix = compact.length > 8 ? compact.slice(0, 2) : "";
  const masked = visiblePrefix ? `${visiblePrefix}****${lastFour}` : `****${lastFour}`;
  return {
    maskedValue: masked,
    lastFour,
  };
}

export function formatMaskedPayoutIdentifier(lastFour: string) {
  return `**** ${lastFour || "0000"}`;
}

export function maskTeamIdentity({
  username,
  phoneE164,
}: {
  username: string;
  phoneE164?: string | null;
}) {
  const visibleUsername = username.length <= 3 ? username : `${username.slice(0, 3)}***`;
  const phoneSuffix = phoneE164 ? phoneE164.slice(-4) : "none";
  return `${visibleUsername} / ending ${phoneSuffix}`;
}

import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";

/**
 * Payment method availability is stored in the generic AppSetting key/value table
 * (the same pattern used by plan promotions, discount tiers, etc.) rather than a
 * dedicated Settings model. Admins toggle each method independently.
 */
export const paymentMethodsSettingKey = "payment_methods";

export type PaymentMethodSettings = {
  paybostEnabled: boolean;
  manualPaymentEnabled: boolean;
};

export const paymentMethodDefaults: PaymentMethodSettings = {
  paybostEnabled: false,
  manualPaymentEnabled: true,
};

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

function parseSettings(value: unknown): PaymentMethodSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...paymentMethodDefaults };
  }
  const config = value as Record<string, unknown>;
  return {
    paybostEnabled:
      typeof config.paybostEnabled === "boolean"
        ? config.paybostEnabled
        : paymentMethodDefaults.paybostEnabled,
    manualPaymentEnabled:
      typeof config.manualPaymentEnabled === "boolean"
        ? config.manualPaymentEnabled
        : paymentMethodDefaults.manualPaymentEnabled,
  };
}

export async function getPaymentMethodSettings(
  executor: PrismaExecutor = prisma,
): Promise<PaymentMethodSettings> {
  const setting = await executor.appSetting.findUnique({
    where: { key: paymentMethodsSettingKey },
    select: { value: true },
  });
  return parseSettings(setting?.value);
}

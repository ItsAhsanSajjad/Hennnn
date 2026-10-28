"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { referralRuleFormSchema } from "@/lib/validation/phase3";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { saveReferralRule } from "@/server/services/phase3-config-service";
import { referralPurchaseBenefitSettingKey } from "@/server/services/referral-purchase-benefit";
import { createAuditLog } from "@/server/services/audit";

const referralPurchaseBenefitSchema = z.object({
  isActive: z.boolean().default(false),
  qualifyingHenQuantity: z.coerce.number().int().min(1).max(10_000),
  inviterHenRewardPercent: z.coerce.number().int().min(0).max(100),
  inviteeDiscountRupeesPerHen: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/),
  notes: z.string().trim().min(3).max(1000),
});

function optionalBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function optionalDate(value?: string) {
  return value ? new Date(value) : null;
}

function rupeesToPaisa(value: string) {
  const [whole, fractional = ""] = value.split(".");
  const paisa = Number(whole) * 100 + Number(fractional.padEnd(2, "0"));
  return Number.isSafeInteger(paisa) ? paisa : null;
}

export async function saveReferralPurchaseBenefitAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.REFERRAL_RULES_MANAGE);
  const parsed = referralPurchaseBenefitSchema.safeParse({
    isActive: optionalBoolean(formData, "isActive"),
    qualifyingHenQuantity: formData.get("qualifyingHenQuantity"),
    inviterHenRewardPercent: formData.get("inviterHenRewardPercent"),
    inviteeDiscountRupeesPerHen: String(formData.get("inviteeDiscountRupeesPerHen") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the referral campaign settings.", parsed.error.flatten().fieldErrors);
  }

  const inviteeDiscountPaisaPerHen = rupeesToPaisa(parsed.data.inviteeDiscountRupeesPerHen);
  if (inviteeDiscountPaisaPerHen === null) {
    return formError("Enter a valid per-hen discount in rupees.", {
      inviteeDiscountRupeesPerHen: ["Use a whole rupee value or up to two decimal places."],
    });
  }

  const value = {
    isActive: parsed.data.isActive,
    qualifyingHenQuantity: parsed.data.qualifyingHenQuantity,
    inviterHenRewardPercent: parsed.data.inviterHenRewardPercent,
    inviteeDiscountPaisaPerHen,
    notes: parsed.data.notes,
  };
  await prisma.$transaction(async (tx) => {
    await tx.appSetting.upsert({
      where: { key: referralPurchaseBenefitSettingKey },
      update: { value, isPublic: false, updatedByUserId: actor.id },
      create: {
        key: referralPurchaseBenefitSettingKey,
        value,
        isPublic: false,
        updatedByUserId: actor.id,
      },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "APP_SETTING_UPDATED",
        entityType: "ReferralPurchaseBenefit",
        entityId: referralPurchaseBenefitSettingKey,
        metadata: value,
      },
      tx,
    );
  });

  revalidatePath("/admin/referral-rules");
  revalidatePath("/dashboard/plans");
  revalidatePath("/dashboard/referrals");
  return formSuccess("Referral purchase campaign updated.");
}

export async function saveReferralRuleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.REFERRAL_RULES_MANAGE);
  const parsed = referralRuleFormSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    rewardEggUnits: formData.get("rewardEggUnits"),
    effectiveFrom: String(formData.get("effectiveFrom") ?? ""),
    effectiveUntil: String(formData.get("effectiveUntil") ?? "") || undefined,
    isActive: optionalBoolean(formData, "isActive"),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!parsed.success) {
    return formError("Check the referral rule.", parsed.error.flatten().fieldErrors);
  }

  try {
    await saveReferralRule({
      actor,
      ...parsed.data,
      effectiveFrom: new Date(parsed.data.effectiveFrom),
      effectiveUntil: optionalDate(parsed.data.effectiveUntil),
    });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Referral rule save failed.");
  }

  revalidatePath("/admin/referral-rules");
  revalidatePath("/dashboard/referrals");
  return formSuccess("Referral rule saved.");
}

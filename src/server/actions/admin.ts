"use server";

import type { UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { getRequestMeta } from "@/server/request-meta";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import { updateUserRoleAsAdmin, updateUserStatusAsAdmin } from "@/server/services/admin-users";
import { createAuditLog } from "@/server/services/audit";
import { paymentMethodsSettingKey } from "@/server/services/payment-methods";

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

const roleValues = new Set<UserRole>([
  "USER",
  "VIEWER",
  "SUPPORT",
  "FINANCE",
  "ADMIN",
  "SUPER_ADMIN",
]);
const statusValues = new Set<UserStatus>(["PENDING", "ACTIVE", "SUSPENDED", "DISABLED"]);
const publicContentSchema = z.object({
  operatorName: z.string().trim().min(3).max(120),
  supportHours: z.string().trim().min(3).max(180),
  verificationTimeframe: z.string().trim().min(3).max(180),
  eggSalePaymentTimeframe: z.string().trim().min(3).max(180),
  heroLabel: z.string().trim().min(3).max(80),
  heroHeadline: z.string().trim().min(10).max(180),
  heroDescription: z.string().trim().min(20).max(700),
});

export async function updatePublicContentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SETTINGS_VIEW);
  const parsed = publicContentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return formError("Please review the public content fields.");
  const meta = await getRequestMeta();

  await prisma.$transaction(async (tx) => {
    await tx.appSetting.upsert({
      where: { key: "public_content" },
      update: { value: parsed.data, isPublic: true, updatedByUserId: actor.id },
      create: {
        key: "public_content",
        value: parsed.data,
        isPublic: true,
        updatedByUserId: actor.id,
      },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "APP_SETTING_UPDATED",
        entityType: "AppSetting",
        entityId: "public_content",
        metadata: parsed.data,
        ...meta,
      },
      tx,
    );
  });

  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  return formSuccess("Public content updated.");
}

export async function updatePaymentMethodsAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SETTINGS_VIEW);
  const meta = await getRequestMeta();

  const paybostEnabled = readBoolean(formData, "paybostEnabled");
  const manualPaymentEnabled = readBoolean(formData, "manualPaymentEnabled");

  // At least one method must remain enabled, otherwise no customer could ever pay.
  if (!paybostEnabled && !manualPaymentEnabled) {
    return formError("Keep at least one payment method enabled.");
  }

  const value = { paybostEnabled, manualPaymentEnabled };

  await prisma.$transaction(async (tx) => {
    await tx.appSetting.upsert({
      where: { key: paymentMethodsSettingKey },
      update: { value, updatedByUserId: actor.id },
      create: { key: paymentMethodsSettingKey, value, updatedByUserId: actor.id },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "APP_SETTING_UPDATED",
        entityType: "AppSetting",
        entityId: paymentMethodsSettingKey,
        metadata: value,
        ...meta,
      },
      tx,
    );
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard/orders");
  return formSuccess("Payment methods updated.");
}

export async function updateUserStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.USERS_MANAGE);
  const meta = await getRequestMeta();

  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "") as UserStatus;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId || !statusValues.has(status) || reason.length < 5) {
    return formError("Invalid user status request.");
  }

  const result = await updateUserStatusAsAdmin(actor, userId, status, reason, meta);

  if (!result.ok) {
    return formError(result.message);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return formSuccess(result.message);
}

export async function updateUserRoleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.USERS_MANAGE);
  const meta = await getRequestMeta();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!userId || !roleValues.has(role) || reason.length < 5) {
    return formError("Invalid role request.");
  }

  const result = await updateUserRoleAsAdmin(actor, userId, role, reason, meta);

  if (!result.ok) {
    return formError(result.message);
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return formSuccess(result.message);
}

"use server";

import { revalidatePath } from "next/cache";

import { requireAdminPermission } from "@/lib/auth/session";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { settlementRecordSchema, settlementStatusSchema } from "@/lib/validation/phase3";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import {
  confirmManualSettlement,
  failManualSettlement,
  recordManualSettlement,
} from "@/server/services/settlement-service";

export async function recordSettlementAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SETTLEMENTS_RECORD);
  const parsed = settlementRecordSchema.safeParse({
    publicReference: String(formData.get("publicReference") ?? ""),
    settlementReference: String(formData.get("settlementReference") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!parsed.success) {
    return formError("Check the settlement record.", parsed.error.flatten().fieldErrors);
  }

  try {
    await recordManualSettlement({ actor, ...parsed.data });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Settlement recording failed.");
  }

  revalidatePath("/admin/settlements");
  revalidatePath(`/admin/egg-sales/${parsed.data.publicReference}`);
  return formSuccess("Manual settlement record created.");
}

export async function confirmSettlementAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SETTLEMENTS_RECORD);
  const parsed = settlementStatusSchema.safeParse({
    payoutId: String(formData.get("payoutId") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!parsed.success) {
    return formError("Check the settlement confirmation.", parsed.error.flatten().fieldErrors);
  }

  try {
    await confirmManualSettlement({ actor, ...parsed.data });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Settlement confirmation failed.");
  }

  revalidatePath("/admin/settlements");
  revalidatePath("/admin/egg-sales");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/egg-ledger");
  revalidatePath("/dashboard/egg-sales");
  return formSuccess("Settlement confirmed and sale marked paid.");
}

export async function failSettlementAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SETTLEMENTS_RECORD);
  const parsed = settlementStatusSchema.safeParse({
    payoutId: String(formData.get("payoutId") ?? ""),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!parsed.success) {
    return formError("Check the settlement update.", parsed.error.flatten().fieldErrors);
  }

  try {
    await failManualSettlement({ actor, ...parsed.data });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Settlement update failed.");
  }

  revalidatePath("/admin/settlements");
  return formSuccess("Settlement marked failed.");
}

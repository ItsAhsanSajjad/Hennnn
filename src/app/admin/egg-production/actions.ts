"use server";

import { revalidatePath } from "next/cache";

import { requireAdminPermission } from "@/lib/auth/session";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { ensureEggAccrualsCurrent } from "@/server/services/egg-accrual";

export async function triggerDailyEggAccrualAction() {
  await requireAdminPermission(ADMIN_PERMISSIONS.EGG_PRODUCTION_VIEW);

  const result = await ensureEggAccrualsCurrent(true);

  revalidatePath("/admin/egg-production");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profit-egg");
  revalidatePath("/dashboard/sell-eggs");
  revalidatePath("/dashboard/hens");

  return {
    success: true,
    datesRun: result.datesRun,
    totalEggUnits: result.totalEggUnits,
    creditedAssets: result.creditedAssets,
  };
}

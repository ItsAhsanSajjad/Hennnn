"use server";

import { revalidatePath } from "next/cache";

import { requireAdminPermission } from "@/lib/auth/session";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import {
  eggSaleCancelSchema,
  eggSaleReviewSchema,
  saleRateFormSchema,
} from "@/lib/validation/phase3";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import { saveEggSaleRate } from "@/server/services/phase3-config-service";
import { claimEggSaleForReview, reviewEggSaleRequest } from "@/server/services/sale-review-service";

function optionalBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function optionalDate(value?: string) {
  return value ? new Date(value) : null;
}

function rupeesToPaisa(value: string) {
  const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const wholeRupees = Number(match[1]);
  const fractionPaisa = Number((match[2] ?? "").padEnd(2, "0"));
  const paisa = wholeRupees * 100 + fractionPaisa;
  return Number.isSafeInteger(paisa) ? paisa : null;
}

export async function claimEggSaleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_REVIEW);
  const parsed = eggSaleCancelSchema.safeParse({
    publicReference: String(formData.get("publicReference") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the review request.", parsed.error.flatten().fieldErrors);
  }

  try {
    await claimEggSaleForReview({ actor, publicReference: parsed.data.publicReference });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Claim failed.");
  }

  revalidatePath("/admin/egg-sales");
  revalidatePath(`/admin/egg-sales/${parsed.data.publicReference}`);
  return formSuccess("Sale request claimed for review.");
}

export async function reviewEggSaleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_REVIEW);
  const parsed = eggSaleReviewSchema.safeParse({
    publicReference: String(formData.get("publicReference") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    rejectionCategory: String(formData.get("rejectionCategory") ?? "") || undefined,
    userVisibleReason: String(formData.get("userVisibleReason") ?? "") || undefined,
    internalReviewNotes: String(formData.get("internalReviewNotes") ?? "") || undefined,
  });
  if (!parsed.success) {
    return formError("Check the review details.", parsed.error.flatten().fieldErrors);
  }

  try {
    await reviewEggSaleRequest({ actor, ...parsed.data });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Review failed.");
  }

  revalidatePath("/admin/egg-sales");
  revalidatePath(`/admin/egg-sales/${parsed.data.publicReference}`);
  revalidatePath("/dashboard/egg-sales");
  return formSuccess(
    parsed.data.decision === "approve"
      ? "Request moved to payment processing."
      : "Sale rejected and reserved eggs released.",
  );
}

export async function saveEggSaleRateAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SALE_RATES_MANAGE);
  const ratePaisaPerEgg = rupeesToPaisa(String(formData.get("rateRupees") ?? ""));
  if (ratePaisaPerEgg === null || ratePaisaPerEgg < 1) {
    return formError("Enter a valid egg-sale rate in rupees.", {
      rateRupees: ["Use a whole rupee amount or up to two decimal places."],
    });
  }
  const parsed = saleRateFormSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    ratePaisaPerEgg,
    effectiveFrom: String(formData.get("effectiveFrom") ?? ""),
    effectiveUntil: String(formData.get("effectiveUntil") ?? "") || undefined,
    isActive: optionalBoolean(formData, "isActive"),
    notes: String(formData.get("notes") ?? "") || undefined,
  });
  if (!parsed.success) {
    return formError("Check the sale rate.", parsed.error.flatten().fieldErrors);
  }

  try {
    await saveEggSaleRate({
      actor,
      ...parsed.data,
      effectiveFrom: new Date(parsed.data.effectiveFrom),
      effectiveUntil: optionalDate(parsed.data.effectiveUntil),
    });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Sale rate save failed.");
  }

  revalidatePath("/admin/egg-sale-rates");
  revalidatePath("/dashboard/sell-eggs");
  revalidatePath("/dashboard/egg-ledger");
  revalidatePath("/");
  return formSuccess(
    "New active egg-sale rate published. Past sale requests keep their original rate.",
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { eggSaleCancelSchema, eggSaleSubmissionSchema } from "@/lib/validation/phase3";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import { cancelEggSaleRequest, submitEggSaleRequest } from "@/server/services/egg-sale-service";

export async function submitEggSaleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = eggSaleSubmissionSchema.safeParse({
    eggQuantity: formData.get("eggQuantity"),
    payoutMethodId: String(formData.get("payoutMethodId") ?? "") || undefined,
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    termsAccepted: formData.get("termsAccepted") === "on",
  });
  if (!parsed.success) {
    return formError("Check the egg-sale request.", parsed.error.flatten().fieldErrors);
  }
  if (!parsed.data.termsAccepted) {
    return formError("Confirm that this request is subject to review.");
  }

  let publicReference: string;
  try {
    const sale = await submitEggSaleRequest({
      user,
      eggQuantity: parsed.data.eggQuantity,
      payoutMethodId: parsed.data.payoutMethodId,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    publicReference = sale.publicReference;
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Egg-sale request failed.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sell-eggs");
  revalidatePath("/dashboard/egg-ledger");
  revalidatePath("/dashboard/payout-methods");
  revalidatePath("/dashboard/egg-sales");
  redirect(`/dashboard/egg-sales/${publicReference}?submitted=1`);
}

export async function cancelEggSaleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = eggSaleCancelSchema.safeParse({
    publicReference: String(formData.get("publicReference") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the cancellation request.", parsed.error.flatten().fieldErrors);
  }

  try {
    await cancelEggSaleRequest({ user, publicReference: parsed.data.publicReference });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Cancellation failed.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sell-eggs");
  revalidatePath("/dashboard/egg-sales");
  revalidatePath(`/dashboard/egg-sales/${parsed.data.publicReference}`);
  return formSuccess("Egg-sale request cancelled and reserved eggs released.");
}

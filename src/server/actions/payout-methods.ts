"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { payoutMethodArchiveSchema, payoutMethodSchema } from "@/lib/validation/phase3";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import {
  archivePayoutMethodForUser,
  savePayoutMethodForUser,
} from "@/server/services/payout-method-service";

export async function savePayoutMethodAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = payoutMethodSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    provider: String(formData.get("provider") ?? ""),
    bankName: String(formData.get("bankName") ?? "") || undefined,
    accountTitle: String(formData.get("accountTitle") ?? ""),
    accountIdentifier: String(formData.get("accountIdentifier") ?? ""),
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) {
    return formError("Check the payout method.", parsed.error.flatten().fieldErrors);
  }

  try {
    await savePayoutMethodForUser({ user, ...parsed.data });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Payout method save failed.");
  }

  revalidatePath("/dashboard/payout-methods");
  revalidatePath("/dashboard/sell-eggs");
  return formSuccess("Payout method saved with masked details.");
}

export async function archivePayoutMethodAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = payoutMethodArchiveSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) {
    return formError("Check the payout method.");
  }

  try {
    await archivePayoutMethodForUser({ user, id: parsed.data.id });
  } catch (error) {
    return formError(
      error instanceof Error ? error.message : "Payout method could not be archived.",
    );
  }

  revalidatePath("/dashboard/payout-methods");
  revalidatePath("/dashboard/sell-eggs");
  return formSuccess("Payout method archived. Existing sale requests keep their payment snapshot.");
}

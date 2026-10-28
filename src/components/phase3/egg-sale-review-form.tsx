"use client";

import { useActionState } from "react";
import { ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, SelectInput } from "@/components/ui/forms";
import { reviewEggSaleAction } from "@/server/actions/sale-review";
import { initialActionState } from "@/server/actions/types";

export function EggSaleReviewForm({ publicReference }: { publicReference: string }) {
  const [state, action, pending] = useActionState(reviewEggSaleAction, initialActionState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-mist bg-surface p-6">
      <input type="hidden" name="publicReference" value={publicReference} />
      <FormStatus state={state} />
      <Field label="Decision" name="decision" error={state.fieldErrors?.decision}>
        <SelectInput id="decision" name="decision" required>
          <option value="approve">Move to payment processing</option>
          <option value="reject">Reject and release eggs</option>
        </SelectInput>
      </Field>
      <Field
        label="Rejection category"
        name="rejectionCategory"
        error={state.fieldErrors?.rejectionCategory}
      >
        <SelectInput id="rejectionCategory" name="rejectionCategory">
          <option value="">Select a reason when rejecting</option>
          <option value="INVALID_PAYMENT_ACCOUNT">Invalid payment account</option>
          <option value="ACCOUNT_OWNERSHIP">Account ownership could not be verified</option>
          <option value="DUPLICATE_REQUEST">Duplicate request</option>
          <option value="INSUFFICIENT_EGGS">Insufficient available eggs</option>
          <option value="ACCOUNT_RESTRICTED">Account restricted</option>
          <option value="ADDITIONAL_INFORMATION">Additional information required</option>
          <option value="OTHER">Other</option>
        </SelectInput>
      </Field>
      <Field
        label="User-visible reason"
        name="userVisibleReason"
        error={state.fieldErrors?.userVisibleReason}
      >
        <textarea
          id="userVisibleReason"
          name="userVisibleReason"
          className="min-h-24 rounded-md border border-mist px-3 py-2"
        />
      </Field>
      <Field
        label="Internal review notes"
        name="internalReviewNotes"
        error={state.fieldErrors?.internalReviewNotes}
      >
        <textarea
          id="internalReviewNotes"
          name="internalReviewNotes"
          className="min-h-24 rounded-md border border-mist px-3 py-2"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        <ClipboardCheck aria-hidden="true" size={18} />
        {pending ? "Saving..." : "Save review"}
      </Button>
    </form>
  );
}

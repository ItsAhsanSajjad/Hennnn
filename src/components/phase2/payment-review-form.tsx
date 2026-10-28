"use client";

import { useActionState, useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus } from "@/components/ui/forms";
import { cn } from "@/lib/utilities/cn";
import { initialActionState } from "@/server/actions/types";
import { reviewPaymentAction } from "@/server/actions/phase2";

const textareaClass =
  "min-h-24 w-full rounded-md border border-line bg-[#0e1512] px-3 py-2 text-base text-content shadow-sm transition-colors placeholder:text-faint focus:border-leaf focus:outline-none";

export function PaymentReviewForm({ paymentSubmissionId }: { paymentSubmissionId: string }) {
  const [state, action, pending] = useActionState(reviewPaymentAction, initialActionState);
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const isReject = decision === "reject";

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="paymentSubmissionId" value={paymentSubmissionId} />
      <FormStatus state={state} />

      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold text-charcoal">Decision</legend>
        <div className="grid grid-cols-2 gap-2">
          <label
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition-colors",
              !isReject
                ? "border-leaf bg-leaf/10 text-leaf"
                : "border-line text-faint hover:text-content",
            )}
          >
            <input
              type="radio"
              name="decision"
              value="approve"
              checked={!isReject}
              onChange={() => setDecision("approve")}
              className="sr-only"
            />
            <Check aria-hidden="true" size={16} />
            Approve
          </label>
          <label
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition-colors",
              isReject
                ? "border-danger bg-danger/10 text-danger"
                : "border-line text-faint hover:text-content",
            )}
          >
            <input
              type="radio"
              name="decision"
              value="reject"
              checked={isReject}
              onChange={() => setDecision("reject")}
              className="sr-only"
            />
            <X aria-hidden="true" size={16} />
            Reject
          </label>
        </div>
      </fieldset>

      {isReject ? (
        <Field
          label="Rejection reason"
          name="rejectionReason"
          error={state.fieldErrors?.rejectionReason}
          hint="Shown to the customer so they can correct and resubmit."
        >
          <textarea
            id="rejectionReason"
            name="rejectionReason"
            required
            className={textareaClass}
            placeholder="e.g. The transferred amount does not match the order total."
          />
        </Field>
      ) : null}

      <Field
        label="Internal notes (optional)"
        name="reviewNotes"
        error={state.fieldErrors?.reviewNotes}
        hint="Private to the finance team — never shown to the customer."
      >
        <textarea
          id="reviewNotes"
          name="reviewNotes"
          className={textareaClass}
          placeholder="Optional note kept on the record."
        />
      </Field>

      <Button type="submit" variant={isReject ? "danger" : "primary"} disabled={pending}>
        {pending ? "Saving…" : isReject ? "Reject payment" : "Approve payment"}
      </Button>
    </form>
  );
}

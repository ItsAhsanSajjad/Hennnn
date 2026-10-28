"use client";

import { useActionState } from "react";
import { CheckCircle, FileCheck, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import {
  confirmSettlementAction,
  failSettlementAction,
  recordSettlementAction,
} from "@/server/actions/settlements";
import { initialActionState } from "@/server/actions/types";

export function SettlementRecordForm({ publicReference }: { publicReference: string }) {
  const [state, action, pending] = useActionState(recordSettlementAction, initialActionState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-mist bg-surface p-6">
      <input type="hidden" name="publicReference" value={publicReference} />
      <FormStatus state={state} />
      <Field
        label="Manual settlement reference"
        name="settlementReference"
        error={state.fieldErrors?.settlementReference}
      >
        <TextInput id="settlementReference" name="settlementReference" required />
      </Field>
      <Field label="Notes" name="notes" error={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          className="min-h-24 rounded-md border border-mist px-3 py-2"
        />
      </Field>
      <Button type="submit" disabled={pending}>
        <FileCheck aria-hidden="true" size={18} />
        {pending ? "Recording..." : "Record settlement"}
      </Button>
    </form>
  );
}

export function SettlementStatusForms({ payoutId }: { payoutId: string }) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmSettlementAction,
    initialActionState,
  );
  const [failState, failAction, failPending] = useActionState(
    failSettlementAction,
    initialActionState,
  );

  return (
    <div className="grid gap-4">
      <form
        action={confirmAction}
        onSubmit={(event) => {
          if (
            !window.confirm(
              "Confirm that the external payment was sent and this request should be marked paid?",
            )
          ) {
            event.preventDefault();
          }
        }}
        className="grid gap-3 rounded-lg border border-mist bg-surface p-4"
      >
        <input type="hidden" name="payoutId" value={payoutId} />
        <FormStatus state={confirmState} />
        <Button type="submit" disabled={confirmPending}>
          <CheckCircle aria-hidden="true" size={18} />
          {confirmPending ? "Confirming..." : "Confirm external payment"}
        </Button>
      </form>
      <form action={failAction} className="grid gap-3 rounded-lg border border-mist bg-surface p-4">
        <input type="hidden" name="payoutId" value={payoutId} />
        <FormStatus state={failState} />
        <Button type="submit" variant="danger" disabled={failPending}>
          <XCircle aria-hidden="true" size={18} />
          {failPending ? "Saving..." : "Mark failed"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/forms";
import { cancelEggSaleAction } from "@/server/actions/egg-sales";
import { initialActionState } from "@/server/actions/types";

export function CancelEggSaleForm({ publicReference }: { publicReference: string }) {
  const [state, action, pending] = useActionState(cancelEggSaleAction, initialActionState);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="publicReference" value={publicReference} />
      <FormStatus state={state} />
      <Button type="submit" variant="danger" disabled={pending}>
        <XCircle aria-hidden="true" size={18} />
        {pending ? "Cancelling..." : "Cancel and release eggs"}
      </Button>
    </form>
  );
}

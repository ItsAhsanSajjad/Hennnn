"use client";

import { useActionState } from "react";
import { Hand } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/forms";
import { claimEggSaleAction } from "@/server/actions/sale-review";
import { initialActionState } from "@/server/actions/types";

export function ClaimEggSaleForm({ publicReference }: { publicReference: string }) {
  const [state, action, pending] = useActionState(claimEggSaleAction, initialActionState);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="publicReference" value={publicReference} />
      <FormStatus state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        <Hand aria-hidden="true" size={18} />
        {pending ? "Claiming..." : "Claim review"}
      </Button>
    </form>
  );
}

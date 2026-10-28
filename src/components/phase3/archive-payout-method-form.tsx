"use client";

import { useActionState } from "react";
import { Archive } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/forms";
import { archivePayoutMethodAction } from "@/server/actions/payout-methods";
import { initialActionState } from "@/server/actions/types";

export function ArchivePayoutMethodForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(archivePayoutMethodAction, initialActionState);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <FormStatus state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        <Archive aria-hidden="true" size={16} />
        {pending ? "Archiving..." : "Deactivate"}
      </Button>
    </form>
  );
}

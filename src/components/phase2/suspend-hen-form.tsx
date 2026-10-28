"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormStatus, TextInput } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { suspendHenAssetAction } from "@/server/actions/phase2";

export function SuspendHenForm({ henAssetId }: { henAssetId: string }) {
  const [state, action, pending] = useActionState(suspendHenAssetAction, initialActionState);

  return (
    <form action={action} className="flex min-w-80 flex-col gap-2">
      <input type="hidden" name="henAssetId" value={henAssetId} />
      <FormStatus state={state} />
      <TextInput name="reason" placeholder="Suspension reason" required />
      <Button type="submit" variant="danger" disabled={pending}>
        Suspend
      </Button>
    </form>
  );
}

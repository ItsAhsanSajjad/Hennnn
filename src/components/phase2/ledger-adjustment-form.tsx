"use client";

import { useActionState } from "react";
import type { User } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, SelectInput, TextInput } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { createLedgerAdjustmentAction } from "@/server/actions/phase2";

export function LedgerAdjustmentForm({ users }: { users: Pick<User, "id" | "username">[] }) {
  const [state, action, pending] = useActionState(createLedgerAdjustmentAction, initialActionState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-mist bg-surface p-6">
      <FormStatus state={state} />
      <Field label="User" name="userId" error={state.fieldErrors?.userId}>
        <SelectInput id="userId" name="userId" required>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Egg units" name="eggUnits" error={state.fieldErrors?.eggUnits}>
        <TextInput id="eggUnits" name="eggUnits" type="number" required />
      </Field>
      <Field label="Description" name="description" error={state.fieldErrors?.description}>
        <TextInput id="description" name="description" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Recording..." : "Record adjustment"}
      </Button>
    </form>
  );
}

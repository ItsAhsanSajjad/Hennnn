"use client";

import { useActionState } from "react";
import type { ReferralRule } from "@prisma/client";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import { saveReferralRuleAction } from "@/server/actions/referrals";
import { initialActionState } from "@/server/actions/types";

function dateInputValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 16) : "";
}

export function ReferralRuleForm({ rule }: { rule?: ReferralRule }) {
  const [state, action, pending] = useActionState(saveReferralRuleAction, initialActionState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-mist bg-surface p-6">
      {rule ? <input type="hidden" name="id" value={rule.id} /> : null}
      <FormStatus state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Code" name="code" error={state.fieldErrors?.code}>
          <TextInput id="code" name="code" defaultValue={rule?.code ?? "DIRECT-L1-DEMO"} required />
        </Field>
        <Field label="Name" name="name" error={state.fieldErrors?.name}>
          <TextInput
            id="name"
            name="name"
            defaultValue={rule?.name ?? "Direct Level 1 demo reward"}
            required
          />
        </Field>
        <Field
          label="Reward egg units"
          name="rewardEggUnits"
          error={state.fieldErrors?.rewardEggUnits}
        >
          <TextInput
            id="rewardEggUnits"
            name="rewardEggUnits"
            type="number"
            defaultValue={rule?.rewardEggUnits ?? 5}
            required
          />
        </Field>
        <Field label="Effective from" name="effectiveFrom" error={state.fieldErrors?.effectiveFrom}>
          <TextInput
            id="effectiveFrom"
            name="effectiveFrom"
            type="datetime-local"
            defaultValue={dateInputValue(rule?.effectiveFrom) || dateInputValue(new Date())}
            required
          />
        </Field>
        <Field
          label="Effective until"
          name="effectiveUntil"
          error={state.fieldErrors?.effectiveUntil}
        >
          <TextInput
            id="effectiveUntil"
            name="effectiveUntil"
            type="datetime-local"
            defaultValue={dateInputValue(rule?.effectiveUntil)}
          />
        </Field>
      </div>
      <Field label="Notes" name="notes" error={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          defaultValue={
            rule?.notes ?? "Direct Level 1 reward only. Registration alone does not qualify."
          }
          className="min-h-24 rounded-md border border-mist px-3 py-2"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <input type="checkbox" name="isActive" defaultChecked={rule?.isActive ?? true} />
        Active direct reward rule
      </label>
      <Button type="submit" disabled={pending}>
        <Save aria-hidden="true" size={18} />
        {pending ? "Saving..." : "Save rule"}
      </Button>
    </form>
  );
}

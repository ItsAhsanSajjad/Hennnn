"use client";

import { useActionState } from "react";
import type { EggSaleRate } from "@prisma/client";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import { saveEggSaleRateAction } from "@/server/actions/sale-review";
import { initialActionState } from "@/server/actions/types";

function dateInputValue(date?: Date | null) {
  return date ? date.toISOString().slice(0, 16) : "";
}

function formatRupees(paisa?: bigint) {
  if (paisa === undefined) return "20";
  const whole = paisa / 100n;
  const fraction = (paisa % 100n).toString().padStart(2, "0");
  return fraction === "00" ? whole.toString() : `${whole}.${fraction}`;
}

export function EggSaleRateForm({ rate }: { rate?: EggSaleRate }) {
  const [state, action, pending] = useActionState(saveEggSaleRateAction, initialActionState);

  return (
    <form
      action={action}
      className="grid gap-5 rounded-lg border border-mist bg-surface p-6 shadow-sm"
    >
      <input type="hidden" name="code" value={rate?.code ?? "DEMO-EGG-SALE"} />
      <FormStatus state={state} />

      <div>
        <p className="pak-kicker">Rate controls</p>
        <h2 className="mt-2 text-xl font-extrabold text-forest">Publish egg-sale rate</h2>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">
          New requests use this rate after publishing. Existing sale requests keep their recorded
          rate.
        </p>
      </div>

      {rate ? (
        <div className="rounded-md border border-leaf/20 bg-leaf/5 p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-leaf">
            Current active rate
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-forest">
            Rs. {formatRupees(rate.ratePaisaPerEgg)} <span className="text-sm">per egg</span>
          </p>
          <p className="mt-1 text-xs text-charcoal/60">Code: {rate.code}</p>
        </div>
      ) : null}

      <div className="grid gap-4">
        <Field label="Rate name" name="name" error={state.fieldErrors?.name}>
          <TextInput
            id="name"
            name="name"
            defaultValue={rate?.name ?? "Egg purchase rate"}
            required
          />
        </Field>
        <Field
          label="Egg sell rate (Rs. per egg)"
          name="rateRupees"
          hint="Example: 20 means the user receives Rs. 20 for each eligible egg."
          error={state.fieldErrors?.rateRupees}
        >
          <TextInput
            id="rateRupees"
            name="rateRupees"
            type="text"
            inputMode="decimal"
            defaultValue={formatRupees(rate?.ratePaisaPerEgg)}
            required
          />
        </Field>
        <Field label="Effective from" name="effectiveFrom" error={state.fieldErrors?.effectiveFrom}>
          <TextInput
            id="effectiveFrom"
            name="effectiveFrom"
            type="datetime-local"
            defaultValue={dateInputValue(new Date())}
            required
          />
        </Field>
        <Field
          label="Effective until"
          name="effectiveUntil"
          error={state.fieldErrors?.effectiveUntil}
          hint="Leave empty when this rate remains active until replaced."
        >
          <TextInput id="effectiveUntil" name="effectiveUntil" type="datetime-local" />
        </Field>
      </div>

      <Field label="Internal note" name="notes" error={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          defaultValue="Reviewed and published by the operations team."
          className="min-h-24 rounded-md border border-mist px-3 py-2 text-charcoal"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <input type="checkbox" name="isActive" defaultChecked />
        Make this the active egg-sale rate
      </label>
      <Button type="submit" disabled={pending} className="min-h-12">
        <Save aria-hidden="true" size={18} />
        {pending ? "Publishing..." : "Publish active rate"}
      </Button>
    </form>
  );
}

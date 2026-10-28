"use client";

import { useActionState } from "react";
import type { HenPlan } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, SelectInput, TextInput } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { saveHenPlanAction } from "@/server/actions/phase2";

function paisaToRupees(value?: bigint) {
  if (value === undefined) return "";
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, "0");
  return fraction === "00" ? whole.toString() : `${whole}.${fraction}`;
}

export function HenPlanForm({ plan }: { plan?: HenPlan }) {
  const [state, action, pending] = useActionState(saveHenPlanAction, initialActionState);

  return (
    <form action={action} className="grid gap-4 rounded-lg border border-mist bg-surface p-6">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
      <FormStatus state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Code" name="code" error={state.fieldErrors?.code}>
          <TextInput id="code" name="code" defaultValue={plan?.code} required />
        </Field>
        <Field label="Slug" name="slug" error={state.fieldErrors?.slug}>
          <TextInput id="slug" name="slug" defaultValue={plan?.slug} required />
        </Field>
        <Field label="Name" name="name" error={state.fieldErrors?.name}>
          <TextInput id="name" name="name" defaultValue={plan?.name} required />
        </Field>
        <Field
          label="Base price per hen (Rs.)"
          name="priceRupees"
          hint="For example: 750 means Rs. 750 per hen before an active offer or referral discount."
          error={state.fieldErrors?.priceRupees}
        >
          <TextInput
            id="priceRupees"
            name="priceRupees"
            type="text"
            inputMode="decimal"
            defaultValue={paisaToRupees(plan?.pricePaisa)}
            required
          />
        </Field>
        <Field
          label="Daily egg units"
          name="dailyEggUnits"
          error={state.fieldErrors?.dailyEggUnits}
        >
          <TextInput
            id="dailyEggUnits"
            name="dailyEggUnits"
            type="number"
            defaultValue={plan?.dailyEggUnits}
            required
          />
        </Field>
        <Field
          label="Maximum egg units"
          name="maximumEggUnits"
          error={state.fieldErrors?.maximumEggUnits}
        >
          <TextInput
            id="maximumEggUnits"
            name="maximumEggUnits"
            type="number"
            defaultValue={plan?.maximumEggUnits}
            required
          />
        </Field>
        <Field label="Validity days" name="validityDays" error={state.fieldErrors?.validityDays}>
          <TextInput
            id="validityDays"
            name="validityDays"
            type="number"
            defaultValue={plan?.validityDays}
            required
          />
        </Field>
        <Field label="Terms version" name="termsVersion" error={state.fieldErrors?.termsVersion}>
          <TextInput
            id="termsVersion"
            name="termsVersion"
            defaultValue={plan?.termsVersion ?? "phase-2-demo"}
            required
          />
        </Field>
        <Field
          label="Minimum quantity"
          name="minimumQuantity"
          error={state.fieldErrors?.minimumQuantity}
        >
          <TextInput
            id="minimumQuantity"
            name="minimumQuantity"
            type="number"
            defaultValue={plan?.minimumQuantity ?? 1}
            required
          />
        </Field>
        <Field
          label="Maximum quantity"
          name="maximumQuantity"
          error={state.fieldErrors?.maximumQuantity}
        >
          <TextInput
            id="maximumQuantity"
            name="maximumQuantity"
            type="number"
            defaultValue={plan?.maximumQuantity ?? 1}
            required
          />
        </Field>
        <Field label="Status" name="status" error={state.fieldErrors?.status}>
          <SelectInput id="status" name="status" defaultValue={plan?.status ?? "DRAFT"}>
            {["DRAFT", "INACTIVE", "ACTIVE", "ARCHIVED"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Display order" name="displayOrder" error={state.fieldErrors?.displayOrder}>
          <TextInput
            id="displayOrder"
            name="displayOrder"
            type="number"
            defaultValue={plan?.displayOrder ?? 0}
            required
          />
        </Field>
      </div>
      <Field
        label="Short description"
        name="shortDescription"
        error={state.fieldErrors?.shortDescription}
      >
        <TextInput
          id="shortDescription"
          name="shortDescription"
          defaultValue={plan?.shortDescription}
          required
        />
      </Field>
      <Field
        label="Full description"
        name="fullDescription"
        error={state.fieldErrors?.fullDescription}
      >
        <textarea
          id="fullDescription"
          name="fullDescription"
          defaultValue={plan?.fullDescription}
          className="min-h-32 rounded-md border border-mist px-3 py-2"
          required
        />
      </Field>
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-charcoal">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked={plan?.isActive} />
          Published
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFeatured" defaultChecked={plan?.isFeatured} />
          Featured
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save plan"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import type { HenPlan } from "@prisma/client";
import { BadgePercent, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, SelectInput, TextInput } from "@/components/ui/forms";
import { savePlanPromotionAction } from "@/server/actions/phase2";
import { initialActionState } from "@/server/actions/types";
import type { PlanPromotion } from "@/server/services/plan-promotions";

function paisaToRupees(value?: number) {
  if (!value) return "0";
  const whole = Math.floor(value / 100);
  const fraction = String(value % 100).padStart(2, "0");
  return fraction === "00" ? String(whole) : `${whole}.${fraction}`;
}

export function PlanPromotionForm({
  plans,
  promotions,
}: {
  plans: HenPlan[];
  promotions: PlanPromotion[];
}) {
  const [state, action, pending] = useActionState(savePlanPromotionAction, initialActionState);
  const defaultPlan = plans[0];
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlan?.id ?? "");
  const existing = promotions.find((promotion) => promotion.planId === selectedPlanId);

  if (!defaultPlan) return null;

  return (
    <form
      action={action}
      className="grid gap-5 rounded-lg border border-mist bg-surface p-6 shadow-sm"
    >
      <FormStatus state={state} />
      <div>
        <p className="pak-kicker">Campaign controls</p>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-extrabold text-forest">
          <BadgePercent aria-hidden="true" size={20} /> Publish plan offer
        </h2>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">
          The customer catalogue and new order totals update from this setting. Historical orders
          keep the price recorded when they were created.
        </p>
      </div>
      <Field label="Plan" name="planId" error={state.fieldErrors?.planId}>
        <SelectInput
          id="planId"
          name="planId"
          value={selectedPlanId}
          onChange={(event) => setSelectedPlanId(event.target.value)}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({plan.code})
            </option>
          ))}
        </SelectInput>
      </Field>
      <div key={selectedPlanId} className="grid gap-5">
        <Field label="Offer label" name="label" error={state.fieldErrors?.label}>
          <TextInput
            id="label"
            name="label"
            defaultValue={existing?.label ?? "Limited-time offer"}
            placeholder="For example: Eid savings"
            required
          />
        </Field>
        <Field
          label="Discount (Rs. per hen)"
          name="discountRupeesPerHen"
          hint="This is applied only on new orders, after server-side validation."
          error={state.fieldErrors?.discountRupeesPerHen}
        >
          <TextInput
            id="discountRupeesPerHen"
            name="discountRupeesPerHen"
            defaultValue={paisaToRupees(existing?.discountPaisaPerHen)}
            inputMode="decimal"
            required
          />
        </Field>
        <Field label="Customer message" name="description" error={state.fieldErrors?.description}>
          <textarea
            id="description"
            name="description"
            defaultValue={existing?.description ?? "A published offer for new customer orders."}
            className="min-h-24 rounded-md border border-mist px-3 py-2 text-charcoal"
            required
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <input type="checkbox" name="isActive" defaultChecked={existing?.isActive ?? true} />
          Show and apply this offer now
        </label>
      </div>
      <Button type="submit" disabled={pending} className="min-h-12">
        <Save aria-hidden="true" size={18} />
        {pending ? "Publishing..." : "Publish offer"}
      </Button>
    </form>
  );
}

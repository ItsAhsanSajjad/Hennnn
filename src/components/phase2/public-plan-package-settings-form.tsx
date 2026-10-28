"use client";

import { useActionState } from "react";
import type { HenPlan } from "@prisma/client";
import { LayoutTemplate, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import { savePublicPlanPackageSettingsAction } from "@/server/actions/phase2";
import { initialActionState } from "@/server/actions/types";
import type { PublicPlanPackageSetting } from "@/server/services/public-plan-package-settings";

function paisaToRupees(value: bigint) {
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, "0");
  return fraction === "00" ? whole.toString() : `${whole}.${fraction}`;
}

export function PublicPlanPackageSettingsForm({
  plan,
  cards,
}: {
  plan?: HenPlan;
  cards: PublicPlanPackageSetting[];
}) {
  const [state, action, pending] = useActionState(
    savePublicPlanPackageSettingsAction,
    initialActionState,
  );
  const card = (key: PublicPlanPackageSetting["key"]) => cards.find((item) => item.key === key);
  const starter = card("starter");
  const recommended = card("recommended");
  const premium = card("premium");

  if (!plan || !starter || !recommended || !premium) return null;

  return (
    <form
      action={action}
      className="grid gap-5 rounded-lg border border-mist bg-surface p-6 shadow-sm"
    >
      <input type="hidden" name="planId" value={plan.id} />
      <FormStatus state={state} />
      <div>
        <p className="pak-kicker">Customer package cards</p>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-extrabold text-forest">
          <LayoutTemplate aria-hidden="true" size={20} /> Edit the 3 plan cards
        </h2>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">
          This controls the Starter, Recommended and Premium cards on the homepage and plan page.
          Card totals are always calculated from the base price below.
        </p>
      </div>
      <Field
        label="Base price per hen (Rs.)"
        name="priceRupees"
        hint="Changing this amount immediately updates all three displayed package totals and new order pricing."
        error={state.fieldErrors?.priceRupees}
      >
        <TextInput
          id="priceRupees"
          name="priceRupees"
          inputMode="decimal"
          defaultValue={paisaToRupees(plan.pricePaisa)}
          required
        />
      </Field>
      <div className="grid gap-4">
        {[
          { label: "Starter card", key: "starter" as const, setting: starter },
          { label: "Recommended card", key: "recommended" as const, setting: recommended },
          { label: "Premium card", key: "premium" as const, setting: premium },
        ].map(({ label, key: safeKey, setting }) => {
          return (
            <fieldset
              key={safeKey}
              className="grid gap-3 rounded-md border border-mist bg-ivory/50 p-4"
            >
              <legend className="px-1 text-sm font-extrabold text-forest">{label}</legend>
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <Field
                  label="Card title"
                  name={`${safeKey}Name`}
                  error={state.fieldErrors?.[`${safeKey}Name`]}
                >
                  <TextInput
                    id={`${safeKey}Name`}
                    name={`${safeKey}Name`}
                    defaultValue={setting.name}
                    required
                  />
                </Field>
                <Field
                  label="Hens"
                  name={`${safeKey}Hens`}
                  error={state.fieldErrors?.[`${safeKey}Hens`]}
                >
                  <TextInput
                    id={`${safeKey}Hens`}
                    name={`${safeKey}Hens`}
                    type="number"
                    min="1"
                    defaultValue={setting.hens}
                    required
                  />
                </Field>
              </div>
              <Field
                label="Customer message"
                name={`${safeKey}Audience`}
                error={state.fieldErrors?.[`${safeKey}Audience`]}
              >
                <TextInput
                  id={`${safeKey}Audience`}
                  name={`${safeKey}Audience`}
                  defaultValue={setting.audience}
                  required
                />
              </Field>
            </fieldset>
          );
        })}
      </div>
      <Button type="submit" disabled={pending} className="min-h-12">
        <Save aria-hidden="true" size={18} />
        {pending ? "Updating cards..." : "Save package cards and amount"}
      </Button>
    </form>
  );
}

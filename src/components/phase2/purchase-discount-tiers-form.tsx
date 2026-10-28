"use client";

import { useActionState } from "react";
import { BadgePercent, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import { savePurchaseDiscountTiersAction } from "@/server/actions/phase2";
import { initialActionState } from "@/server/actions/types";
import type { PurchaseDiscountTier } from "@/server/services/purchase-discount-tiers";

export function PurchaseDiscountTiersForm({ tiers }: { tiers: PurchaseDiscountTier[] }) {
  const [state, action, pending] = useActionState(
    savePurchaseDiscountTiersAction,
    initialActionState,
  );
  const [tierOne, tierTwo, tierThree] = tiers;
  if (!tierOne || !tierTwo || !tierThree) return null;

  const fields = [
    {
      title: "Tier 1",
      description: "First bulk-purchase discount",
      prefix: "tierOne",
      tier: tierOne,
      hasMaximum: true,
    },
    {
      title: "Tier 2",
      description: "Higher quantity discount",
      prefix: "tierTwo",
      tier: tierTwo,
      hasMaximum: true,
    },
    {
      title: "Tier 3",
      description: "Discount continues for every quantity above this threshold",
      prefix: "tierThree",
      tier: tierThree,
      hasMaximum: false,
    },
  ] as const;

  return (
    <form
      action={action}
      className="grid gap-5 rounded-lg border border-mist bg-surface p-6 shadow-sm"
    >
      <FormStatus state={state} />
      <div>
        <p className="pak-kicker">Custom quantity pricing</p>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-extrabold text-forest">
          <BadgePercent aria-hidden="true" size={20} /> Bulk-purchase discounts
        </h2>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">
          These tiers apply to every new customer order. The server recalculates the discount from
          the selected quantity, so a browser cannot change the payable amount.
        </p>
      </div>
      <div className="grid gap-4">
        {fields.map(({ title, description, prefix, tier, hasMaximum }) => (
          <fieldset
            key={prefix}
            className="grid gap-3 rounded-md border border-mist bg-ivory/50 p-4"
          >
            <legend className="px-1 text-sm font-extrabold text-forest">{title}</legend>
            <p className="text-xs text-charcoal/60">{description}</p>
            <div className={`grid gap-3 ${hasMaximum ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              <Field
                label="From hens"
                name={`${prefix}MinimumQuantity`}
                error={state.fieldErrors?.[`${prefix}MinimumQuantity`]}
              >
                <TextInput
                  id={`${prefix}MinimumQuantity`}
                  name={`${prefix}MinimumQuantity`}
                  type="number"
                  min="1"
                  defaultValue={tier.minimumQuantity}
                  required
                />
              </Field>
              {hasMaximum ? (
                <Field
                  label="To hens"
                  name={`${prefix}MaximumQuantity`}
                  error={state.fieldErrors?.[`${prefix}MaximumQuantity`]}
                >
                  <TextInput
                    id={`${prefix}MaximumQuantity`}
                    name={`${prefix}MaximumQuantity`}
                    type="number"
                    min="1"
                    defaultValue={tier.maximumQuantity ?? ""}
                    required
                  />
                </Field>
              ) : null}
              <Field
                label="Discount (%)"
                name={`${prefix}DiscountPercent`}
                error={state.fieldErrors?.[`${prefix}DiscountPercent`]}
              >
                <TextInput
                  id={`${prefix}DiscountPercent`}
                  name={`${prefix}DiscountPercent`}
                  type="number"
                  min="0"
                  max="90"
                  defaultValue={tier.discountPercent}
                  required
                />
              </Field>
            </div>
          </fieldset>
        ))}
      </div>
      <Button type="submit" disabled={pending} className="min-h-12">
        <Save aria-hidden="true" size={18} />
        {pending ? "Saving tiers..." : "Save quantity discounts"}
      </Button>
    </form>
  );
}

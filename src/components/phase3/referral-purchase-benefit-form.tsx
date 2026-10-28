"use client";

import { useActionState } from "react";
import { Save, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { saveReferralPurchaseBenefitAction } from "@/server/actions/referrals";
import type { ReferralPurchaseBenefitConfig } from "@/server/services/referral-purchase-benefit";

function formatRupees(paisa: number) {
  const whole = Math.floor(paisa / 100);
  const fractional = String(paisa % 100).padStart(2, "0");
  return fractional === "00" ? String(whole) : `${whole}.${fractional}`;
}

export function ReferralPurchaseBenefitForm({ config }: { config: ReferralPurchaseBenefitConfig }) {
  const [state, action, pending] = useActionState(
    saveReferralPurchaseBenefitAction,
    initialActionState,
  );

  return (
    <form
      action={action}
      className="grid gap-5 rounded-lg border border-mist bg-surface p-6 shadow-sm"
    >
      <FormStatus state={state} />
      <div>
        <p className="pak-kicker">Direct referral campaign</p>
        <h2 className="mt-2 text-xl font-extrabold text-forest">Purchase benefit settings</h2>
        <p className="mt-2 text-sm leading-6 text-charcoal/70">
          The buyer discount is applied by the server. Inviter hens activate only after the referred
          customer&apos;s qualifying order is approved.
        </p>
      </div>

      <div className="rounded-md border border-leaf/20 bg-leaf/5 p-4 text-sm leading-6 text-charcoal/75">
        <div className="flex gap-3">
          <UsersRound aria-hidden="true" className="mt-0.5 shrink-0 text-leaf" size={19} />
          <p>
            One direct referral only. There are no registration-only, multi-level, or repeated
            benefits for the same qualifying purchase.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Field
          label="Qualifying purchase (hens)"
          name="qualifyingHenQuantity"
          hint="The referred customer must purchase at least this many hens in one approved order."
          error={state.fieldErrors?.qualifyingHenQuantity}
        >
          <TextInput
            id="qualifyingHenQuantity"
            name="qualifyingHenQuantity"
            type="number"
            min="1"
            defaultValue={config.qualifyingHenQuantity}
            required
          />
        </Field>
        <Field
          label="Inviter commission (% of hens)"
          name="inviterHenRewardPercent"
          hint="Percentage of the referred customer's purchased hens that the inviter earns as hens (rounded down). Example: 20% of 10 hens = 2 hens."
          error={state.fieldErrors?.inviterHenRewardPercent}
        >
          <TextInput
            id="inviterHenRewardPercent"
            name="inviterHenRewardPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={config.inviterHenRewardPercent}
            required
          />
        </Field>
        <Field
          label="Referred customer discount (Rs. per hen)"
          name="inviteeDiscountRupeesPerHen"
          hint="Applied to each hen in a new order made by a customer who registered through a valid link."
          error={state.fieldErrors?.inviteeDiscountRupeesPerHen}
        >
          <TextInput
            id="inviteeDiscountRupeesPerHen"
            name="inviteeDiscountRupeesPerHen"
            inputMode="decimal"
            defaultValue={formatRupees(config.inviteeDiscountPaisaPerHen)}
            required
          />
        </Field>
      </div>

      <Field label="Internal campaign note" name="notes" error={state.fieldErrors?.notes}>
        <textarea
          id="notes"
          name="notes"
          defaultValue={config.notes}
          className="min-h-24 rounded-md border border-mist px-3 py-2 text-charcoal"
          required
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <input type="checkbox" name="isActive" defaultChecked={config.isActive} />
        Enable this direct referral campaign
      </label>
      <Button type="submit" disabled={pending} className="min-h-12">
        <Save aria-hidden="true" size={18} />
        {pending ? "Saving..." : "Save campaign"}
      </Button>
    </form>
  );
}

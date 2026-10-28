"use client";

import { useActionState } from "react";
import { CreditCard, Save, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { updatePaymentMethodsAction } from "@/server/actions/admin";
import type { PaymentMethodSettings } from "@/server/services/payment-methods";

export function PaymentMethodsForm({
  settings,
  paybostConfigured,
}: {
  settings: PaymentMethodSettings;
  paybostConfigured: boolean;
}) {
  const [state, action, pending] = useActionState(updatePaymentMethodsAction, initialActionState);

  return (
    <form action={action} className="grid gap-5">
      <FormStatus state={state} />

      <label className="flex items-start gap-3 rounded-md border border-mist bg-ivory p-4">
        <input
          type="checkbox"
          name="manualPaymentEnabled"
          defaultChecked={settings.manualPaymentEnabled}
          className="mt-1"
        />
        <span>
          <span className="flex items-center gap-2 text-sm font-extrabold text-forest">
            <CreditCard aria-hidden="true" size={16} /> Manual bank transfer
          </span>
          <span className="mt-1 block text-sm leading-6 text-charcoal/70">
            Customers upload a bank-transfer screenshot and an administrator approves it.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-md border border-mist bg-ivory p-4">
        <input
          type="checkbox"
          name="paybostEnabled"
          defaultChecked={settings.paybostEnabled}
          disabled={!paybostConfigured}
          className="mt-1"
        />
        <span>
          <span className="flex items-center gap-2 text-sm font-extrabold text-forest">
            <Zap aria-hidden="true" size={16} /> Online payment (Paybost)
          </span>
          <span className="mt-1 block text-sm leading-6 text-charcoal/70">
            Customers pay through the gateway and orders auto-approve via webhook — no admin, no
            screenshot.
          </span>
          {!paybostConfigured ? (
            <span className="mt-2 block text-xs font-bold text-danger">
              Set PAYBOST_PUBLIC_KEY and PAYBOST_SECRET_KEY in the environment to enable this.
            </span>
          ) : null}
        </span>
      </label>

      <p className="text-xs leading-5 text-charcoal/60">
        At least one method must stay enabled. When both are on, customers see the instant online
        option first with bank transfer as a fallback.
      </p>

      <Button type="submit" disabled={pending} className="min-h-12">
        <Save aria-hidden="true" size={18} />
        {pending ? "Saving..." : "Save payment methods"}
      </Button>
    </form>
  );
}

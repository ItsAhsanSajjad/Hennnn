"use client";

import { useActionState } from "react";
import type { PaymentAccount } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, SelectInput, TextInput } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { savePaymentAccountAction } from "@/server/actions/phase2";

export function PaymentAccountForm({ account }: { account?: PaymentAccount }) {
  const [state, action, pending] = useActionState(savePaymentAccountAction, initialActionState);

  return (
    <form action={action} className="grid gap-4">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <FormStatus state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Provider" name="provider" error={state.fieldErrors?.provider}>
          <SelectInput
            id="provider"
            name="provider"
            defaultValue={account?.provider ?? "JAZZCASH"}
          >
            {[
              { id: "JAZZCASH", label: "JazzCash (Mobile Wallet)" },
              { id: "EASYPAISA", label: "Easypaisa (Mobile Wallet)" },
              { id: "BANK_TRANSFER", label: "Bank Transfer (Direct Bank)" },
              { id: "OTHER", label: "Other Method" },
            ].map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Account Title" name="accountTitle" error={state.fieldErrors?.accountTitle}>
          <TextInput
            id="accountTitle"
            name="accountTitle"
            defaultValue={account?.accountTitle}
            placeholder="e.g. GrowMeta Egg Official JazzCash"
            required
          />
        </Field>
        <Field
          label="Account / Phone Number (Protected / Display)"
          name="accountIdentifierProtected"
          error={state.fieldErrors?.accountIdentifierProtected}
        >
          <TextInput
            id="accountIdentifierProtected"
            name="accountIdentifierProtected"
            defaultValue={account?.accountIdentifierProtected}
            placeholder="e.g. 0300-1234567 or PK00MEZN..."
            required
          />
        </Field>
        <Field
          label="Last Four Digits"
          name="accountIdentifierLastFour"
          error={state.fieldErrors?.accountIdentifierLastFour}
        >
          <TextInput
            id="accountIdentifierLastFour"
            name="accountIdentifierLastFour"
            defaultValue={account?.accountIdentifierLastFour}
            placeholder="e.g. 4567"
            required
          />
        </Field>
        <Field
          label="Bank / Network Name (Optional)"
          name="bankName"
          error={state.fieldErrors?.bankName}
        >
          <TextInput
            id="bankName"
            name="bankName"
            defaultValue={account?.bankName ?? ""}
            placeholder="e.g. Mobilink Microfinance Bank / Meezan Bank"
          />
        </Field>
        <Field label="IBAN (Optional)" name="iban" error={state.fieldErrors?.iban}>
          <TextInput
            id="iban"
            name="iban"
            defaultValue={account?.iban ?? ""}
            placeholder="e.g. PK00MEZN0000000000000000"
          />
        </Field>
        <Field label="Display Order" name="displayOrder" error={state.fieldErrors?.displayOrder}>
          <TextInput
            id="displayOrder"
            name="displayOrder"
            type="number"
            defaultValue={account?.displayOrder ?? 10}
            required
          />
        </Field>
      </div>
      <Field label="Instructions for Customer" name="instructions" error={state.fieldErrors?.instructions}>
        <textarea
          id="instructions"
          name="instructions"
          defaultValue={account?.instructions}
          placeholder="Detailed deposit steps shown to users on checkout..."
          className="min-h-24 w-full rounded-md border border-line bg-[#0e1512] px-3 py-2 text-sm text-content shadow-sm transition-colors placeholder:text-faint focus:border-leaf focus:outline-none"
          required
        />
      </Field>
      <div className="flex flex-wrap items-center gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={account ? account.isActive : true}
            className="size-4 rounded accent-emerald-600"
          />
          <span>Active for payment submissions</span>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-charcoal cursor-pointer">
          <input
            type="checkbox"
            name="isVerified"
            defaultChecked={account ? account.isVerified : true}
            className="size-4 rounded accent-emerald-600"
          />
          <span>Display &quot;Verified Official&quot; badge</span>
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save payment account"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Check, Search, Save, ShieldCheck } from "lucide-react";
import type { PayoutMethod, PayoutMethodProvider } from "@prisma/client";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Field, FormStatus, TextInput } from "@/components/ui/forms";
import { PayoutProviderMark, payoutProviderLabels } from "@/components/phase3/payout-provider-mark";
import { bankLogoPath, pakistaniBanks } from "@/config/pakistani-banks";
import { cn } from "@/lib/utilities/cn";
import { savePayoutMethodAction } from "@/server/actions/payout-methods";
import { initialActionState } from "@/server/actions/types";

const standardProviderOptions: readonly PayoutMethodProvider[] = [
  "EASYPAISA",
  "JAZZCASH",
  "BANK_TRANSFER",
];

export function PayoutMethodForm({
  method,
  embedded = false,
}: {
  method?: PayoutMethod;
  embedded?: boolean;
}) {
  const [state, action, pending] = useActionState(savePayoutMethodAction, initialActionState);
  const [provider, setProvider] = useState<PayoutMethodProvider>(method?.provider ?? "EASYPAISA");
  const [bankName, setBankName] = useState(method?.bankName ?? "");
  const [bankSearch, setBankSearch] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(!method?.bankName);
  const providerOptions: readonly PayoutMethodProvider[] =
    method?.provider === "OTHER" ? [...standardProviderOptions, "OTHER"] : standardProviderOptions;
  const isWallet = provider === "EASYPAISA" || provider === "JAZZCASH";
  const availableBanks = pakistaniBanks.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearch.trim().toLowerCase()),
  );

  return (
    <form
      action={action}
      className={embedded ? "grid gap-5" : "grid gap-5"}
    >
      {method ? <input type="hidden" name="id" value={method.id} /> : null}
      <div>
        <h2 className="text-xl font-black text-[#17372F]">
          {method ? "Update Payout Account" : "Add Payout Account"}
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-semibold leading-relaxed text-[#566D7E]">
          Choose where you want to receive egg-sale payments. Details are reviewed before a
          settlement is sent.
        </p>
      </div>
      <FormStatus state={state} />
      <input type="hidden" name="provider" value={provider} />
      {provider === "BANK_TRANSFER" ? (
        <input type="hidden" name="bankName" value={bankName} />
      ) : null}
      <fieldset>
        <legend className="text-xs font-black uppercase tracking-wider text-[#8C3A14]">
          Choose payment method
        </legend>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
          {providerOptions.map((option) => {
            const selected = option === provider;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setProvider(option)}
                className={`flex min-h-20 items-center gap-2.5 rounded-2xl border p-3 text-left transition-all focus-visible:outline-offset-2 sm:flex-col sm:justify-center sm:text-center ${
                  selected
                    ? "border-[#D8793F] bg-[#FFF8EC] text-[#8C3A14] shadow-sm ring-1 ring-[#D8793F]"
                    : "border-[#D8793F]/20 bg-white text-[#17372F] hover:border-[#D8793F]/40 hover:bg-[#FFF8EC]/50"
                }`}
              >
                <PayoutProviderMark provider={option} selected={selected} />
                <span className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-black ${
                      selected ? "text-[#8C3A14]" : "text-[#17372F]"
                    }`}
                  >
                    {payoutProviderLabels[option]}
                  </span>
                  {selected ? <Check aria-hidden="true" size={14} className="text-[#8C3A14]" /> : null}
                </span>
              </button>
            );
          })}
        </div>
        {state.fieldErrors?.provider?.length ? (
          <p className="mt-2 text-xs font-bold text-rose-600" role="alert">
            {state.fieldErrors.provider[0]}
          </p>
        ) : null}
      </fieldset>
      {provider === "BANK_TRANSFER" ? (
        <div className="grid gap-2">
          <label htmlFor="bank-search" className="text-sm font-bold text-charcoal">
            Select your bank
          </label>
          {bankName && !bankPickerOpen ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-forest bg-[var(--surface-dark)] px-3 py-3 text-white shadow-sm">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-normal text-white/75">
                  Selected bank
                </p>
                <p className="truncate text-sm font-extrabold text-white">{bankName}</p>
              </div>
              <button
                type="button"
                onClick={() => setBankPickerOpen(true)}
                className="shrink-0 rounded-md border border-white/30 px-3 py-1.5 text-sm font-bold text-white"
              >
                Change bank
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
              <div className="border-b border-mist p-3">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/45"
                    size={18}
                  />
                  <TextInput
                    id="bank-search"
                    value={bankSearch}
                    onChange={(event) => setBankSearch(event.target.value)}
                    className="pl-10"
                    placeholder="Search Pakistani banks"
                  />
                </div>
              </div>
              <div
                className="max-h-64 overflow-y-auto p-2"
                role="listbox"
                aria-label="Pakistani banks"
              >
                {availableBanks.length ? (
                  availableBanks.map((bank) => {
                    const selected = bank.name === bankName;
                    return (
                      <button
                        key={bank.name}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          setBankName(bank.name);
                          setBankPickerOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                          selected
                            ? "border-forest bg-[var(--surface-dark)] shadow-sm"
                            : "border-transparent hover:border-mist hover:bg-ivory/70",
                        )}
                        style={selected ? { backgroundColor: "#0f5c4e" } : undefined}
                      >
                        <span
                          className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-mist bg-surface"
                          aria-hidden="true"
                        >
                          <Image
                            src={bankLogoPath(bank.domain)}
                            alt=""
                            width={28}
                            height={28}
                            className="size-7 object-contain"
                          />
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm font-semibold",
                            selected ? "text-white" : "text-charcoal",
                          )}
                          style={selected ? { color: "#ffffff" } : undefined}
                        >
                          {bank.name}
                        </span>
                        {selected ? (
                          <Check
                            aria-hidden="true"
                            className="text-white"
                            style={{ color: "#ffffff" }}
                            size={18}
                          />
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-5 text-sm text-charcoal/65">No matching bank found.</p>
                )}
              </div>
            </div>
          )}
          {!bankName ? (
            <p className="text-sm text-charcoal/65">Choose the bank linked to this account.</p>
          ) : null}
          {state.fieldErrors?.bankName?.length ? (
            <p className="text-sm font-medium text-danger" role="alert">
              {state.fieldErrors.bankName[0]}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Account title" name="accountTitle" error={state.fieldErrors?.accountTitle}>
          <TextInput
            id="accountTitle"
            name="accountTitle"
            defaultValue={method?.accountTitle}
            placeholder="Name shown on the account"
            required
          />
        </Field>
        <Field
          label={isWallet ? "Mobile wallet number" : "Account number or IBAN"}
          name="accountIdentifier"
          error={state.fieldErrors?.accountIdentifier}
        >
          <TextInput
            id="accountIdentifier"
            name="accountIdentifier"
            inputMode={isWallet ? "numeric" : "text"}
            placeholder={isWallet ? "03XX XXXXXXX" : "Enter account number or IBAN"}
            required
          />
        </Field>
      </div>
      <div className="flex items-start gap-2 rounded-md bg-ivory px-3 py-2 text-xs leading-5 text-charcoal/70">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-leaf" size={16} />
        Account identifiers are encrypted and only shown as masked details in normal account views.
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <input type="checkbox" name="isDefault" defaultChecked={method?.isDefault ?? true} />
        Default payout method
      </label>
      <Button type="submit" disabled={pending}>
        <Save aria-hidden="true" size={18} />
        {pending ? "Saving..." : "Save payout method"}
      </Button>
    </form>
  );
}

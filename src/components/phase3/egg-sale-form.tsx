"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/forms";
import { initialActionState } from "@/server/actions/types";
import { submitEggSaleAction } from "@/server/actions/egg-sales";

type SalePayoutMethod = {
  id: string;
  provider: string;
  accountTitle: string;
  accountIdentifierMasked: string;
  accountIdentifierLastFour: string;
  isDefault: boolean;
};

function formatPaisaPreview(value: bigint) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(Number(value) / 100);
}

export function EggSaleForm({
  availableEggs,
  ratePaisaPerEgg,
  payoutMethods,
}: {
  availableEggs: number;
  ratePaisaPerEgg: string;
  payoutMethods: SalePayoutMethod[];
}) {
  const [state, action, pending] = useActionState(submitEggSaleAction, initialActionState);
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState(Math.min(10, availableEggs));
  const [payoutMethodId, setPayoutMethodId] = useState(
    payoutMethods.find((method) => method.isDefault)?.id ?? payoutMethods[0]?.id ?? "",
  );
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const rate = BigInt(ratePaisaPerEgg);
  const safeQuantity = Number.isFinite(quantity)
    ? Math.min(Math.max(0, Math.floor(quantity)), availableEggs)
    : 0;
  const total = BigInt(safeQuantity) * rate;
  const selectedMethod = payoutMethods.find((method) => method.id === payoutMethodId);
  const canContinueQuantity = safeQuantity > 0 && safeQuantity <= availableEggs;
  const canContinuePayout = Boolean(selectedMethod);
  const quickQuantities = [10, 25, 50, availableEggs].filter(
    (value, index, values) =>
      value > 0 && value <= availableEggs && values.indexOf(value) === index,
  );

  return (
    <form
      action={action}
      style={{
        boxShadow: "0 14px 32px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
      }}
      className="grid gap-6 rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-7 shadow-sm"
    >
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="eggQuantity" value={safeQuantity} />
      <input type="hidden" name="payoutMethodId" value={payoutMethodId} />

      {/* Stepper Tabs */}
      <ol className="grid gap-3 sm:grid-cols-3" aria-label="Sell eggs progress">
        {(
          [
            [1, "Quantity"],
            [2, "Payment Account"],
            [3, "Review Request"],
          ] as const
        ).map(([itemStep, label]) => {
          const active = step === itemStep;
          const complete = step > itemStep;
          return (
            <li
              key={itemStep}
              className={`flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 text-xs sm:text-sm font-black transition-all ${
                active
                  ? "border-[#D8793F] bg-gradient-to-r from-[#F59B52] to-[#D8793F] text-white shadow-sm"
                  : complete
                    ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
                    : "border-[#D8793F]/20 bg-[#FFF8EC] text-[#566D7E]"
              }`}
            >
              <span
                className={`grid size-7 place-items-center rounded-xl text-xs font-black ${
                  active
                    ? "bg-white text-[#8C3A14] shadow-xs"
                    : complete
                      ? "bg-emerald-600 text-white"
                      : "bg-white/80 text-[#566D7E]"
                }`}
              >
                {complete ? <CheckCircle2 aria-hidden="true" size={16} /> : itemStep}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      <FormStatus state={state} />

      {step === 1 ? (
        <section className="grid gap-5" aria-labelledby="egg-sale-quantity-heading">
          <div>
            <p className="pak-kicker">Step 1 of 3</p>
            <h2 id="egg-sale-quantity-heading" className="mt-2 text-2xl font-extrabold text-forest">
              Choose eggs to sell
            </h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/70">
              You have <strong className="text-charcoal">{availableEggs} available eggs</strong>.
              The final amount is always recalculated securely by GrowMeta Egg.
            </p>
          </div>
          <label className="grid gap-2" htmlFor="eggQuantity">
            <span className="text-sm font-bold text-charcoal">Egg quantity</span>
            <input
              id="eggQuantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={availableEggs}
              step={1}
              value={quantity || ""}
              onChange={(event) => {
                const next = Number(event.target.value);
                setQuantity(Number.isFinite(next) ? next : 0);
              }}
              className="min-h-12 rounded-md border border-mist px-3 text-lg font-bold text-charcoal outline-none focus:border-leaf"
              required
            />
          </label>
          <div className="flex flex-wrap gap-2" aria-label="Quick egg quantities">
            {quickQuantities.map((value) => (
              <button
                key={value}
                type="button"
                className={`min-h-11 cursor-pointer rounded-md border px-4 text-sm font-bold transition-colors ${
                  safeQuantity === value
                    ? "border-forest bg-[var(--surface-dark)] text-white"
                    : "border-mist bg-ivory text-forest hover:bg-mist"
                }`}
                onClick={() => setQuantity(value)}
              >
                {value === availableEggs ? "Max" : value}
              </button>
            ))}
          </div>
          <div className="rounded-md border border-leaf/25 bg-emerald-50 p-4" aria-live="polite">
            <div className="flex items-center gap-2 text-forest">
              <Calculator aria-hidden="true" size={18} />
              <p className="text-sm font-bold">Estimated request value</p>
            </div>
            <p className="mt-2 text-lg font-extrabold text-charcoal">
              {safeQuantity} eggs x {formatPaisaPreview(rate)} = {formatPaisaPreview(total)}
            </p>
            <p className="mt-1 text-xs leading-5 text-charcoal/65">
              This is an estimate from the current trusted rate. GrowMeta Egg confirms the calculation
              when you submit.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="button" disabled={!canContinueQuantity} onClick={() => setStep(2)}>
              Continue
              <ChevronRight aria-hidden="true" size={17} />
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-5" aria-labelledby="egg-sale-payout-heading">
          <div>
            <p className="pak-kicker">Step 2 of 3</p>
            <h2 id="egg-sale-payout-heading" className="mt-2 text-2xl font-extrabold text-forest">
              Select a payment account
            </h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/70">
              Choose the account GrowMeta Egg should use if this request is settled. Sensitive identifiers
              remain masked in routine views.
            </p>
          </div>
          <div className="grid gap-3">
            {payoutMethods.map((method) => {
              const selected = method.id === payoutMethodId;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPayoutMethodId(method.id)}
                  className={`grid min-h-20 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border p-4 text-left transition-colors ${
                    selected ? "border-leaf bg-emerald-50" : "border-mist bg-surface hover:bg-ivory"
                  }`}
                  aria-pressed={selected}
                >
                  <CreditCard aria-hidden="true" className="text-leaf" size={22} />
                  <span>
                    <span className="block text-sm font-extrabold text-charcoal">
                      {method.accountTitle}
                    </span>
                    <span className="mt-1 block text-sm text-charcoal/65">
                      {method.provider} {method.accountIdentifierMasked}
                    </span>
                  </span>
                  {method.isDefault ? (
                    <span className="rounded-full bg-[var(--surface-dark)] px-2 py-1 text-xs font-bold text-white">
                      Default
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <Link
            className="text-sm font-bold text-forest underline"
            href="/dashboard/payout-methods"
          >
            Add or manage payment accounts
          </Link>
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              <ChevronLeft aria-hidden="true" size={17} />
              Back
            </Button>
            <Button type="button" disabled={!canContinuePayout} onClick={() => setStep(3)}>
              Review request
              <ChevronRight aria-hidden="true" size={17} />
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-5" aria-labelledby="egg-sale-review-heading">
          <div>
            <p className="pak-kicker">Step 3 of 3</p>
            <h2 id="egg-sale-review-heading" className="mt-2 text-2xl font-extrabold text-forest">
              Review your sale request
            </h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/70">
              After submission, your eggs will be reserved while the GrowMeta Egg team reviews and
              processes your payment.
            </p>
          </div>
          <dl className="grid gap-3 rounded-md border border-mist bg-ivory p-4 sm:grid-cols-2">
            {[
              ["Egg quantity", `${safeQuantity} eggs`],
              ["Buyback rate", `${formatPaisaPreview(rate)} per egg`],
              ["Estimated payable", formatPaisaPreview(total)],
              [
                "Payment account",
                selectedMethod
                  ? `${selectedMethod.provider} ${selectedMethod.accountIdentifierMasked}`
                  : "Choose an account",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-bold text-charcoal">{value}</dd>
              </div>
            ))}
          </dl>
          <label className="flex items-start gap-3 rounded-md border border-mist p-4 text-sm leading-6 text-charcoal">
            <input className="mt-1" type="checkbox" name="termsAccepted" required />
            <span>
              I understand that this request is reviewed before payment, and that the server-held
              rate and available egg balance will be checked again before it is accepted.
            </span>
          </label>
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={pending}>
              <ChevronLeft aria-hidden="true" size={17} />
              Back
            </Button>
            <Button type="submit" disabled={pending || !canContinueQuantity || !canContinuePayout}>
              <Send aria-hidden="true" size={18} />
              {pending ? "Submitting request..." : "Submit egg sale"}
            </Button>
          </div>
        </section>
      ) : null}
    </form>
  );
}

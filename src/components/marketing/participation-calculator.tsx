"use client";

import { useMemo, useState } from "react";
import { Calculator, Minus, Plus } from "lucide-react";

function formatPkr(value: number) {
  return `Rs ${value.toLocaleString("en-PK")}`;
}

export function ParticipationCalculator({
  planName,
  unitPricePaisa,
  dailyEggUnits,
  maximumEggUnits,
  validityDays,
  ratePaisaPerEgg,
}: {
  planName: string;
  unitPricePaisa: string;
  dailyEggUnits: number;
  maximumEggUnits: number;
  validityDays: number;
  ratePaisaPerEgg: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const unitPrice = Number(unitPricePaisa) / 100;
  const ratePerEgg = Number(ratePaisaPerEgg) / 100;
  const summary = useMemo(
    () => ({
      cost: unitPrice * quantity,
      dailyEggs: dailyEggUnits * quantity,
      totalEggs: maximumEggUnits * quantity,
      illustrationValue: maximumEggUnits * quantity * ratePerEgg,
    }),
    [dailyEggUnits, maximumEggUnits, quantity, ratePerEgg, unitPrice],
  );

  function changeQuantity(nextValue: number) {
    setQuantity(Math.min(20, Math.max(1, nextValue)));
  }

  return (
    <section className="pak-data-card rounded-lg p-5 sm:p-6" aria-labelledby="calculator-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="pak-section-title">
            <Calculator aria-hidden="true" size={15} />
            Planning calculator
          </span>
          <h2 id="calculator-title" className="mt-4 text-2xl font-extrabold text-forest">
            See the workflow at your quantity
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-charcoal/70">
            This uses the currently displayed {planName} configuration. It is an illustration, not a
            return promise or settlement quote.
          </p>
        </div>
        <p className="rounded-md border border-mist bg-ivory px-3 py-2 text-sm font-semibold text-forest">
          {formatPkr(unitPrice)} per hen
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <div className="rounded-lg border border-mist bg-ivory p-4">
          <label htmlFor="calculator-quantity" className="text-sm font-bold text-charcoal">
            Number of hens
          </label>
          <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <button
              type="button"
              aria-label="Decrease hens"
              className="pak-quiet-button flex size-11 cursor-pointer items-center justify-center rounded-md"
              onClick={() => changeQuantity(quantity - 1)}
            >
              <Minus aria-hidden="true" size={18} />
            </button>
            <input
              id="calculator-quantity"
              value={quantity}
              type="number"
              min={1}
              max={20}
              inputMode="numeric"
              onChange={(event) => changeQuantity(Number(event.target.value || 1))}
              className="min-h-11 rounded-md border border-mist bg-surface px-3 text-center text-lg font-bold text-forest"
            />
            <button
              type="button"
              aria-label="Increase hens"
              className="pak-quiet-button flex size-11 cursor-pointer items-center justify-center rounded-md"
              onClick={() => changeQuantity(quantity + 1)}
            >
              <Plus aria-hidden="true" size={18} />
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-charcoal/60">
            Use this only to understand how quantities appear in the account workflow.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
          {[
            ["Order amount", formatPkr(summary.cost)],
            ["Daily production", `${summary.dailyEggs} eggs`],
            ["Plan record", `${summary.totalEggs} eggs`],
            ["Illustrative value", formatPkr(summary.illustrationValue)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-mist bg-surface p-4">
              <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                {label}
              </dt>
              <dd className="mt-2 text-lg font-extrabold text-forest">{value}</dd>
              {label === "Plan record" ? (
                <p className="mt-1 text-xs text-charcoal/55">Over {validityDays} days</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-5 border-t border-mist pt-4 text-xs leading-5 text-charcoal/60">
        The illustrative value uses the currently configured egg purchase rate of{" "}
        {formatPkr(ratePerEgg)}
        per egg. Actual review, approval, production, and settlement remain subject to the published
        plan rules and account activity.
      </p>
    </section>
  );
}

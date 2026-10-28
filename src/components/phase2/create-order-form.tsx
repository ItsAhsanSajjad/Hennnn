"use client";

import { useMemo, useState } from "react";
import { LockKeyhole, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createPurchaseOrderAction } from "@/server/actions/phase2";

function formatPaisaPreview(value: bigint | string | number) {
  return `Rs ${(Number(value) / 100).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function CreateOrderForm({
  planId,
  idempotencyKey,
  min,
  max,
  pricePaisa,
  basePricePaisa,
  discountPaisaPerHen,
  discountLabel,
  defaultQuantity,
  quantityDiscountTiers = [],
}: {
  planId: string;
  idempotencyKey: string;
  min: number;
  max: number;
  pricePaisa: string;
  basePricePaisa?: string;
  discountPaisaPerHen?: string;
  discountLabel?: string;
  defaultQuantity?: number;
  quantityDiscountTiers?: Array<{
    minimumQuantity: number;
    maximumQuantity: number | null;
    discountPercent: number;
    label: string;
  }>;
}) {
  const [quantity, setQuantity] = useState(Math.min(max, Math.max(min, defaultQuantity ?? min)));
  const quickValues = [
    ...new Set([
      1,
      5,
      10,
      20,
      21,
      50,
      ...quantityDiscountTiers.map((item) => item.minimumQuantity),
    ]),
  ]
    .filter((value) => value >= min && value <= max)
    .sort((left, right) => left - right);
  const quantityOffer = quantityDiscountTiers.find(
    (item) =>
      quantity >= item.minimumQuantity &&
      (item.maximumQuantity === null || quantity <= item.maximumQuantity) &&
      item.discountPercent > 0,
  );
  const bundleDiscountPaisaPerHen = useMemo(
    () =>
      quantityOffer ? (BigInt(pricePaisa) * BigInt(quantityOffer.discountPercent)) / 100n : 0n,
    [quantityOffer, pricePaisa],
  );
  const effectivePricePaisa = useMemo(
    () => BigInt(pricePaisa) - bundleDiscountPaisaPerHen,
    [bundleDiscountPaisaPerHen, pricePaisa],
  );
  const total = useMemo(
    () => effectivePricePaisa * BigInt(quantity),
    [effectivePricePaisa, quantity],
  );
  const discountTotal = useMemo(
    () => BigInt(discountPaisaPerHen ?? "0") * BigInt(quantity),
    [discountPaisaPerHen, quantity],
  );

  function setSafeQuantity(value: number) {
    setQuantity(Math.min(max, Math.max(min, value)));
  }

  return (
    <form action={createPurchaseOrderAction} className="grid gap-4">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <section className="overflow-hidden rounded-lg border border-mist bg-surface">
        <div className="border-b border-mist px-5 py-4">
          <p className="pak-kicker">Order setup</p>
          <h2 className="mt-1 text-lg font-extrabold text-forest">Select quantity</h2>
        </div>
        <div className="grid gap-4 p-5">
          <div>
            <p className="text-sm font-bold text-charcoal">Quick select</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {quickValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="pak-quiet-button min-h-12 cursor-pointer rounded-md text-base font-extrabold"
                  onClick={() => setSafeQuantity(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-charcoal">Set quantity</p>
            <div className="mt-3 grid grid-cols-[52px_1fr_52px] gap-2 rounded-lg border border-mist bg-ivory p-2">
              <button
                type="button"
                className="pak-quiet-button flex min-h-12 cursor-pointer items-center justify-center rounded-md text-leaf"
                onClick={() => setSafeQuantity(quantity - 1)}
                aria-label="Decrease quantity"
              >
                <Minus aria-hidden="true" size={20} />
              </button>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={min}
                max={max}
                value={quantity}
                onChange={(event) => setSafeQuantity(Number(event.target.value || min))}
                required
                className="min-h-12 rounded-md border border-mist bg-surface text-center text-lg font-extrabold text-forest"
              />
              <button
                type="button"
                className="pak-quiet-button flex min-h-12 cursor-pointer items-center justify-center rounded-md text-leaf"
                onClick={() => setSafeQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                <Plus aria-hidden="true" size={20} />
              </button>
            </div>
            <p className="mt-2 text-center text-xs font-bold text-charcoal/60">
              Min: {min} | Max: {max.toLocaleString("en-PK")}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-mist bg-surface">
        <div className="border-b border-mist px-5 py-4">
          <p className="pak-kicker">Before you continue</p>
          <h2 className="mt-1 text-lg font-extrabold text-forest">Order summary</h2>
        </div>
        <div className="p-5">
          <div className="rounded-lg border border-mist bg-ivory p-5">
            <p className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
              Total amount
            </p>
            <p className="mt-2 text-3xl font-extrabold text-forest">{formatPaisaPreview(total)}</p>
            <p className="mt-2 text-sm text-charcoal/65">
              {quantity} hen{quantity === 1 ? "" : "s"} in this order
            </p>
            {discountTotal > 0n && basePricePaisa ? (
              <p className="mt-3 border-t border-leaf/15 pt-3 text-sm font-semibold text-leaf">
                {discountLabel ?? "Discount"} applied: -{formatPaisaPreview(discountTotal)}
              </p>
            ) : null}
            {quantityOffer ? (
              <p className="mt-3 border-t border-leaf/15 pt-3 text-sm font-semibold text-leaf">
                {quantityOffer.label} offer: -{quantityOffer.discountPercent}% (
                {formatPaisaPreview(bundleDiscountPaisaPerHen * BigInt(quantity))})
              </p>
            ) : null}
          </div>
          <Button type="submit" className="mt-4 min-h-14 w-full">
            <LockKeyhole aria-hidden="true" size={18} />
            Buy {quantity} hen{quantity === 1 ? "" : "s"} · {formatPaisaPreview(total)}
          </Button>
          <p className="mt-3 text-center text-xs font-bold text-charcoal/60">
            Next step: upload your payment proof. Hens activate after review.
          </p>
        </div>
      </section>
    </form>
  );
}

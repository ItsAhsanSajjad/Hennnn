"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createPurchaseOrderAction } from "@/server/actions/phase2";

function formatPaisaPreview(value: bigint) {
  return `Rs ${(Number(value) / 100).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Compact "buy now" control shown directly on a plan card so a user can pick a
 * quantity and order without opening the detail page first. The preview total is
 * indicative only — createPurchaseOrderAction recomputes the authoritative price
 * (plan, promotion, quantity tiers, referral) server-side.
 */
export function QuickBuyForm({
  planId,
  idempotencyKey,
  min,
  max,
  unitPricePaisa,
}: {
  planId: string;
  idempotencyKey: string;
  min: number;
  max: number;
  unitPricePaisa: string;
}) {
  const [quantity, setQuantity] = useState(min);
  const total = useMemo(() => BigInt(unitPricePaisa) * BigInt(quantity), [unitPricePaisa, quantity]);

  function setSafeQuantity(value: number) {
    if (Number.isNaN(value)) {
      setQuantity(min);
      return;
    }
    setQuantity(Math.min(max, Math.max(min, Math.trunc(value))));
  }

  return (
    <form action={createPurchaseOrderAction} className="mt-5 grid gap-3">
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      
      {/* Interactive Stepper Row */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] p-1.5 shadow-xs">
        <button
          type="button"
          className="size-11 rounded-xl bg-white border border-[#D8793F]/30 text-[#8C3A14] flex items-center justify-center font-bold transition hover:bg-[#D8793F]/10 active:scale-95 cursor-pointer shadow-xs"
          onClick={() => setSafeQuantity(quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus aria-hidden="true" size={18} />
        </button>
        <input
          name="quantity"
          type="number"
          min={min}
          max={max}
          value={quantity}
          onChange={(event) => setSafeQuantity(Number(event.target.value))}
          required
          aria-label="Quantity of hens"
          className="flex-1 min-h-11 rounded-xl border border-[#D8793F]/25 bg-[#FFFDF4] text-center text-lg font-black text-[#17372F] focus:outline-none focus:ring-2 focus:ring-[#D8793F]/40"
        />
        <button
          type="button"
          className="size-11 rounded-xl bg-white border border-[#D8793F]/30 text-[#8C3A14] flex items-center justify-center font-bold transition hover:bg-[#D8793F]/10 active:scale-95 cursor-pointer shadow-xs"
          onClick={() => setSafeQuantity(quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>

      {/* Primary Submit Button with Glowing Copper Style */}
      <button
        type="submit"
        style={{
          background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
          boxShadow: "0 2px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.35)",
        }}
        className="w-full min-h-12 rounded-2xl py-3 px-4 font-black uppercase tracking-wider text-xs sm:text-sm text-white flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
      >
        <ShoppingCart aria-hidden="true" size={17} />
        Buy {quantity} hen{quantity === 1 ? "" : "s"} · {formatPaisaPreview(total)}
      </button>
      
      <p className="text-center text-[11px] font-semibold text-[#566D7E]">
        Min {min} · Max {max.toLocaleString("en-PK")} · quantity discounts applied at checkout
      </p>
    </form>
  );
}

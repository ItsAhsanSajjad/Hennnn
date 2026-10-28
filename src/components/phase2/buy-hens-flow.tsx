"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Egg,
  Landmark,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { createPurchaseOrderAction } from "@/server/actions/phase2";
import { PaymentMethodLogo } from "@/components/payment/payment-method-logos";
import { AnimatedHen } from "@/components/shared/animated-hen";

export type PlanData = {
  id: string;
  name: string;
  code: string;
  slug: string;
  pricePaisa: string;
  dailyEggUnits: number;
  maximumEggUnits: number;
  validityDays: number;
  minimumQuantity: number;
  maximumQuantity: number;
};

export function BuyHensFlow({
  plan,
}: {
  plan: PlanData;
}) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [selectedMethod, setSelectedMethod] = useState<string>("EASYPAISA");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [idempotencyKey, setIdempotencyKey] = useState(
    () =>
      `ord_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  );

  const resetIdempotencyKey = () => {
    setIdempotencyKey(
      `ord_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    );
  };

  const min = plan.minimumQuantity ?? 1;
  const max = plan.maximumQuantity ?? 10000;
  const [quantity, setQuantity] = useState(1);

  const safeQuantity = Math.min(max, Math.max(min, quantity));
  const quickValues = [1, 3, 5, 10, 20];

  const unitPricePaisa = BigInt(plan.pricePaisa || "50000");
  const unitPriceRs = Math.round(Number(unitPricePaisa) / 100);
  const totalAmountPaisa = unitPricePaisa * BigInt(safeQuantity);
  const totalAmountRs = Math.round(Number(totalAmountPaisa) / 100);

  function formatRupees(amount: number) {
    return `PKR ${amount.toLocaleString("en-PK")}`;
  }

  function handleQuantityChange(val: number) {
    if (Number.isNaN(val)) {
      setQuantity(min);
      return;
    }
    setQuantity(Math.min(max, Math.max(min, Math.trunc(val))));
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-28 sm:pb-16">
      {/* 1. Compact Back Button */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-[#10222D]/80 hover:text-[#D8793F] transition-colors py-1.5 px-3 rounded-xl bg-[#FFFDF4] border border-[#D8793F]/25 shadow-xs w-fit active:scale-95"
        >
          <ArrowLeft size={16} className="text-[#D8793F]" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* 2. Wide Hero Banner Matching Reference Composition */}
      <section
        style={{
          background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
          boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
        }}
        className="relative overflow-hidden rounded-3xl border-2 border-[#D8793F]/40 p-5 sm:p-8 text-white"
        aria-label="Hen Market Hero"
      >
        <div className="absolute -right-8 -top-8 size-64 rounded-full border-2 border-[#D8793F]/15 pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 size-80 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D8793F]/25 text-[#FFD0A5] border border-[#D8793F]/40">
              <Sparkles size={13} /> GROWMETA HEN MARKET
            </span>
            <h1 className="mt-2.5 text-2xl sm:text-3xl lg:text-4xl font-black text-[#FFFDF4] tracking-tight">
              Start your hen plan.
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#DCE8E8] leading-relaxed max-w-lg">
              Choose your hens and complete payment securely.
            </p>

            <div className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-[#FFD0A5]">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>Hens activate after payment confirmation.</span>
            </div>
          </div>

          {/* Clean 3D Hen Asset (No decorative circular medallions) */}
          <div className="relative size-24 sm:size-32 shrink-0 self-center sm:self-auto drop-shadow-xl">
            <div className="absolute inset-0 rounded-2xl bg-[#D8793F]/25 blur-lg scale-90" />
            <div className="relative z-10 w-full h-full rounded-2xl border-2 border-[#D8793F]/40 bg-[#061A2B] overflow-hidden flex items-center justify-center p-1.5 shadow-md">
              <AnimatedHen
                size={120}
                priority
                className="w-full h-full"
                imageClassName="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three-Step Checkout Indicator (Responsive, Zero-Truncation) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 select-none">
        {/* Step 1 */}
        <div
          style={{
            boxShadow:
              !isCheckoutOpen || checkoutStep === 1
                ? "0 4px 14px rgba(216, 121, 63, 0.15)"
                : "0 2px 6px rgba(16, 34, 45, 0.04)",
          }}
          className={`p-2 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-2 sm:gap-3 ${
            !isCheckoutOpen || checkoutStep === 1
              ? "bg-[#FFFDF4] border-[#D8793F]/60 ring-1 ring-[#D8793F]/30"
              : "bg-[#FFFDF4]/80 border-[#D8793F]/20"
          }`}
        >
          <span
            className={`size-6 sm:size-9 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm grid place-items-center shrink-0 ${
              !isCheckoutOpen || checkoutStep === 1
                ? "bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white shadow-xs"
                : "bg-[#061A2B] text-white/90"
            }`}
          >
            1
          </span>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-[#8C3A14] hidden xs:block">
              Step 1
            </p>
            <h4 className="text-[11px] sm:text-sm font-black text-[#17372F] leading-tight">
              <span className="hidden sm:inline">Hen quantity</span>
              <span className="sm:hidden">Quantity</span>
            </h4>
          </div>
        </div>

        {/* Step 2 */}
        <div
          style={{
            boxShadow:
              isCheckoutOpen && checkoutStep === 2
                ? "0 4px 14px rgba(216, 121, 63, 0.15)"
                : "0 2px 6px rgba(16, 34, 45, 0.04)",
          }}
          className={`p-2 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-2 sm:gap-3 ${
            isCheckoutOpen && checkoutStep === 2
              ? "bg-[#FFFDF4] border-[#D8793F]/60 ring-1 ring-[#D8793F]/30"
              : "bg-[#FFFDF4]/80 border-[#D8793F]/20"
          }`}
        >
          <span
            className={`size-6 sm:size-9 rounded-lg sm:rounded-xl font-black text-xs sm:text-sm grid place-items-center shrink-0 ${
              isCheckoutOpen && checkoutStep === 2
                ? "bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white shadow-xs"
                : "bg-[#061A2B] text-white/90"
            }`}
          >
            2
          </span>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-[#8C3A14] hidden xs:block">
              Step 2
            </p>
            <h4 className="text-[11px] sm:text-sm font-black text-[#17372F] leading-tight">
              <span className="hidden sm:inline">Payment method</span>
              <span className="sm:hidden">Method</span>
            </h4>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-2 sm:p-3.5 rounded-2xl bg-[#FFFDF4]/60 border border-[#D8793F]/15 flex items-center gap-2 sm:gap-3 opacity-75">
          <span className="size-6 sm:size-9 rounded-lg sm:rounded-xl bg-[#061A2B] text-white/70 font-black text-xs sm:text-sm grid place-items-center shrink-0">
            3
          </span>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-[#566D7E] hidden xs:block">
              Step 3
            </p>
            <h4 className="text-[11px] sm:text-sm font-black text-[#17372F] leading-tight">
              <span className="hidden sm:inline">Payment details</span>
              <span className="sm:hidden">Details</span>
            </h4>
          </div>
        </div>
      </div>

      {/* 4. Section Heading: "Choose your plan" */}
      <div className="pt-2">
        <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
          Choose your plan
        </h2>
      </div>

      {/* 5. One Clear Hen-Plan Card (Left-Aligned on Desktop, Responsive on Mobile) */}
      <div className="w-full max-w-[360px]">
        <div
          style={{
            boxShadow:
              "0 14px 32px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border border-[#D8793F]/30 bg-[#FFFDF4] p-5 sm:p-6 flex flex-col justify-between group transition-transform hover:-translate-y-0.5 relative overflow-hidden"
        >
          {/* Top Cinematic 3D Hen Poster */}
          <div className="relative w-full h-48 sm:h-52 rounded-2xl overflow-hidden bg-[#061A2B] border border-[#D8793F]/30 shadow-md group/poster">
            <picture className="size-full">
              <source
                media="(max-width: 640px)"
                srcSet="/images/hens/growmeta-hen-poster-mobile.avif"
                type="image/avif"
              />
              <source
                media="(max-width: 640px)"
                srcSet="/images/hens/growmeta-hen-poster-mobile.webp"
                type="image/webp"
              />
              <source
                srcSet="/images/hens/growmeta-hen-poster.avif"
                type="image/avif"
              />
              <source
                srcSet="/images/hens/growmeta-hen-poster.webp"
                type="image/webp"
              />
              <Image
                src="/images/hens/growmeta-hen-poster.webp"
                alt="GrowMeta managed poultry hen plan"
                width={1920}
                height={1080}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                priority
                className="size-full object-cover object-center transition-transform duration-500 ease-out group-hover/poster:scale-[1.02]"
              />
            </picture>

            {/* Subtle Viewport Entry Light Sweep Overlay */}
            <div
              className="pointer-events-none absolute inset-y-0 -inset-x-full w-[60%] bg-gradient-to-r from-transparent via-white/20 to-transparent poster-sweep-effect"
              aria-hidden="true"
            />
          </div>

          {/* Plan Name */}
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
              OFFICIAL POULTRY PLAN
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#17372F] leading-tight mt-0.5">
              {plan.name}
            </h3>
          </div>

          {/* Prominent Price Strip */}
          <div className="mt-3 py-2 px-3.5 rounded-2xl bg-gradient-to-r from-[#FFF8EC] to-[#FFEED7] border border-[#D8793F]/30 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#D8793F] tracking-tight">
              {formatRupees(unitPriceRs)}
            </span>
            <span className="text-xs font-bold text-[#566D7E]">per hen</span>
          </div>

          {/* Three Compact Information Tiles */}
          <div className="mt-4 grid grid-cols-3 divide-x divide-[#D8793F]/20 rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] text-center p-2.5">
            <div className="px-1">
              <p className="text-base sm:text-lg font-black text-[#17372F]">{plan.dailyEggUnits}</p>
              <p className="text-[10px] font-bold text-[#566D7E]">Daily Egg</p>
            </div>
            <div className="px-1">
              <p className="text-base sm:text-lg font-black text-[#17372F]">{plan.validityDays} Days</p>
              <p className="text-[10px] font-bold text-[#566D7E]">Plan Days</p>
            </div>
            <div className="px-1">
              <p className="text-base sm:text-lg font-black text-[#17372F]">{plan.maximumEggUnits}</p>
              <p className="text-[10px] font-bold text-[#566D7E]">Total Eggs</p>
            </div>
          </div>

          {/* Full-Width Primary Action */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                resetIdempotencyKey();
                setIsCheckoutOpen(true);
                setCheckoutStep(1);
              }}
              style={{
                background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 3px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.35)",
              }}
              className="w-full min-h-[46px] rounded-2xl py-3 px-4 font-black uppercase tracking-wider text-sm text-white flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
            >
              <span>Buy Hens</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Checkout Step Drawer / Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#061A2B]/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            style={{
              background:
                "radial-gradient(40rem 30rem at 50% 0%, rgba(255, 208, 165, 0.3), transparent 70%), #FFFDF4",
              boxShadow: "0 24px 48px rgba(6, 26, 43, 0.4), 0 3px 0 #D8793F",
            }}
            className="relative w-full max-w-lg rounded-3xl border-2 border-[#D8793F]/40 p-5 sm:p-7 text-[#10222D] overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#D8793F]/20">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                  {checkoutStep === 1 ? "STEP 01 OF 02" : "STEP 02 OF 02"}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#17372F]">
                  {checkoutStep === 1 ? "Select Hen Quantity" : "Choose Payment Method"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                aria-label="Close checkout"
                className="size-9 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/30 grid place-items-center text-[#8C3A14] hover:bg-[#D8793F]/20 active:scale-95 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Hen Quantity */}
            {checkoutStep === 1 && (
              <div className="mt-5 space-y-5">
                {/* Stepper counter */}
                <div className="flex items-center gap-3 rounded-2xl border-2 border-[#D8793F]/35 bg-[#FFF8EC] p-2 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(safeQuantity - 1)}
                    disabled={safeQuantity <= min}
                    aria-label="Decrease quantity"
                    className="size-12 rounded-xl bg-white border border-[#D8793F]/40 text-[#8C3A14] font-black flex items-center justify-center transition hover:bg-[#D8793F]/15 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs"
                  >
                    <Minus size={20} />
                  </button>

                  <div className="flex-1 text-center py-1">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={safeQuantity}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      aria-label="Hen Quantity"
                      className="w-full text-center text-3xl font-black text-[#17372F] bg-transparent focus:outline-none"
                    />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C3A14]">
                      {safeQuantity === 1 ? "1 healthy hen" : `${safeQuantity} healthy hens`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(safeQuantity + 1)}
                    disabled={safeQuantity >= max}
                    aria-label="Increase quantity"
                    className="size-12 rounded-xl bg-white border border-[#D8793F]/40 text-[#8C3A14] font-black flex items-center justify-center transition hover:bg-[#D8793F]/15 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Quick select chips */}
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#566D7E] mb-2">
                    Quick Select
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {quickValues.map((val) => {
                      const isSelected = safeQuantity === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuantityChange(val)}
                          className={`py-2 px-1 rounded-xl font-black text-xs transition-all cursor-pointer border text-center ${
                            isSelected
                              ? "bg-gradient-to-r from-[#F59B52] to-[#D8793F] text-white border-[#D8793F] shadow-xs"
                              : "bg-[#FFF8EC] text-[#17372F] border-[#D8793F]/25 hover:border-[#D8793F]/50"
                          }`}
                        >
                          {val} {val === 1 ? "Hen" : "Hens"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown Summary */}
                <div className="rounded-2xl border border-[#D8793F]/30 bg-[#FFF8EC] p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-[#566D7E]">
                    <span>Unit price:</span>
                    <span className="font-black text-[#17372F]">{formatRupees(unitPriceRs)} / hen</span>
                  </div>
                  <div className="flex justify-between items-center text-[#566D7E]">
                    <span>Selected quantity:</span>
                    <span className="font-black text-[#17372F]">{safeQuantity} {safeQuantity === 1 ? "hen" : "hens"}</span>
                  </div>
                  <div className="pt-2 border-t border-[#D8793F]/20 flex justify-between items-center text-sm font-black text-[#17372F]">
                    <span>Total Amount:</span>
                    <span className="text-xl font-black text-[#D8793F]">
                      {formatRupees(totalAmountRs)}
                    </span>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setCheckoutStep(2)}
                  style={{
                    background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                    boxShadow: "0 3px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.35)",
                  }}
                  className="w-full min-h-[48px] rounded-2xl py-3 px-5 font-black uppercase tracking-wider text-sm text-white flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
                >
                  <span>Continue to Payment Method</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Payment Method Selection & Submit */}
            {checkoutStep === 2 && (
              <form
                action={createPurchaseOrderAction}
                onSubmit={() => setIsSubmitting(true)}
                className="mt-5 space-y-5"
              >
                <input type="hidden" name="planId" value={plan.id} />
                <input type="hidden" name="quantity" value={safeQuantity} />
                <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

                {/* Amount Confirmation Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-[#09263A] to-[#061A2B] p-4 text-white border border-[#D8793F]/40 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#FFD0A5]">
                      Total Payable
                    </p>
                    <p className="text-2xl font-black text-[#FFFDF4]">
                      {formatRupees(totalAmountRs)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[#DCE8E8]">
                    <p className="font-bold">{safeQuantity} × {formatRupees(unitPriceRs)}</p>
                    <p className="text-[11px] text-[#FFD0A5]">No hidden charges</p>
                  </div>
                </div>

                {/* Payment Methods Grid */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#566D7E]">
                    Select Payment Gateway
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Easypaisa */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("EASYPAISA")}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        selectedMethod === "EASYPAISA"
                          ? "bg-[#FFF8EC] border-[#D8793F] ring-2 ring-[#D8793F]/30"
                          : "bg-[#FFFDF4] border-[#D8793F]/20 hover:border-[#D8793F]/40"
                      }`}
                    >
                      <PaymentMethodLogo method="EASYPAISA" size="sm" />
                      <div>
                        <p className="text-xs font-black text-[#17372F]">Easypaisa</p>
                        <p className="text-[10px] font-semibold text-[#566D7E]">Manual transfer</p>
                      </div>
                    </button>

                    {/* JazzCash */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("JAZZCASH")}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        selectedMethod === "JAZZCASH"
                          ? "bg-[#FFF8EC] border-[#D8793F] ring-2 ring-[#D8793F]/30"
                          : "bg-[#FFFDF4] border-[#D8793F]/20 hover:border-[#D8793F]/40"
                      }`}
                    >
                      <PaymentMethodLogo method="JAZZCASH" size="sm" />
                      <div>
                        <p className="text-xs font-black text-[#17372F]">JazzCash</p>
                        <p className="text-[10px] font-semibold text-[#566D7E]">Manual transfer</p>
                      </div>
                    </button>

                    {/* Bank Transfer */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("BANK_TRANSFER")}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        selectedMethod === "BANK_TRANSFER"
                          ? "bg-[#FFF8EC] border-[#D8793F] ring-2 ring-[#D8793F]/30"
                          : "bg-[#FFFDF4] border-[#D8793F]/20 hover:border-[#D8793F]/40"
                      }`}
                    >
                      <PaymentMethodLogo method="BANK_TRANSFER" size="sm" />
                      <div>
                        <p className="text-xs font-black text-[#17372F]">Bank Transfer</p>
                        <p className="text-[10px] font-semibold text-[#566D7E]">Direct bank deposit</p>
                      </div>
                    </button>

                    {/* Pay Online (PayBost) */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("PAYBOST")}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        selectedMethod === "PAYBOST"
                          ? "bg-[#FFF8EC] border-[#D8793F] ring-2 ring-[#D8793F]/30"
                          : "bg-[#FFFDF4] border-[#D8793F]/20 hover:border-[#D8793F]/40"
                      }`}
                    >
                      <PaymentMethodLogo method="PAYBOST" size="sm" />
                      <div>
                        <p className="text-xs font-black text-[#17372F]">Pay Online</p>
                        <p className="text-[10px] font-semibold text-[#566D7E]">Instant checkout</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="py-3 px-4 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/30 text-xs font-black text-[#8C3A14] hover:bg-[#D8793F]/15 transition cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                      boxShadow: "0 3px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.35)",
                    }}
                    className="flex-1 min-h-[48px] rounded-2xl py-3 px-5 font-black uppercase tracking-wider text-sm text-white flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Creating Order..." : "Continue to Payment Details"}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Egg,
  Landmark,
  Minus,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

import { createPurchaseOrderAction } from "@/server/actions/phase2";
import { PaymentMethodLogo } from "@/components/payment/payment-method-logos";

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
  referralDiscountPaisa?: string;
};

export type DiscountTier = {
  key: string;
  label: string;
  minimumQuantity: number;
  maximumQuantity: number | null;
  discountPercent: number;
};

export function PurchaseWizard({
  plans,
  initialPlanId,
  discountTiers = [],
}: {
  plans: PlanData[];
  initialPlanId?: string;
  discountTiers?: DiscountTier[];
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || plans[0]?.id || "");
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedMethod, setSelectedMethod] = useState<string>("EASYPAISA");
  const [idempotencyKey] = useState(
    () =>
      `ord_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  );

  const currentPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId],
  );

  const min = currentPlan?.minimumQuantity ?? 1;
  const max = currentPlan?.maximumQuantity ?? 100;
  const [quantity, setQuantity] = useState(min);

  const safeQuantity = Math.min(max, Math.max(min, quantity));

  const quickValues = useMemo(() => {
    const list = [1, 3, 5, 10, 20];
    return list.filter((v) => v >= min && v <= max);
  }, [min, max]);

  const volumeDiscountTier = useMemo(() => {
    return discountTiers.find(
      (tier) =>
        safeQuantity >= tier.minimumQuantity &&
        (tier.maximumQuantity === null || safeQuantity <= tier.maximumQuantity) &&
        tier.discountPercent > 0,
    );
  }, [discountTiers, safeQuantity]);

  const basePricePaisa = BigInt(currentPlan?.pricePaisa || "0");
  const referralDiscountPaisa = BigInt(currentPlan?.referralDiscountPaisa || "0");
  const priceAfterReferral = basePricePaisa - referralDiscountPaisa;

  const volumeDiscountPaisaPerHen = volumeDiscountTier
    ? (priceAfterReferral * BigInt(volumeDiscountTier.discountPercent)) / 100n
    : 0n;

  const finalUnitPricePaisa = priceAfterReferral - volumeDiscountPaisaPerHen;
  const totalAmountPaisa = finalUnitPricePaisa * BigInt(safeQuantity);

  function formatRupees(paisa: bigint) {
    return `PKR ${(Number(paisa) / 100).toLocaleString("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  function handleQuantityChange(val: number) {
    if (Number.isNaN(val)) {
      setQuantity(min);
      return;
    }
    setQuantity(Math.min(max, Math.max(min, Math.trunc(val))));
  }

  return (
    <div className="space-y-6">
      {/* 3-Step Visual Progress Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => setStep(1)}
          style={{
            boxShadow:
              step === 1
                ? "0 8px 22px rgba(216, 121, 63, 0.22), 0 3px 0 #D8793F"
                : "0 4px 12px rgba(16, 34, 45, 0.04)",
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
            step === 1
              ? "bg-[#FFFDF4] border-[#D8793F] ring-2 ring-[#D8793F]/30"
              : "bg-[#FFFDF4]/80 border-[#D8793F]/20 hover:border-[#D8793F]/40"
          }`}
        >
          <span
            className={`size-10 rounded-xl font-black text-base grid place-items-center shrink-0 ${
              step === 1
                ? "bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white shadow-md"
                : "bg-[#061A2B] text-white/90"
            }`}
          >
            1
          </span>
          <div>
            <p
              className={`text-[10px] font-black uppercase tracking-wider ${
                step === 1 ? "text-[#8C3A14]" : "text-[#566D7E]"
              }`}
            >
              STEP ONE
            </p>
            <h4 className="text-sm font-black text-[#17372F]">Select Hen Quantity</h4>
          </div>
        </button>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => setStep(2)}
          style={{
            boxShadow:
              step === 2
                ? "0 8px 22px rgba(216, 121, 63, 0.22), 0 3px 0 #D8793F"
                : "0 4px 12px rgba(16, 34, 45, 0.04)",
          }}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
            step === 2
              ? "bg-[#FFFDF4] border-[#D8793F] ring-2 ring-[#D8793F]/30"
              : "bg-[#FFFDF4]/80 border-[#D8793F]/20 hover:border-[#D8793F]/40"
          }`}
        >
          <span
            className={`size-10 rounded-xl font-black text-base grid place-items-center shrink-0 ${
              step === 2
                ? "bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white shadow-md"
                : "bg-[#061A2B] text-white/90"
            }`}
          >
            2
          </span>
          <div>
            <p
              className={`text-[10px] font-black uppercase tracking-wider ${
                step === 2 ? "text-[#8C3A14]" : "text-[#566D7E]"
              }`}
            >
              STEP TWO
            </p>
            <h4 className="text-sm font-black text-[#17372F]">Payment Method</h4>
          </div>
        </button>

        {/* Step 3 */}
        <div
          style={{
            boxShadow: "0 4px 12px rgba(16, 34, 45, 0.04)",
          }}
          className="p-4 rounded-2xl bg-[#FFFDF4]/60 border border-[#D8793F]/15 flex items-center gap-3.5 opacity-70"
        >
          <span className="size-10 rounded-xl bg-[#061A2B] text-white/70 font-black text-base grid place-items-center shrink-0">
            3
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#566D7E]">
              STEP THREE
            </p>
            <h4 className="text-sm font-black text-[#17372F]">Payment &amp; Activation</h4>
          </div>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <form action={createPurchaseOrderAction}>
        <input type="hidden" name="planId" value={selectedPlanId} />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <input type="hidden" name="quantity" value={safeQuantity} />

        {step === 1 ? (
          /* STEP 1: Two-Column Composition Matching media_1788976040874.png */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
            {/* Left Card: 65% Main Configuration */}
            <div
              style={{
                boxShadow: "0 16px 36px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
              }}
              className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Header with Peeking Hen Mascot */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D8793F]/15 text-[#8C3A14] border border-[#D8793F]/30">
                    STEP 01
                  </span>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-black text-[#17372F]">
                    How many hens?
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#566D7E]">
                    Choose the number of production hens to add to your coop.
                  </p>
                </div>

                {/* Peeking Mascot Badge */}
                <div className="relative size-16 sm:size-20 shrink-0 rounded-2xl overflow-hidden border-2 border-[#D8793F]/30 bg-[#061A2B] shadow-md">
                  <Image
                    src="/dashboard/brown-hen-3d.jpg"
                    alt="GrowMeta Hen"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Selected Plan Selector Strip */}
              {plans.length > 1 ? (
                <div className="mt-6 rounded-2xl border border-[#D8793F]/30 bg-[#FFF8EC] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#D8793F]/20 border border-[#D8793F]/40 flex items-center justify-center text-[#8C3A14]">
                      <Egg size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                        SELECTED PLAN
                      </p>
                      <p className="text-sm font-black text-[#17372F]">{currentPlan?.name}</p>
                    </div>
                  </div>

                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    aria-label="Select Hen Plan"
                    className="rounded-xl border border-[#D8793F]/35 bg-[#FFFDF4] px-3 py-1.5 text-xs font-black text-[#17372F] focus:outline-none focus:ring-2 focus:ring-[#D8793F]/40 cursor-pointer"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {formatRupees(BigInt(p.pricePaisa))}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Interactive Large Stepper */}
              <div className="mt-6">
                <div className="flex items-center gap-3 rounded-2xl border-2 border-[#D8793F]/35 bg-[#FFF8EC] p-2 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(safeQuantity - 1)}
                    disabled={safeQuantity <= min}
                    aria-label="Decrease quantity"
                    className="size-12 sm:size-14 rounded-xl bg-white border border-[#D8793F]/40 text-[#8C3A14] font-black flex items-center justify-center transition hover:bg-[#D8793F]/15 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-sm"
                  >
                    <Minus size={22} />
                  </button>

                  <div className="flex-1 text-center py-1">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={safeQuantity}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      aria-label="Hen Quantity"
                      className="w-full text-center text-3xl sm:text-4xl font-black text-[#17372F] bg-transparent focus:outline-none"
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
                    className="size-12 sm:size-14 rounded-xl bg-white border border-[#D8793F]/40 text-[#8C3A14] font-black flex items-center justify-center transition hover:bg-[#D8793F]/15 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-sm"
                  >
                    <Plus size={22} />
                  </button>
                </div>
              </div>

              {/* Quick Select Presets */}
              <div className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#566D7E] mb-2">
                  Quick Select Quantity
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {quickValues.map((val) => {
                    const isSelected = safeQuantity === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuantityChange(val)}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-gradient-to-r from-[#F59B52] to-[#D8793F] text-white border-[#D8793F] shadow-sm"
                            : "bg-[#FFF8EC] text-[#17372F] border-[#D8793F]/25 hover:border-[#D8793F]/50"
                        }`}
                      >
                        {val} {val === 1 ? "Hen" : "Hens"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume Discount Notification */}
              {volumeDiscountTier && (
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-500/30 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                  <BadgePercent size={16} className="shrink-0 text-emerald-600" />
                  <span>
                    Volume Tier: <strong>{volumeDiscountTier.discountPercent}% OFF</strong> (
                    {volumeDiscountTier.label}) applied automatically!
                  </span>
                </div>
              )}

              {/* Continue to Payment CTA */}
              <div className="mt-6 pt-4 border-t border-[#D8793F]/20">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                    boxShadow: "0 3px 0 #8C3A14, 0 8px 20px rgba(216, 121, 63, 0.4)",
                  }}
                  className="w-full min-h-13 rounded-2xl py-3.5 px-6 font-black uppercase tracking-wider text-sm sm:text-base text-white flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
                >
                  Continue to Payment ({formatRupees(totalAmountPaisa)})
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Right Card: 35% Order Summary Card Matching media_1788976040874.png */}
            <div
              style={{
                boxShadow: "0 16px 36px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
              }}
              className="rounded-3xl border-2 border-[#D8793F]/35 bg-[#FFF8EC] p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#D8793F]/20">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                    ORDER SUMMARY
                  </span>
                  <h4 className="text-lg font-black text-[#17372F]">Your hen investment</h4>
                </div>
                <div className="size-10 rounded-xl bg-[#D8793F]/20 border border-[#D8793F]/35 grid place-items-center text-[#8C3A14]">
                  <Egg size={18} />
                </div>
              </div>

              {/* Line Items */}
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-[#566D7E]">
                  <span>Plan selected</span>
                  <span className="font-black text-[#17372F]">{currentPlan?.name}</span>
                </div>
                <div className="flex justify-between items-center text-[#566D7E]">
                  <span>Unit price</span>
                  <span className="font-black text-[#17372F]">
                    {formatRupees(finalUnitPricePaisa)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#566D7E]">
                  <span>Quantity</span>
                  <span className="font-black text-[#17372F]">
                    {safeQuantity} {safeQuantity === 1 ? "hen" : "hens"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#566D7E]">
                  <span>Daily egg yield</span>
                  <span className="font-black text-emerald-700">
                    +{(currentPlan?.dailyEggUnits ?? 1) * safeQuantity} eggs / day
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#566D7E]">
                  <span>Cycle yield</span>
                  <span className="font-black text-[#17372F]">
                    {(currentPlan?.maximumEggUnits ?? 1) * safeQuantity} total eggs
                  </span>
                </div>
              </div>

              {/* Large Highlighted Total Payment Box */}
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#09263A] to-[#061A2B] p-5 text-center text-white border border-[#D8793F]/40 shadow-md">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#FFD0A5]">
                  TOTAL PAYMENT
                </p>
                <p className="mt-1 text-3xl font-black text-[#FFFDF4]">
                  {formatRupees(totalAmountPaisa)}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-[#DCE8E8]">
                  Includes all discounts &amp; instant activation
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-4 border-t border-[#D8793F]/20 space-y-2 text-xs font-bold text-[#17372F]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Daily automated egg distribution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>100% verified poultry custody</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Instant egg trade &amp; bank cashout</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: Payment Method Selection Matching media_1788976040859.png */
          <div className="max-w-3xl mx-auto">
            <div
              style={{
                boxShadow: "0 16px 36px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
              }}
              className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D8793F]/15 text-[#8C3A14] border border-[#D8793F]/30">
                    STEP 02
                  </span>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-black text-[#17372F]">
                    Select payment method
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#566D7E]">
                    Deposit funds securely using Pakistani mobile wallets or direct bank transfer.
                  </p>
                </div>

                <div className="relative size-16 sm:size-20 shrink-0 rounded-2xl overflow-hidden border-2 border-[#D8793F]/30 bg-[#061A2B] shadow-md flex items-center justify-center text-[#FFD0A5]">
                  <CreditCard size={32} />
                </div>
              </div>

              {/* Order Summary Strip */}
              <div className="mb-6 rounded-2xl border border-[#D8793F]/30 bg-[#FFF8EC] p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                    PENDING ORDER
                  </p>
                  <p className="text-sm font-black text-[#17372F]">
                    {safeQuantity} {safeQuantity === 1 ? "Hen" : "Hens"} ({currentPlan?.name})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                    AMOUNT DUE
                  </p>
                  <p className="text-lg font-black text-[#D8793F]">
                    {formatRupees(totalAmountPaisa)}
                  </p>
                </div>
              </div>

              {/* Payment Methods Grid */}
              <div
                role="radiogroup"
                aria-label="Select payment method"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6"
              >
                {[
                  {
                    id: "EASYPAISA",
                    title: "Easypaisa",
                    subtitle: "Mobile wallet transfer",
                    badge: "POPULAR",
                    badgeStyle: "bg-[#00C853]/15 text-[#007E33] border-[#00C853]/30",
                  },
                  {
                    id: "JAZZCASH",
                    title: "JazzCash",
                    subtitle: "Mobile wallet transfer",
                    badge: "FAST",
                    badgeStyle: "bg-[#E60000]/15 text-[#B30000] border-[#E60000]/30",
                  },
                  {
                    id: "BANK_TRANSFER",
                    title: "Bank Transfer",
                    subtitle: "Bank or IBFT transfer",
                    badge: "VERIFIED",
                    badgeStyle: "bg-[#061A2B]/10 text-[#061A2B] border-[#061A2B]/25",
                  },
                  {
                    id: "PAYBOST",
                    title: "Pay Online (PayBost)",
                    subtitle: "Secure online checkout",
                    badge: "INSTANT",
                    badgeStyle: "bg-[#24D6B0]/15 text-[#0A7B62] border-[#24D6B0]/30",
                  },
                ].map((method) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedMethod(method.id)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          setSelectedMethod(method.id);
                        }
                      }}
                      style={{
                        boxShadow: isSelected
                          ? "0 10px 24px rgba(216, 121, 63, 0.25), 0 3px 0 #D8793F"
                          : "0 2px 8px rgba(16, 34, 45, 0.04)",
                      }}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group min-h-[76px] sm:min-h-[82px] ${
                        isSelected
                          ? "bg-[#FFF8EC] border-[#D8793F] ring-2 ring-[#D8793F]/40 -translate-y-0.5"
                          : "bg-white border-[#D8793F]/20 hover:border-[#D8793F]/45 hover:-translate-y-0.5 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-3.5">
                        <PaymentMethodLogo
                          method={method.id}
                          size="md"
                          className="transition-transform duration-200 group-hover:scale-105"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm sm:text-base font-black text-[#17372F] tracking-tight leading-none">
                              {method.title}
                            </h4>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${method.badgeStyle}`}
                            >
                              {method.badge}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs font-semibold text-[#566D7E] mt-1 leading-snug">
                            {method.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Selection Checkmark / State Indicator */}
                      <div className="shrink-0 flex items-center justify-center">
                        {isSelected ? (
                          <span className="size-6 rounded-full bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                            <Check size={14} strokeWidth={3} aria-hidden="true" />
                          </span>
                        ) : (
                          <span className="size-6 rounded-full border border-[#D8793F]/30 bg-transparent flex items-center justify-center transition-colors group-hover:border-[#D8793F]/60">
                            <ChevronRight size={14} className="text-[#8C3A14]/50 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#D8793F]/20">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#D8793F]/35 bg-[#FFFDF4] font-black text-xs uppercase tracking-wider text-[#17372F] hover:bg-[#FFF8EC] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} /> Back to Quantity
                </button>

                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                    boxShadow: "0 3px 0 #8C3A14, 0 8px 20px rgba(216, 121, 63, 0.4)",
                  }}
                  className="flex-1 w-full min-h-13 rounded-2xl py-3.5 px-6 font-black uppercase tracking-wider text-sm sm:text-base text-white flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
                >
                  Confirm &amp; Proceed to Payment Details ({formatRupees(totalAmountPaisa)})
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

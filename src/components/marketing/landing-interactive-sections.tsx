"use client";

import { useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  CreditCard,
  Sprout,
  BarChart3,
  Banknote,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

// --- 1. How It Works Timeline Component ---
export interface StepItem {
  number: string;
  title: string;
  text: string;
}

const steps: StepItem[] = [
  {
    number: "01",
    title: "Choose a Plan",
    text: "Select your desired hen bundle at PKR 500 per hen with clear, upfront terms and zero hidden costs.",
  },
  {
    number: "02",
    title: "Complete Payment",
    text: "Pay securely with instant PayBost online checkout or manual bank transfer with receipt verification.",
  },
  {
    number: "03",
    title: "We Handle Everything",
    text: "Our agricultural farm team manages organic feed, bio-security, climate control, and veterinary care.",
  },
  {
    number: "04",
    title: "Track Egg Activity",
    text: "Watch verified daily egg yields credited to your production ledger in transparent real time.",
  },
  {
    number: "05",
    title: "Sell and Earn",
    text: "Submit your recorded eggs for sale anytime and receive fast reviewed cashouts to your bank or mobile wallet.",
  },
];

const stepIcons = [ClipboardList, CreditCard, Sprout, BarChart3, Banknote];

export function HowItWorksTimeline() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="relative">
      {/* Desktop Timeline with Connecting Progress Line */}
      <div className="hidden lg:block relative">
        {/* Background Connecting Line */}
        <div
          className="absolute top-10 left-[8%] right-[8%] h-1 rounded-full bg-gradient-to-r from-[#10B981]/20 via-[#10B981]/50 to-[#10B981]/20 pointer-events-none"
          aria-hidden="true"
        />

        <div className="grid grid-cols-5 gap-4">
          {steps.map((item, idx) => {
            const Icon = stepIcons[idx];
            const isHovered = activeStep === idx;
            return (
              <div
                key={item.number}
                onMouseEnter={() => setActiveStep(idx)}
                className={`relative flex flex-col items-center text-center p-5 rounded-3xl border transition-all duration-300 cursor-pointer ${
                  isHovered
                    ? "bg-[#0B2529] border-[#10B981]/50 shadow-[0_16px_32px_rgba(0,0,0,0.5)] -translate-y-1.5"
                    : "bg-[#092226]/80 border-[#10B981]/15 hover:border-[#10B981]/30"
                }`}
              >
                {/* Numbered Step Icon */}
                <div className="relative mb-4 flex size-16 items-center justify-center rounded-2xl border border-[#10B981]/40 bg-gradient-to-b from-[#10B981] to-[#059669] text-[#041215] shadow-[0_4px_0_#047857]">
                  <Icon size={26} aria-hidden="true" />
                  <span className="absolute -top-2.5 -right-2.5 grid size-7 place-items-center rounded-full border border-[#10B981] bg-[#071722] text-xs font-black text-[#10B981] shadow-md">
                    {item.number}
                  </span>
                </div>

                <h3 className="text-base font-black text-white tracking-tight">{item.title}</h3>
                <p className="mt-2 text-xs font-semibold text-[#A9C2BC] leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Timeline (< lg screens) */}
      <div className="lg:hidden relative space-y-4 pl-4 sm:pl-6 border-l-2 border-[#10B981]/30 ml-3 sm:ml-4">
        {steps.map((item, idx) => {
          const Icon = stepIcons[idx];
          return (
            <div
              key={item.number}
              className="relative rounded-2xl border border-[#10B981]/20 bg-[#092226]/90 p-5 shadow-sm space-y-2"
            >
              {/* Bullet Node on Line */}
              <div className="absolute -left-[27px] sm:-left-[35px] top-5 flex size-8 sm:size-9 items-center justify-center rounded-full border-2 border-[#10B981] bg-[#071722] text-[11px] font-black text-[#10B981] shadow-md">
                {item.number}
              </div>

              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#10B981]/20 text-[#10B981]">
                  <Icon size={20} />
                </span>
                <h3 className="text-base font-black text-white tracking-tight">{item.title}</h3>
              </div>
              <p className="text-xs font-semibold text-[#A9C2BC] leading-relaxed pl-13">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- 2. Interactive Sell Eggs Settlement Calculator ---
export function SellEggsCalculator() {
  const [eggs, setEggs] = useState(120);
  const ratePerEgg = 18; // PKR 18 per egg published index

  const grossAmount = eggs * ratePerEgg;
  const serviceFee = Math.round(grossAmount * 0.05); // 5% service fee
  const processingFee = 52; // Fixed payment processing fee
  const netAmount = Math.max(0, grossAmount - serviceFee - processingFee);

  const setPreset = (qty: number) => {
    setEggs(qty);
  };

  return (
    <div className="rounded-3xl border border-[#D8793F]/30 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_16px_36px_rgba(0,0,0,0.4)] space-y-6">
      <div className="flex items-center justify-between border-b border-[#D8793F]/15 pb-4">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8C3A14]">
            SETTLEMENT CALCULATOR
          </span>
          <h3 className="text-xl font-black text-[#17372F] tracking-tight mt-0.5">
            Live liquidation breakdown
          </h3>
        </div>
        <span className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/15 px-3 py-1 text-xs font-black text-[#0A3323]">
          PKR {ratePerEgg} / Egg
        </span>
      </div>

      {/* Preset Quantity Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#566D7E] block">Select Egg Quantity to Sell:</label>
        <div className="grid grid-cols-4 gap-2">
          {[50, 120, 300, 600].map((qty) => (
            <button
              key={qty}
              type="button"
              onClick={() => setPreset(qty)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer min-h-[40px] ${
                eggs === qty
                  ? "bg-[#17372F] text-white shadow-md"
                  : "bg-[#FFF8EC] border border-[#D8793F]/20 text-[#17372F] hover:bg-[#FFFDF4]"
              }`}
            >
              {qty} Eggs
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Slider / Input */}
      <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#566D7E]">Custom Units:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEggs((e) => Math.max(10, e - 10))}
              className="size-8 rounded-lg bg-[#FFFDF4] border border-[#D8793F]/20 grid place-items-center text-[#17372F] hover:bg-white transition cursor-pointer"
              aria-label="Decrease eggs"
            >
              <Minus size={14} />
            </button>
            <span className="font-mono text-base font-black text-[#17372F] min-w-[60px] text-center">
              {eggs}
            </span>
            <button
              type="button"
              onClick={() => setEggs((e) => Math.min(2000, e + 10))}
              className="size-8 rounded-lg bg-[#FFFDF4] border border-[#D8793F]/20 grid place-items-center text-[#17372F] hover:bg-white transition cursor-pointer"
              aria-label="Increase eggs"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={eggs}
          onChange={(e) => setEggs(Number(e.target.value))}
          className="w-full accent-[#10B981] cursor-pointer"
          aria-label="Egg quantity slider"
        />
      </div>

      {/* Calculation Output Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-[#D8793F]/15 bg-white p-3 text-center">
          <p className="text-[10px] font-bold text-[#566D7E] uppercase">Eggs</p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#17372F] tabular-nums">{eggs}</p>
          <p className="text-[10px] text-[#566D7E]">units</p>
        </div>
        <div className="rounded-2xl border border-[#D8793F]/15 bg-white p-3 text-center">
          <p className="text-[10px] font-bold text-[#566D7E] uppercase">Rate</p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#17372F] tabular-nums">PKR {ratePerEgg}</p>
          <p className="text-[10px] text-[#566D7E]">per egg</p>
        </div>
        <div className="rounded-2xl border border-[#D8793F]/20 bg-[#FFF8EC] p-3 text-center">
          <p className="text-[10px] font-bold text-[#8C3A14] uppercase">Gross</p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#8C3A14] tabular-nums">
            PKR {grossAmount.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#8C3A14]">base value</p>
        </div>
      </div>

      {/* Deductions & Net Payout */}
      <div className="space-y-2 rounded-2xl border border-[#D8793F]/15 bg-white p-4 text-xs font-semibold">
        <div className="flex justify-between text-[#566D7E]">
          <span>Service Fee (5%)</span>
          <span className="text-amber-800">- PKR {serviceFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[#566D7E]">
          <span>Payment Processing Fee</span>
          <span className="text-amber-800">- PKR {processingFee}</span>
        </div>
        <div className="my-1 h-px bg-[#D8793F]/15" />
        <div className="flex justify-between items-center text-sm sm:text-base font-black text-[#17372F]">
          <span>Estimated Cashout</span>
          <span className="text-lg sm:text-xl font-black text-[#10B981] tabular-nums">
            PKR {netAmount.toLocaleString()}
          </span>
        </div>
      </div>

      <p className="text-center text-[11px] font-medium text-[#566D7E]">
        *Settlements are reviewed and paid out directly via Bank Transfer, JazzCash, or EasyPaisa.
      </p>
    </div>
  );
}

// --- 3. Accessible FAQ Accordion Component ---
interface FaqItem {
  id: string;
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    id: "faq-1",
    q: "How does GrowMeta Egg work?",
    a: "You select a poultry plan and acquire verified hens at PKR 500 per hen. Our farm team handles daily feed, biosecurity, and flock care, while our system records every egg yield directly to your member ledger. You can submit your recorded eggs for sale anytime for direct cashouts to JazzCash, EasyPaisa, or bank account.",
  },
  {
    id: "faq-2",
    q: "How are daily egg yields recorded and verified?",
    a: "Egg production is logged on verified server-side schedules according to active hen assets and published contract terms. Every accrual creates an immutable ledger entry with full historical auditability in your dashboard.",
  },
  {
    id: "faq-3",
    q: "When and how do I receive my egg-sale payouts?",
    a: "Whenever your egg balance is ready, submit an egg-sale request from your dashboard. After standard verification, payouts are settled directly to your registered bank account, JazzCash, or EasyPaisa without hidden fees.",
  },
  {
    id: "faq-4",
    q: "Are there any hidden fees or quantity discounts?",
    a: "No. Every hen is strictly PKR 500 with zero quantity discounts across all plan tiers. Transparent service fees (5%) and payment processing fees are fully itemized prior to any sale settlement.",
  },
  {
    id: "faq-5",
    q: "How is my account data and funds protected?",
    a: "GrowMeta Egg applies enterprise encryption, password hashing, authenticated session controls, and strict audit logs. Flock health and biosecurity protocols are maintained by licensed veterinary personnel.",
  },
];

export function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4" role="region" aria-label="Frequently Asked Questions Accordion">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 ${
              isOpen
                ? "border-[#10B981]/40 bg-[#0B2529] shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
                : "border-[#10B981]/15 bg-[#092226]/80 hover:bg-[#0B2529]/70 hover:border-[#10B981]/25"
            }`}
          >
            <button
              type="button"
              id={`header-${faq.id}`}
              aria-expanded={isOpen}
              aria-controls={faq.id}
              onClick={() => toggleFaq(faq.id)}
              className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
            >
              <span className="text-sm sm:text-base font-black text-white tracking-tight leading-snug">
                {faq.q}
              </span>
              <span
                className={`grid size-8 sm:size-9 shrink-0 place-items-center rounded-xl border transition-transform duration-300 ${
                  isOpen
                    ? "border-[#10B981]/40 bg-[#10B981]/20 text-[#10B981] rotate-180"
                    : "border-white/10 bg-white/5 text-[#A9C2BC]"
                }`}
              >
                <ChevronDown size={18} />
              </span>
            </button>

            {isOpen && (
              <div
                id={faq.id}
                role="region"
                aria-labelledby={`header-${faq.id}`}
                className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm font-semibold text-[#A9C2BC] leading-relaxed border-t border-white/5 pt-3 animate-in fade-in-50 duration-200"
              >
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  status: "PAYMENT_SUBMITTED" | "UNDER_REVIEW";
  method?: "MANUAL" | "PAYBOST";
  orderId?: string;
};

type StepState = "done" | "active" | "pending";
type Step = { label: string; state: StepState };

function StepRow({ label, state }: Step) {
  return (
    <li className="flex items-center gap-3">
      {state === "done" ? (
        <CheckCircle2 aria-hidden="true" className="shrink-0 text-emerald-400" size={18} />
      ) : state === "active" ? (
        <Loader2 aria-hidden="true" className="shrink-0 text-[#FFD0A5] motion-safe:animate-spin" size={18} />
      ) : (
        <span className="grid size-[18px] shrink-0 place-items-center">
          <span className="size-2 rounded-full border border-white/30" />
        </span>
      )}
      <span
        className={
          state === "pending"
            ? "text-xs sm:text-sm text-white/50"
            : state === "active"
              ? "text-xs sm:text-sm font-bold text-[#FFFDF4]"
              : "text-xs sm:text-sm text-white/80"
        }
      >
        {label}
      </span>
    </li>
  );
}

function VerifyingHero({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="relative grid size-16 sm:size-20 shrink-0 place-items-center">
      {/* Radar ping rings */}
      <span
        className="absolute inset-0 rounded-full border border-emerald-400/20 motion-safe:animate-ping"
        style={{ animationDuration: "2.4s" }}
      />
      <span
        className="absolute inset-[8px] rounded-full border border-emerald-400/25 motion-safe:animate-ping"
        style={{ animationDuration: "2.4s", animationDelay: "0.7s" }}
      />
      {/* Rotating tail spinner */}
      <span className="absolute inset-1 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 motion-safe:animate-spin" />
      {/* Core */}
      <span className="relative grid size-10 sm:size-12 place-items-center rounded-full border border-emerald-400/40 bg-emerald-950/60 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
        <Icon aria-hidden="true" size={20} />
      </span>
    </div>
  );
}

function ProgressTrack() {
  return (
    <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        style={{ animation: "pk-slide 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

export function PaymentReviewPending({ status, method = "MANUAL", orderId }: Props) {
  const router = useRouter();
  const isUnderReview = status === "UNDER_REVIEW";
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const refreshId = window.setInterval(() => router.refresh(), 8_000);
    return () => window.clearInterval(refreshId);
  }, [router]);

  async function payAnotherWay() {
    setCancelling(true);
    try {
      await fetch("/api/payment/gateway/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId ? { orderId } : {}),
      });
    } catch {
      // Ignore: the refresh below reflects the true server state either way.
    }
    router.refresh();
  }

  const isOnline = method === "PAYBOST";

  const kicker = isOnline
    ? "Online payment"
    : isUnderReview
      ? "Verification in progress"
      : "Payment proof received";

  const title = isOnline
    ? "Confirming your payment — no action needed"
    : isUnderReview
      ? "Our finance team is verifying your deposit"
      : "Your payment proof is in the review queue";

  const description = isOnline
    ? "We're waiting for the payment gateway to confirm your transaction. This completes automatically in a few moments."
    : "Your payment proof is securely in our finance queue. The moment an administrator approves it, your hens activate automatically.";

  const steps: Step[] = isOnline
    ? [
        { label: "Payment started at gateway", state: "done" },
        { label: "Confirming transaction webhook", state: "active" },
        { label: "Activating your flock automatically", state: "pending" },
      ]
    : [
        { label: "Payment proof submitted", state: "done" },
        { label: isUnderReview ? "Finance team verifying deposit" : "Waiting for finance reviewer", state: "active" },
        { label: "Activating your flock", state: "pending" },
      ];

  return (
    <section
      aria-live="polite"
      style={{
        background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
        boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
      }}
      className="overflow-hidden rounded-3xl border-2 border-[#D8793F]/40 p-5 sm:p-7 text-white"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
        <VerifyingHero icon={isOnline ? Loader2 : ShieldCheck} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#FFD0A5]">
            <Sparkles aria-hidden="true" size={13} /> {kicker}
          </p>
          <h2 className="mt-1.5 text-lg sm:text-2xl font-black text-[#FFFDF4]">{title}</h2>
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#DCE8E8]">{description}</p>
        </div>
      </div>

      <ProgressTrack />

      <ol className="mt-5 grid gap-2.5">
        {steps.map((step) => (
          <StepRow key={step.label} label={step.label} state={step.state} />
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
        <span className="flex items-center gap-2 font-semibold text-emerald-300">
          <Clock3 aria-hidden="true" size={14} /> This page updates automatically — no need to refresh.
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {isOnline ? (
            <button
              type="button"
              onClick={payAnotherWay}
              disabled={cancelling}
              className="font-bold text-[#FFD0A5] hover:text-white underline underline-offset-4 cursor-pointer disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Payment didn't go through? Pay another way"}
            </button>
          ) : null}
          <a
            href="/dashboard/plans"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFFDF4] font-bold text-xs transition border border-white/15"
          >
            Buy More Hens
          </a>
          <a
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFFDF4] font-bold text-xs transition border border-white/15"
          >
            All Orders
          </a>
        </div>
      </div>
    </section>
  );
}


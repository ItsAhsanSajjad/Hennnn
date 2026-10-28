"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Zap } from "lucide-react";

export function PayOnlineButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startOnlinePayment() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/payment/gateway/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not start online payment. Please try again.");
        setPending(false);
        return;
      }
      // Redirect to the Paybost hosted checkout.
      window.location.href = data.url;
    } catch {
      setError("Could not reach the payment service. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2 w-full sm:w-auto">
      <button
        type="button"
        onClick={startOnlinePayment}
        disabled={pending}
        style={{
          background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
          boxShadow: "0 3px 0 #047857, 0 6px 16px rgba(16, 185, 129, 0.35)",
        }}
        className="w-full sm:w-auto min-h-12 px-6 py-3 rounded-2xl text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {pending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Redirecting to Gateway...</span>
          </>
        ) : (
          <>
            <Zap size={18} className="text-emerald-100" />
            <span>Pay Online Now</span>
            <ArrowRight size={16} />
          </>
        )}
      </button>

      {error ? (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-50 border border-rose-500/30 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in"
        >
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock3, Loader2, RefreshCw, X } from "lucide-react";

/**
 * Handles the Paybost return query params (?pay=success, ?pay=cancel).
 * Provides immediate visual feedback and bounded polling with manual fallback.
 */
export function OnlinePaymentReturn({ pay, orderId }: { pay?: string; orderId: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(Boolean(pay));
  const [pollingCount, setPollingCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialHandled = useRef(false);

  useEffect(() => {
    if (!pay || initialHandled.current) return;
    initialHandled.current = true;

    if (pay === "cancel") {
      void fetch("/api/payment/gateway/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).finally(() => {
        router.refresh();
      });
    }
  }, [pay, orderId, router]);

  // Bounded polling for success return (up to 6 times, every 2.5s)
  useEffect(() => {
    if (pay !== "success" || pollingCount >= 6) return;

    const timer = setTimeout(() => {
      setPollingCount((prev) => prev + 1);
      router.refresh();
    }, 2500);

    return () => clearTimeout(timer);
  }, [pay, pollingCount, router]);

  if (!visible || !pay) return null;

  function dismiss() {
    setVisible(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("pay");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch {
      // ignore
    }
  }

  function handleManualRefresh() {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  }

  if (pay === "cancel") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/90 p-4 text-amber-900 shadow-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-black text-amber-900">Online payment was cancelled</h4>
            <p className="text-xs text-amber-800/90 mt-0.5">
              No money was deducted. You can try online payment again or choose manual deposit via Easypaisa, JazzCash, or Bank Transfer below.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss message"
          className="size-7 rounded-lg text-amber-700 hover:bg-amber-100 flex items-center justify-center transition shrink-0 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  if (pay === "success") {
    return (
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/95 p-4 sm:p-5 text-emerald-950 shadow-md animate-in fade-in slide-in-from-top-2 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-emerald-950">
                  Payment Submitted Successfully!
                </h4>
                {pollingCount < 6 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900">
                    <Loader2 size={11} className="animate-spin" /> Verifying
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                We received your online payment and are waiting for the final webhook confirmation from the gateway. Your hens activate automatically as soon as it arrives.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notification"
            className="size-7 rounded-lg text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/20 text-xs">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
            <Clock3 size={13} /> Checking automatically ({Math.min(pollingCount, 6)}/6)...
          </span>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-black text-xs hover:bg-emerald-800 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Checking..." : "Refresh Status"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

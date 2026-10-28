"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  Receipt,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { cancelEggPayoutAction } from "@/server/actions/egg-markets";

export interface ActivePayoutItem {
  id: string;
  publicReference: string;
  eggQuantity: number;
  totalAmountPaisa: string | bigint;
  status: string;
  payoutMethod: "JAZZCASH" | "EASYPAISA";
  accountNumberMasked?: string | null;
  adminTransactionId?: string | null;
  rejectionReason?: string | null;
  createdAt: Date | string;
  submittedAt?: Date | string | null;
  processingAt?: Date | string | null;
  paidAt?: Date | string | null;
  market: {
    id: string;
    name: string;
    code: string;
    icon?: string | null;
    imagePath?: string | null;
  };
}

interface ActivePayoutsCardProps {
  payouts: ActivePayoutItem[];
  onRefresh?: () => void;
}

export function ActivePayoutsCard({ payouts, onRefresh }: ActivePayoutsCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  if (!payouts || payouts.length === 0) {
    return null;
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = (saleId: string) => {
    if (!window.confirm("Are you sure you want to cancel this payout request? Your reserved eggs will be returned to your balance.")) {
      return;
    }
    setActionError(null);
    setCancellingId(saleId);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("saleId", saleId);
      const result = await cancelEggPayoutAction({ status: "idle" }, formData);
      setCancellingId(null);
      if (result.status === "error") {
        setActionError(result.message || "Failed to cancel payout.");
      } else if (onRefresh) {
        onRefresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <h2 className="text-lg font-black text-white tracking-tight">
            Active Egg Payout Requests ({payouts.length})
          </h2>
        </div>
        <span className="text-xs text-[#8FA2B0] font-medium hidden sm:inline">
          Manual payment verification in progress
        </span>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid gap-4">
        {payouts.map((payout) => {
          const totalRs = Number(payout.totalAmountPaisa) / 100;
          const isProcessing = payout.status === "PROCESSING";
          const isPendingPayment = payout.status === "PENDING_PAYMENT";
          const isPaid = payout.status === "PAID" || payout.status === "COMPLETED";
          const isRejected = payout.status === "REJECTED";

          // Step computation: 1: Submitted, 2: Under Review (Processing), 3: Payment Sent, 4: Settled
          let activeStep = 1;
          if (isProcessing) activeStep = 2;
          if (isPaid) activeStep = 4;

          const methodLogo =
            payout.payoutMethod === "EASYPAISA"
              ? "/assets/payment-methods/easypaisa-logo.png"
              : "/assets/payment-methods/jazzcash-logo.svg";

          return (
            <div
              key={payout.id}
              style={{
                background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
                boxShadow: "0 12px 28px rgba(6, 26, 43, 0.4), 0 0 0 1px rgba(216, 121, 63, 0.25)",
              }}
              className="rounded-3xl border-2 border-[#D8793F]/40 p-5 sm:p-6 text-white transition-all hover:border-[#D8793F]/60"
            >
              {/* Card Top: Details & Amount */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="relative size-12 rounded-2xl overflow-hidden bg-[#061A2B] border border-[#D8793F]/30 shrink-0">
                    {payout.market.imagePath ? (
                      <Image
                        src={payout.market.imagePath}
                        alt={payout.market.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="size-full grid place-items-center text-[#F59B52] font-black text-base">
                        EG
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">{payout.market.name}</h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isProcessing
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : isPaid
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : isRejected
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {isProcessing
                          ? "Processing"
                          : isPaid
                          ? "Paid"
                          : isRejected
                          ? "Rejected"
                          : "Pending Admin Payment"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#8FA2B0]">
                      <span>Ref:</span>
                      <button
                        onClick={() => handleCopy(payout.publicReference, payout.id)}
                        className="font-mono font-bold text-[#FFD0A5] hover:text-white flex items-center gap-1 transition"
                        title="Click to copy reference"
                      >
                        {payout.publicReference}
                        <Copy size={11} className={copiedId === payout.id ? "text-emerald-400" : ""} />
                      </button>
                      <span>•</span>
                      <span>{new Date(payout.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between items-center">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold text-[#8FA2B0] uppercase block">
                      Payout Amount
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400">
                      PKR {totalRs.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#FFD0A5] bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 sm:mt-1">
                    {payout.eggQuantity.toLocaleString()} Eggs Reserved
                  </span>
                </div>
              </div>

              {/* Destination Account Info */}
              <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[#8FA2B0]">Payout Destination:</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10">
                    <div className="relative size-4">
                      <Image
                        src={methodLogo}
                        alt={payout.payoutMethod}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="font-bold text-white uppercase">{payout.payoutMethod}</span>
                    <span className="font-mono text-[#FFD0A5] font-semibold">
                      {payout.accountNumberMasked || "Account on file"}
                    </span>
                  </div>
                </div>

                {isPendingPayment && (
                  <button
                    onClick={() => handleCancel(payout.id)}
                    disabled={isPending && cancellingId === payout.id}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {isPending && cancellingId === payout.id ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Cancelling...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={12} /> Cancel & Return Eggs
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 4-Step Timeline */}
              <div className="pt-5">
                <div className="grid grid-cols-4 gap-2 text-center relative">
                  {/* Connecting Line */}
                  <div className="absolute top-4 left-[12%] right-[12%] h-0.5 bg-white/10 -z-0">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#F59B52] transition-all duration-500"
                      style={{
                        width:
                          activeStep === 1
                            ? "20%"
                            : activeStep === 2
                            ? "55%"
                            : activeStep === 3
                            ? "85%"
                            : "100%",
                      }}
                    />
                  </div>

                  {/* Step 1: Submitted */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 grid place-items-center shadow-lg font-bold text-xs">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-[11px] font-bold text-white mt-2">Submitted</span>
                    <span className="text-[9px] text-[#8FA2B0] hidden sm:block">
                      Eggs Reserved
                    </span>
                  </div>

                  {/* Step 2: Under Review */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`size-8 rounded-full grid place-items-center shadow-lg font-bold text-xs transition ${
                        activeStep >= 2
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : activeStep === 1
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          : "bg-white/10 text-white/40 border border-white/10"
                      }`}
                    >
                      {activeStep > 2 ? (
                        <CheckCircle2 size={16} />
                      ) : activeStep >= 1 ? (
                        <Clock size={16} />
                      ) : (
                        "2"
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white mt-2">Admin Queue</span>
                    <span className="text-[9px] text-[#8FA2B0] hidden sm:block">
                      {isProcessing ? "Processing Now" : "Queued"}
                    </span>
                  </div>

                  {/* Step 3: Manual Transfer */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`size-8 rounded-full grid place-items-center shadow-lg font-bold text-xs transition ${
                        activeStep >= 3
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : isProcessing
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          : "bg-white/10 text-white/40 border border-white/10"
                      }`}
                    >
                      {activeStep >= 3 ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Receipt size={16} />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white mt-2">Transfer</span>
                    <span className="text-[9px] text-[#8FA2B0] hidden sm:block">
                      {payout.payoutMethod}
                    </span>
                  </div>

                  {/* Step 4: Paid */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`size-8 rounded-full grid place-items-center shadow-lg font-bold text-xs transition ${
                        activeStep >= 4
                          ? "bg-emerald-500 text-black font-black"
                          : "bg-white/10 text-white/40 border border-white/10"
                      }`}
                    >
                      {activeStep >= 4 ? <CheckCircle2 size={16} /> : "4"}
                    </div>
                    <span className="text-[11px] font-bold text-white mt-2">Paid</span>
                    <span className="text-[9px] text-[#8FA2B0] hidden sm:block">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Admin Note / TID Display if available */}
                {payout.adminTransactionId && (
                  <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-medium">
                      Payment Reference / TID:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {payout.adminTransactionId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

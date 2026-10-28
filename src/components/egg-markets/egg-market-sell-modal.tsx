"use client";

import { useId, useState, useTransition } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Egg,
  Info,
  Loader2,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { sellEggsToMarketAction } from "@/server/actions/egg-markets";
import type { EggMarketWithEligibility } from "@/server/services/egg-market-service";

interface EggMarketSellModalProps {
  market: EggMarketWithEligibility | null;
  availableEggs: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EggMarketSellModal({
  market,
  availableEggs,
  isOpen,
  onClose,
  onSuccess,
}: EggMarketSellModalProps) {
  const [quantity, setQuantity] = useState<number | "">("");
  const [payoutMethod, setPayoutMethod] = useState<"JAZZCASH" | "EASYPAISA">("JAZZCASH");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    publicReference: string;
    eggQuantity: number;
    totalAmountPaisa: string;
    accountNumberMasked: string;
    payoutMethod: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formId = useId();

  if (!isOpen || !market) return null;

  const minEggs = market.minEggs;
  const maxEggs = market.maxEggs;
  const pricePerEggRs = market.pricePerEggRs;
  const maxSellable = Math.min(availableEggs, maxEggs);

  const numQuantity = typeof quantity === "number" ? quantity : 0;
  const isValidQuantity =
    numQuantity >= minEggs && numQuantity <= maxSellable && numQuantity <= availableEggs;
  const totalAmountRs = numQuantity * pricePerEggRs;

  // Phone validation helper
  const cleanPhone = accountNumber.replace(/\D/g, "");
  const cleanConfirm = confirmAccountNumber.replace(/\D/g, "");
  const isPhoneValid = cleanPhone.length === 11 && cleanPhone.startsWith("03");
  const isPhoneMatching = cleanPhone === cleanConfirm && cleanPhone.length > 0;
  const isNameValid = accountHolderName.trim().length >= 2;

  const handleQuickSelect = (type: "min" | "25" | "50" | "max") => {
    setError(null);
    if (type === "min") {
      setQuantity(minEggs);
    } else if (type === "25") {
      const val = Math.floor(availableEggs * 0.25);
      setQuantity(Math.max(minEggs, Math.min(val, maxSellable)));
    } else if (type === "50") {
      const val = Math.floor(availableEggs * 0.5);
      setQuantity(Math.max(minEggs, Math.min(val, maxSellable)));
    } else if (type === "max") {
      setQuantity(maxSellable);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setQuantity(parsed);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidQuantity) {
      if (numQuantity < minEggs) {
        setError(`Minimum quantity for ${market.name} is ${minEggs} eggs.`);
      } else if (numQuantity > maxEggs) {
        setError(`Maximum trade limit is ${maxEggs} eggs.`);
      } else if (numQuantity > availableEggs) {
        setError(`You only have ${availableEggs} eggs available.`);
      } else {
        setError("Please enter a valid whole egg quantity.");
      }
      return;
    }

    if (!isNameValid) {
      setError("Please enter a valid account holder title (at least 2 characters).");
      return;
    }

    if (!isPhoneValid) {
      setError("Please enter a valid 11-digit Pakistani mobile number (e.g., 03001234567).");
      return;
    }

    if (!isPhoneMatching) {
      setError("Account numbers do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please confirm your payout details checkbox before submitting.");
      return;
    }

    setError(null);
    const idempotencyKey = `egg-payout-${market.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("marketId", market.id);
      formData.set("eggQuantity", String(numQuantity));
      formData.set("payoutMethod", payoutMethod);
      formData.set("accountHolderName", accountHolderName.trim());
      formData.set("accountNumber", accountNumber.trim());
      formData.set("confirmAccountNumber", confirmAccountNumber.trim());
      formData.set("agreeTerms", "true");
      formData.set("idempotencyKey", idempotencyKey);

      const result = await sellEggsToMarketAction({ status: "idle" }, formData);
      if (result.status === "success") {
        const refMatch = result.message?.match(/Reference:\s*([A-Za-z0-9-]+)/);
        const ref = refMatch ? refMatch[1] : `EMS-${Date.now().toString(36).toUpperCase()}`;
        const payload = {
          publicReference: ref,
          eggQuantity: numQuantity,
          totalAmountPaisa: (BigInt(numQuantity) * market.pricePerEggPaisa).toString(),
          accountNumberMasked: `${cleanPhone.slice(0, 4)}••••${cleanPhone.slice(-3)}`,
          payoutMethod,
        };
        setSubmittedData(payload);
        if (onSuccess) onSuccess();
      } else {
        setError(result.message || "Failed to submit egg payout request.");
      }
    });
  };

  const resetAndClose = () => {
    setSubmittedData(null);
    setQuantity("");
    setAccountHolderName("");
    setAccountNumber("");
    setConfirmAccountNumber("");
    setAgreeTerms(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        style={{
          background: "linear-gradient(180deg, #0B253A 0%, #061A2B 100%)",
          boxShadow: "0 24px 60px rgba(6, 26, 43, 0.7), 0 0 0 1px rgba(216, 121, 63, 0.35)",
        }}
        className="relative w-full max-w-xl rounded-3xl border-2 border-[#D8793F]/40 p-6 sm:p-8 text-white my-8 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sell-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={resetAndClose}
          disabled={isPending}
          className="absolute top-5 right-5 size-9 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 grid place-items-center transition z-10"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {submittedData ? (
          /* Payout Submitted Screen (Queued State) */
          <div className="py-4 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="size-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 grid place-items-center mx-auto shadow-lg">
                <Clock size={34} className="animate-pulse" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                PENDING ADMIN PAYMENT
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Payout Request Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-[#DCE8E8] max-w-md mx-auto leading-relaxed">
                Your <strong className="text-[#FFD0A5]">{submittedData.eggQuantity.toLocaleString()} eggs</strong> have been safely reserved. An administrator is reviewing your request and will manually transfer PKR {(Number(submittedData.totalAmountPaisa) / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}.
              </p>
            </div>

            {/* Summary Details Box */}
            <div className="rounded-2xl bg-[#061A2B] border border-[#D8793F]/30 p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[#8FA2B0] font-medium">Reference Code</span>
                <button
                  onClick={() => handleCopy(submittedData.publicReference)}
                  className="font-mono font-black text-[#FFD0A5] hover:text-white flex items-center gap-1.5 transition text-sm"
                  title="Copy Reference"
                >
                  {submittedData.publicReference}
                  <Copy size={13} className={copiedRef ? "text-emerald-400" : ""} />
                </button>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[#8FA2B0] font-medium">Market Destination</span>
                <span className="font-bold text-white">{market.name}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[#8FA2B0] font-medium">Reserved Quantity</span>
                <span className="font-bold text-[#FFD0A5]">{submittedData.eggQuantity.toLocaleString()} Eggs</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[#8FA2B0] font-medium">Payout Method</span>
                <span className="font-bold text-white uppercase">{submittedData.payoutMethod}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[#8FA2B0] font-medium">Payout Account</span>
                <span className="font-mono font-bold text-white">{submittedData.accountNumberMasked}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-white">Total Expected PKR</span>
                <span className="text-lg font-black text-emerald-400">
                  PKR {(Number(submittedData.totalAmountPaisa) / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5 text-xs text-blue-200">
              <Info size={16} className="shrink-0 mt-0.5 text-blue-400" />
              <p className="leading-relaxed">
                You can track this payout in real-time under your <strong>Active Payout Requests</strong> timeline. Once payment is sent, the official Transaction ID will appear there.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={resetAndClose}
                style={{
                  background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                  boxShadow: "0 2px 0 #9E4A1A, 0 4px 14px rgba(216, 121, 63, 0.4)",
                }}
                className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:scale-[0.99] transition"
              >
                View Payout Status
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header with 16:9 Market Image */}
            <div className="flex items-start gap-4">
              <div className="relative size-16 sm:size-20 rounded-2xl overflow-hidden bg-[#061A2B] border border-[#D8793F]/40 shrink-0">
                {market.imagePath ? (
                  <Image
                    src={market.imagePath}
                    alt={market.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="size-full grid place-items-center text-[#F59B52] font-black text-xl">
                    EG
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D8793F]/25 text-[#FFD0A5] border border-[#D8793F]/40">
                    <Sparkles size={11} /> {market.name}
                  </span>
                  {market.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck size={11} /> Verified Buyer
                    </span>
                  )}
                </div>
                <h3 id="sell-modal-title" className="mt-1 text-xl sm:text-2xl font-black text-white">
                  Sell to {market.name}
                </h3>
                <p className="text-xs text-[#8FA2B0]">
                  Fixed rate of{" "}
                  <strong className="text-emerald-400 font-black">
                    PKR {pricePerEggRs.toFixed(2)} / egg
                  </strong>{" "}
                  • Order bounds: {minEggs} to {maxEggs} eggs
                </p>
              </div>
            </div>

            {/* Available Eggs Bar */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#061A2B] border border-white/10 text-xs font-semibold">
              <span className="text-[#8FA2B0]">Your Live Egg Balance:</span>
              <span className="text-[#FFD0A5] font-black text-sm">
                {availableEggs.toLocaleString()} Eggs
              </span>
            </div>

            {/* Egg Quantity Input & Quick Select */}
            <div className="space-y-2">
              <label
                htmlFor={`${formId}-qty`}
                className="text-xs font-bold text-[#FFD0A5] uppercase tracking-wider block"
              >
                1. Egg Quantity to Sell
              </label>
              <div className="relative">
                <input
                  id={`${formId}-qty`}
                  type="number"
                  min={minEggs}
                  max={maxSellable}
                  step={1}
                  value={quantity}
                  onChange={handleQuantityChange}
                  placeholder={`Enter between ${minEggs} and ${maxSellable}`}
                  disabled={isPending}
                  className="w-full rounded-2xl bg-[#061A2B] border-2 border-[#D8793F]/40 px-4 py-3 text-base font-bold text-white placeholder:text-white/30 focus:border-[#F59B52] focus:outline-none focus:ring-2 focus:ring-[#F59B52]/20 transition"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8FA2B0]">
                  EGGS
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickSelect("min")}
                  disabled={isPending}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold bg-white/10 text-[#FFD0A5] hover:bg-white/15 active:scale-95 transition border border-white/10 text-center"
                >
                  Min ({minEggs})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect("25")}
                  disabled={isPending || availableEggs * 0.25 < minEggs}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold bg-white/10 text-[#FFD0A5] hover:bg-white/15 active:scale-95 transition border border-white/10 text-center disabled:opacity-40"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect("50")}
                  disabled={isPending || availableEggs * 0.5 < minEggs}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold bg-white/10 text-[#FFD0A5] hover:bg-white/15 active:scale-95 transition border border-white/10 text-center disabled:opacity-40"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect("max")}
                  disabled={isPending || maxSellable < minEggs}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold bg-[#D8793F]/30 text-[#FFD0A5] hover:bg-[#D8793F]/40 active:scale-95 transition border border-[#D8793F]/50 text-center disabled:opacity-40"
                >
                  Max ({maxSellable})
                </button>
              </div>
            </div>

            {/* Live Calculation Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-300 uppercase block">
                  Expected Manual Cash Payout
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  PKR {totalAmountRs.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-xs font-bold text-[#FFD0A5]">
                {numQuantity} × PKR {pricePerEggRs.toFixed(2)}
              </span>
            </div>

            {/* Payout Method Selection (JazzCash / Easypaisa) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#FFD0A5] uppercase tracking-wider block">
                2. Select Payout Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* JazzCash Card */}
                <button
                  type="button"
                  onClick={() => setPayoutMethod("JAZZCASH")}
                  disabled={isPending}
                  className={`p-3.5 rounded-2xl border-2 transition flex items-center gap-3 text-left ${
                    payoutMethod === "JAZZCASH"
                      ? "bg-[#D8793F]/20 border-[#F59B52] shadow-lg shadow-[#D8793F]/20"
                      : "bg-[#061A2B] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="relative size-8 shrink-0">
                    <Image
                      src="/assets/payment-methods/jazzcash-logo.svg"
                      alt="JazzCash"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">JazzCash</span>
                    <span className="text-[10px] text-[#8FA2B0]">Mobile Account</span>
                  </div>
                </button>

                {/* Easypaisa Card */}
                <button
                  type="button"
                  onClick={() => setPayoutMethod("EASYPAISA")}
                  disabled={isPending}
                  className={`p-3.5 rounded-2xl border-2 transition flex items-center gap-3 text-left ${
                    payoutMethod === "EASYPAISA"
                      ? "bg-[#10B981]/20 border-emerald-400 shadow-lg shadow-emerald-500/20"
                      : "bg-[#061A2B] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="relative size-8 shrink-0">
                    <Image
                      src="/assets/payment-methods/easypaisa-logo.png"
                      alt="Easypaisa"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Easypaisa</span>
                    <span className="text-[10px] text-[#8FA2B0]">Mobile Wallet</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Title / Name */}
            <div className="space-y-1.5">
              <label
                htmlFor={`${formId}-name`}
                className="text-xs font-bold text-[#DCE8E8] uppercase tracking-wider block"
              >
                3. Account Holder Full Name (Title)
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                value={accountHolderName}
                onChange={(e) => {
                  setError(null);
                  setAccountHolderName(e.target.value);
                }}
                placeholder="e.g., Muhammad Ali"
                disabled={isPending}
                className="w-full rounded-2xl bg-[#061A2B] border border-white/15 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-white/30 focus:border-[#F59B52] focus:outline-none transition"
                required
              />
            </div>

            {/* Account Mobile Number & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor={`${formId}-number`}
                  className="text-xs font-bold text-[#DCE8E8] uppercase tracking-wider block"
                >
                  4. {payoutMethod} Number
                </label>
                <input
                  id={`${formId}-number`}
                  type="text"
                  maxLength={11}
                  value={accountNumber}
                  onChange={(e) => {
                    setError(null);
                    setAccountNumber(e.target.value);
                  }}
                  placeholder="03001234567"
                  disabled={isPending}
                  className="w-full rounded-2xl bg-[#061A2B] border border-white/15 px-4 py-2.5 text-sm font-mono font-bold text-white placeholder:text-white/30 focus:border-[#F59B52] focus:outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`${formId}-confirm`}
                  className="text-xs font-bold text-[#DCE8E8] uppercase tracking-wider block"
                >
                  Confirm Number
                </label>
                <input
                  id={`${formId}-confirm`}
                  type="text"
                  maxLength={11}
                  value={confirmAccountNumber}
                  onChange={(e) => {
                    setError(null);
                    setConfirmAccountNumber(e.target.value);
                  }}
                  placeholder="03001234567"
                  disabled={isPending}
                  className={`w-full rounded-2xl bg-[#061A2B] border px-4 py-2.5 text-sm font-mono font-bold text-white placeholder:text-white/30 focus:outline-none transition ${
                    confirmAccountNumber && !isPhoneMatching
                      ? "border-rose-500 focus:border-rose-500"
                      : "border-white/15 focus:border-[#F59B52]"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#DCE8E8] leading-relaxed select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setError(null);
                    setAgreeTerms(e.target.checked);
                  }}
                  disabled={isPending}
                  className="mt-0.5 size-4 rounded border-white/20 bg-[#061A2B] text-[#F59B52] focus:ring-[#F59B52]"
                />
                <span>
                  I confirm this <strong>{payoutMethod}</strong> account is registered in my name. I understand payouts to incorrect numbers cannot be refunded.
                </span>
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !isValidQuantity || !isPhoneMatching || !isNameValid || !agreeTerms}
              style={{
                background:
                  !isValidQuantity || !isPhoneMatching || !isNameValid || !agreeTerms
                    ? "rgba(255,255,255,0.1)"
                    : "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                boxShadow:
                  !isValidQuantity || !isPhoneMatching || !isNameValid || !agreeTerms
                    ? "none"
                    : "0 2px 0 #9E4A1A, 0 4px 16px rgba(216, 121, 63, 0.4)",
              }}
              className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Reserving Eggs & Submitting...</span>
                </>
              ) : (
                <>
                  <Banknote size={18} />
                  <span>Submit Payout Request (PKR {totalAmountRs.toLocaleString("en-PK")})</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

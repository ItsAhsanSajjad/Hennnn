"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { PaymentAccount } from "@prisma/client";
import {
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Loader2,
  Send,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  Wallet,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { initialActionState } from "@/server/actions/types";
import { submitPaymentAction } from "@/server/actions/phase2";
import { PaymentMethodLogo } from "@/components/payment/payment-method-logos";

type Preview = { url: string; name: string; size: number };

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getProviderLabel(provider: string, title?: string) {
  switch (provider) {
    case "JAZZCASH":
      return "JazzCash";
    case "EASYPAISA":
      return "Easypaisa";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    default:
      return title || provider.replaceAll("_", " ");
  }
}

function getProviderSubtitle(provider: string, bankName?: string | null) {
  if (bankName) return bankName;
  switch (provider) {
    case "JAZZCASH":
      return "Mobile Wallet / *786#";
    case "EASYPAISA":
      return "Mobile Wallet Account";
    case "BANK_TRANSFER":
      return "Direct Bank Deposit / IBAN";
    default:
      return "Manual Payment";
  }
}

export function PaymentSubmitForm({
  purchaseOrderId,
  accounts,
}: {
  purchaseOrderId: string;
  accounts: PaymentAccount[];
}) {
  const [state, action, pending] = useActionState(submitPaymentAction, initialActionState);
  const router = useRouter();

  const [selectedId, setSelectedId] = useState(accounts[0]?.id ?? "");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  function copyToClipboard(text: string, fieldName: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClientError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setClientError("Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.");
      if (inputRef.current) inputRef.current.value = "";
      setPreview(null);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setClientError(
        `Selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.`,
      );
      if (inputRef.current) inputRef.current.value = "";
      setPreview(null);
      return;
    }

    if (file.size === 0) {
      setClientError("Selected screenshot file is empty.");
      if (inputRef.current) inputRef.current.value = "";
      setPreview(null);
      return;
    }

    setPreview({ url: URL.createObjectURL(file), name: file.name, size: file.size });
  }

  function clearFile() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setClientError(null);
  }

  const selectedAccount = accounts.find((a) => a.id === selectedId) ?? accounts[0];
  const activeErrorMessage = clientError || (state.status === "error" ? state.message : null);

  return (
    <div className="space-y-6">
      {/* 1. Account Selector Grid */}
      {accounts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-[#17372F] flex items-center gap-1.5">
              <span>Select Deposit Method</span>
              <span className="text-[10px] font-bold text-[#8C3A14] bg-[#FFF8EC] border border-[#D8793F]/30 px-2 py-0.5 rounded-full">
                {accounts.length} Available
              </span>
            </label>
            <span className="text-[11px] font-semibold text-[#566D7E] hidden sm:inline">
              Instant account details update below
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((acc) => {
              const isSelected = acc.id === (selectedAccount?.id ?? "");
              const providerLabel = getProviderLabel(acc.provider, acc.accountTitle);
              const providerSub = getProviderSubtitle(acc.provider, acc.bankName);

              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedId(acc.id)}
                  aria-pressed={isSelected}
                  className={`group relative p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8793F] ${
                    isSelected
                      ? "bg-[#FFF8EC] border-[#D8793F] ring-2 ring-[#D8793F]/35 shadow-md shadow-[#D8793F]/10 -translate-y-0.5"
                      : "bg-[#FFFDF4] border-[#D8793F]/20 hover:border-[#D8793F]/45 hover:bg-[#FFF8EC]/60 hover:shadow-sm"
                  }`}
                >
                  {/* Top Row: Brand Logo & Selection Indicator */}
                  <div className="flex items-start justify-between gap-2 w-full">
                    <PaymentMethodLogo method={acc.provider} size="sm" />
                    <div className="flex items-center gap-1.5">
                      {acc.isVerified && (
                        <span
                          title="Verified Official Account"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-[9px] font-black uppercase tracking-wider"
                        >
                          <BadgeCheck size={11} className="text-emerald-600" />
                          <span className="hidden xs:inline">Verified</span>
                        </span>
                      )}
                      <div
                        className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "border-[#D8793F]/30 bg-white group-hover:border-[#D8793F]/60"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Info */}
                  <div className="min-w-0 w-full pt-1">
                    <h4 className="text-sm font-black text-[#17372F] truncate tracking-tight">
                      {providerLabel}
                    </h4>
                    <p className="text-[11px] font-semibold text-[#566D7E] truncate mt-0.5">
                      {providerSub}
                    </p>
                    <div className="mt-2 pt-2 border-t border-[#D8793F]/15 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#8C3A14] font-bold truncate">
                        {acc.accountIdentifierProtected}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[#D8793F]/30 bg-[#FFFDF4] p-6 text-center">
          <Info size={28} className="mx-auto text-[#8C3A14] mb-2 opacity-80" />
          <h4 className="text-sm font-black text-[#17372F]">No Manual Payment Accounts Configured</h4>
          <p className="text-xs text-[#566D7E] mt-1 max-w-sm mx-auto">
            Please contact an administrator to activate payment accounts or use the online payment gateway above.
          </p>
        </div>
      )}

      {/* 2. Selected Account Full Information Panel */}
      {selectedAccount && (
        <div className="rounded-3xl border-2 border-[#D8793F]/35 bg-[#FFF8EC] p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#D8793F]/25">
            <div className="flex items-center gap-3">
              <PaymentMethodLogo method={selectedAccount.provider} size="sm" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1">
                  <span>TRANSFER FUNDS TO</span>
                  {selectedAccount.isVerified && (
                    <span className="text-emerald-700 font-extrabold">· VERIFIED OFFICIAL</span>
                  )}
                </span>
                <h4 className="text-base sm:text-lg font-black text-[#17372F]">
                  {getProviderLabel(selectedAccount.provider, selectedAccount.accountTitle)}
                </h4>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-500/30">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Official Custody Account</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Account Title Strip */}
            <div className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-[#FFFDF4] border border-[#D8793F]/25 shadow-xs">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#566D7E]">
                  ACCOUNT TITLE
                </p>
                <p className="text-xs sm:text-sm font-black text-[#17372F] break-words mt-0.5">
                  {selectedAccount.accountTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(selectedAccount.accountTitle, "title")}
                aria-label="Copy account title"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/35 text-[#8C3A14] text-xs font-black flex items-center gap-1.5 transition hover:bg-[#D8793F]/20 active:scale-95 cursor-pointer shrink-0"
              >
                {copiedField === "title" ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Account / Phone Number Strip */}
            <div className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-[#FFFDF4] border border-[#D8793F]/25 shadow-xs">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#566D7E]">
                  {selectedAccount.provider === "BANK_TRANSFER"
                    ? "ACCOUNT NUMBER"
                    : "MOBILE WALLET NUMBER"}
                </p>
                <p className="text-sm sm:text-base font-mono font-black text-[#17372F] tracking-wide break-all mt-0.5">
                  {selectedAccount.accountIdentifierProtected}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(selectedAccount.accountIdentifierProtected, "number")
                }
                aria-label="Copy account number"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/35 text-[#8C3A14] text-xs font-black flex items-center gap-1.5 transition hover:bg-[#D8793F]/20 active:scale-95 cursor-pointer shrink-0"
              >
                {copiedField === "number" ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Bank Name if available */}
            {selectedAccount.bankName && (
              <div className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-[#FFFDF4] border border-[#D8793F]/25 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#566D7E]">
                    BANK / NETWORK NAME
                  </p>
                  <p className="text-xs sm:text-sm font-black text-[#17372F] truncate mt-0.5">
                    {selectedAccount.bankName}
                  </p>
                </div>
                <div className="size-8 rounded-xl bg-[#FFF8EC] text-[#8C3A14] flex items-center justify-center shrink-0 border border-[#D8793F]/20">
                  <Building2 size={16} />
                </div>
              </div>
            )}

            {/* IBAN if available */}
            {selectedAccount.iban && (
              <div className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-[#FFFDF4] border border-[#D8793F]/25 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#566D7E]">
                    IBAN (INTERNATIONAL BANK ACCOUNT)
                  </p>
                  <p className="text-xs sm:text-sm font-mono font-black text-[#17372F] break-all mt-0.5">
                    {selectedAccount.iban}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedAccount.iban!, "iban")}
                  aria-label="Copy IBAN"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/35 text-[#8C3A14] text-xs font-black flex items-center gap-1.5 transition hover:bg-[#D8793F]/20 active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedField === "iban" ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Instructions Box */}
          {selectedAccount.instructions && (
            <div className="p-3.5 rounded-2xl bg-[#FFFDF4]/80 border border-[#D8793F]/20 text-xs text-[#566D7E] leading-relaxed flex items-start gap-2.5">
              <Info size={16} className="text-[#8C3A14] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#17372F]">Deposit Instructions: </span>
                {selectedAccount.instructions}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Proof Submission Form */}
      <form action={action} className="space-y-4">
        <input type="hidden" name="purchaseOrderId" value={purchaseOrderId} />
        <input type="hidden" name="paymentAccountId" value={selectedAccount?.id ?? ""} />

        {activeErrorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-500/30 text-rose-800 text-xs font-bold leading-relaxed flex items-start gap-2.5">
            <X size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>{activeErrorMessage}</div>
          </div>
        )}

        {state.status === "success" && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/30 text-emerald-800 text-xs font-bold leading-relaxed flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {state.message}
          </div>
        )}

        {/* Transaction Reference Input */}
        <div>
          <label
            htmlFor="transactionReference"
            className="block text-xs font-black uppercase tracking-wider text-[#17372F] mb-1.5"
          >
            Transaction ID / TID (Optional)
          </label>
          <input
            id="transactionReference"
            name="transactionReference"
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. 02938491823 or TRX-99238"
            className="w-full min-h-12 rounded-2xl border border-[#D8793F]/30 bg-[#FFFDF4] px-4 text-sm font-semibold text-[#17372F] placeholder:text-[#566D7E]/50 focus:outline-none focus:ring-2 focus:ring-[#D8793F]/40"
          />
        </div>

        {/* Payment Screenshot Upload Zone */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-[#17372F] mb-1.5">
            Payment Screenshot <span className="text-rose-600">*</span>
          </label>
          <div className="rounded-2xl border-2 border-dashed border-[#D8793F]/35 bg-[#FFFDF4] p-4 sm:p-5">
            <input
              ref={inputRef}
              id="proofFile"
              name="proofFile"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              onChange={onFileChange}
              className="sr-only"
            />
            {preview ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt="Selected payment proof"
                  className="size-16 shrink-0 rounded-xl border border-[#D8793F]/30 object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-black text-[#17372F]">
                    {preview.name}
                  </p>
                  <p className="text-[11px] font-semibold text-[#566D7E] mt-0.5">
                    {(preview.size / 1024).toFixed(0)} KB · Ready to submit
                  </p>
                  <label
                    htmlFor="proofFile"
                    className="mt-1 inline-block cursor-pointer text-xs font-black text-[#D8793F] hover:underline"
                  >
                    Change image
                  </label>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove selected file"
                  className="size-8 shrink-0 rounded-lg bg-[#FFF8EC] border border-[#D8793F]/35 text-[#8C3A14] flex items-center justify-center transition hover:bg-[#D8793F]/20 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/30 text-[#D8793F] flex items-center justify-center shrink-0">
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-[#17372F]">
                      Upload payment screenshot
                    </p>
                    <p className="text-[11px] font-semibold text-[#566D7E]">
                      JPG, PNG or WEBP up to 5 MB
                    </p>
                  </div>
                </div>
                <label
                  htmlFor="proofFile"
                  className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#D8793F]/35 bg-[#FFF8EC] px-4 text-xs font-black uppercase tracking-wider text-[#17372F] transition hover:bg-[#D8793F]/15 active:scale-95"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Deposit Full-Width Gold/Copper Button */}
        <button
          type="submit"
          disabled={pending || accounts.length === 0 || !preview || !!clientError}
          style={{
            background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
            boxShadow: "0 3px 0 #8C3A14, 0 8px 20px rgba(216, 121, 63, 0.4)",
          }}
          className="w-full min-h-13 rounded-2xl py-3.5 px-6 font-black uppercase tracking-wider text-sm sm:text-base text-white flex items-center justify-center gap-2 hover:brightness-105 active:translate-y-0.5 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Uploading &amp; Verifying...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>CONFIRM DEPOSIT</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

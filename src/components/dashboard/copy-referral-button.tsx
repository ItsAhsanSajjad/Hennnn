"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyReferralButton({
  referralCode,
  appUrl,
  buttonLabel = "Copy Link",
  inline = true,
}: {
  referralCode: string;
  appUrl: string;
  buttonLabel?: string;
  inline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const referralUrl = useMemo(
    () => `${appUrl.replace(/\/$/, "")}/r/${referralCode}`,
    [appUrl, referralCode],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="w-full h-10 sm:h-11 rounded-xl sm:rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] px-3 sm:px-3.5 text-xs sm:text-sm font-semibold text-[#17372F] focus:outline-none focus:border-[#D8793F] truncate select-all box-border"
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: copied
              ? "linear-gradient(180deg, #2D9B78 0%, #1C7358 100%)"
              : "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
            boxShadow: copied ? "0 2px 0 #134E4A" : "0 2px 0 #8C3A14",
          }}
          className="shrink-0 h-10 sm:h-11 px-3 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-1.5 transition-all hover:brightness-105 active:translate-y-0.5 cursor-pointer shadow-xs whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check size={14} className="stroke-[2.5]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="stroke-[2.5]" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <code className="min-h-11 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-mist bg-ivory px-3 py-3 text-sm text-charcoal">
        {referralUrl}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-bold text-ivory hover:bg-forest/90"
      >
        <Copy aria-hidden="true" size={18} />
        {copied ? "Copied" : buttonLabel}
      </button>
    </div>
  );
}


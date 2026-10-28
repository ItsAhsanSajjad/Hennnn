import React from "react";
import Image from "next/image";

interface PaymentLogoTileProps {
  method: "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER" | "PAYBOST" | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Verified Official Payment Method Logo Component
 * Loads local official assets from /assets/payment-methods/
 * Renders inside a clean, neutral white/cream tile with object-fit: contain to preserve official brand proportions
 */
export function PaymentMethodLogo({
  method,
  size = "md",
  className = "",
}: PaymentLogoTileProps) {
  // Tile dimensions
  const tileClasses =
    size === "sm"
      ? "size-9 sm:size-10 p-1.5"
      : size === "lg"
        ? "w-16 h-14 sm:w-20 sm:h-16 p-2"
        : "w-14 h-12 sm:w-16 sm:h-14 p-2";

  switch (method) {
    case "EASYPAISA":
      return (
        <div
          className={`shrink-0 flex items-center justify-center rounded-xl bg-white border border-[#D8793F]/15 shadow-xs transition-transform duration-200 ${tileClasses} ${className}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/payment-methods/easypaisa-logo.png"
            alt="Easypaisa official logo"
            className="w-full h-full object-contain"
            width={120}
            height={40}
            loading="lazy"
          />
        </div>
      );

    case "JAZZCASH":
      return (
        <div
          className={`shrink-0 flex items-center justify-center rounded-xl bg-white border border-[#D8793F]/15 shadow-xs transition-transform duration-200 ${tileClasses} ${className}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/payment-methods/jazzcash-logo.svg"
            alt="JazzCash official logo"
            className="w-full h-full object-contain"
            width={120}
            height={40}
            loading="lazy"
          />
        </div>
      );

    case "BANK_TRANSFER":
      return (
        <div
          className={`shrink-0 flex items-center justify-center rounded-xl bg-[#FFFDF8] border border-[#D8793F]/20 shadow-xs transition-transform duration-200 ${tileClasses} ${className}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/payment-methods/bank-transfer-icon.svg"
            alt="Bank Transfer icon"
            className="w-full h-full object-contain"
            width={48}
            height={48}
            loading="lazy"
          />
        </div>
      );

    case "PAYBOST":
    case "PAY_ONLINE":
      return (
        <div
          className={`shrink-0 flex items-center justify-center rounded-xl bg-[#061A2B] border border-[#24D6B0]/30 shadow-xs transition-transform duration-200 ${tileClasses} ${className}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/payment-methods/paybost-logo.png"
            alt="PayBost official logo"
            className="w-full h-full object-contain brightness-105"
            width={140}
            height={40}
            loading="lazy"
          />
        </div>
      );

    default:
      return (
        <div
          className={`shrink-0 flex items-center justify-center rounded-xl bg-white border border-[#D8793F]/15 shadow-xs ${tileClasses} ${className}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/payment-methods/bank-transfer-icon.svg"
            alt="Payment method"
            className="w-full h-full object-contain"
            width={48}
            height={48}
          />
        </div>
      );
  }
}

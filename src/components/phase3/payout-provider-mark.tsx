import { Building2, Smartphone, WalletCards } from "lucide-react";
import type { PayoutMethodProvider } from "@prisma/client";

import { cn } from "@/lib/utilities/cn";
import { PaymentMethodLogo } from "@/components/payment/payment-method-logos";

export const payoutProviderLabels: Record<PayoutMethodProvider, string> = {
  EASYPAISA: "EasyPaisa",
  JAZZCASH: "JazzCash",
  BANK_TRANSFER: "Bank Transfer",
  OTHER: "Other Account",
};

export function PayoutProviderMark({
  provider,
  selected = false,
}: {
  provider: PayoutMethodProvider;
  selected?: boolean;
}) {
  if (provider === "EASYPAISA" || provider === "JAZZCASH" || provider === "BANK_TRANSFER") {
    return <PaymentMethodLogo method={provider} size="sm" className="shrink-0" />;
  }

  const Icon = provider === "OTHER" ? WalletCards : Smartphone;

  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black",
        selected
          ? "border-white/25 bg-white/15 text-white"
          : "border-[#D8793F]/20 bg-[#FFF8EC] text-[#8C3A14]",
      )}
      aria-hidden="true"
    >
      <Icon size={18} strokeWidth={2.2} />
    </span>
  );
}

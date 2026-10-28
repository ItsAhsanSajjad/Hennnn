import { cn } from "@/lib/utilities/cn";

const tones = {
  success: "border-[#10B981]/30 bg-[#10B981]/15 text-[#0A3323]",
  pending: "border-amber-500/40 bg-amber-50 text-amber-900",
  danger: "border-rose-500/30 bg-rose-50 text-rose-900",
  info: "border-sky-500/30 bg-sky-50 text-sky-900",
  neutral: "border-stone-300 bg-stone-100 text-stone-700",
};

export function StatusBadge({
  children,
  status,
  tone,
}: {
  children?: React.ReactNode;
  status?: string;
  tone?: keyof typeof tones;
}) {
  let resolvedTone: keyof typeof tones = tone || "neutral";
  let resolvedLabel = children;

  if (status) {
    const s = status.toUpperCase();
    if (["ACTIVE", "APPROVED", "CONFIRMED", "CREDITED", "DELIVERED", "PAID", "SUCCESSFUL"].includes(s)) {
      resolvedTone = tone || "success";
    } else if (["PENDING", "UNDER_REVIEW", "PAYMENT_SUBMITTED", "AWAITING_PAYMENT", "AWAITING_REVIEW", "PAYMENT_PROCESSING", "RECORDED"].includes(s)) {
      resolvedTone = tone || "pending";
    } else if (["REJECTED", "CANCELLED", "EXPIRED", "SUSPENDED", "DISABLED", "VOIDED", "FAILED"].includes(s)) {
      resolvedTone = tone || "danger";
    }
    if (!children) {
      resolvedLabel = status.replace(/_/g, " ");
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider",
        tones[resolvedTone],
      )}
    >
      {resolvedLabel}
    </span>
  );
}


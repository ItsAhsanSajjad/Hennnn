import { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon, PackageOpen, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionHref,
  actionLabel,
  actionOnClick,
  children,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-[#D8793F]/30 bg-[#FFFDF4]/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
      <div className="size-16 rounded-3xl bg-[#FFD0A5]/30 text-[#8C3A14] flex items-center justify-center border border-[#D8793F]/20 shadow-inner">
        <Icon size={28} />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base sm:text-lg font-black text-[#17372F]">{title}</h3>
        <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
          {description}
        </p>
      </div>

      {(actionHref || actionOnClick) && actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              style={{
                background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                boxShadow: "0 2px 0 #047857, 0 4px 12px rgba(16, 185, 129, 0.25)",
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl py-2.5 px-5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
            >
              {actionLabel} <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={actionOnClick}
              style={{
                background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                boxShadow: "0 2px 0 #047857, 0 4px 12px rgba(16, 185, 129, 0.25)",
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl py-2.5 px-5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
            >
              {actionLabel} <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

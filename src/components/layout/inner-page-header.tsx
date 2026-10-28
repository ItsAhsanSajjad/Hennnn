import Link from "next/link";
import { ArrowLeft, Banknote, ShoppingCart, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface InnerPageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: "cart" | "egg" | "arrow";
  backHref?: string;
  children?: ReactNode;
}

export function InnerPageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  actionIcon = "cart",
  children,
}: InnerPageHeaderProps) {
  return (
    <div className="w-full space-y-4 mb-4">
      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#D8793F]" /> GROWMETA FARM PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17372F] tracking-tight mt-1">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs sm:text-sm font-semibold text-[#566D7E] mt-0.5 max-w-xl">
              {subtitle}
            </p>
          ) : null}
        </div>

        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            style={{
              background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
              boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.25)",
            }}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition self-start sm:self-auto shrink-0 cursor-pointer"
          >
            {actionIcon === "cart" ? (
              <ShoppingCart size={15} />
            ) : actionIcon === "egg" ? (
              <Banknote size={15} />
            ) : (
              <ArrowLeft size={15} />
            )}
            {actionLabel}
          </Link>
        ) : null}
      </div>

      {children}
    </div>
  );
}

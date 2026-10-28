import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingCart, Users, Gift, Egg } from "lucide-react";

interface SubpageHeaderProps {
  title?: string;
  badge: string;
  backHref?: string;
  backLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: "arrow" | "cart" | "team" | "gift" | "egg";
}

export function SubpageHeader({
  badge,
  backHref = "/dashboard",
  backLabel = "Dashboard",
  actionHref,
  actionLabel,
  actionIcon = "arrow",
}: SubpageHeaderProps) {
  const getIcon = () => {
    switch (actionIcon) {
      case "cart":
        return <ShoppingCart size={13} />;
      case "team":
        return <Users size={13} />;
      case "gift":
        return <Gift size={13} />;
      case "egg":
        return <Egg size={13} />;
      default:
        return <ArrowRight size={13} />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#D8793F]/25 bg-[#FFFDF4] px-3.5 py-1.5 text-xs font-bold text-[#17372F] shadow-sm hover:bg-[#FFF8EC] hover:border-[#D8793F]/40 transition active:scale-95"
        >
          <ArrowLeft size={13} /> {backLabel}
        </Link>
        <span className="text-xs font-bold text-[#566D7E]/50">/</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/25 bg-[#10B981]/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#0A3323]">
          {badge}
        </span>
      </div>

      {/* Right: Contextual CTA if provided */}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          style={{
            background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
            boxShadow: "0 2px 0 #047857, 0 4px 12px rgba(16, 185, 129, 0.2)",
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition self-start sm:self-auto"
        >
          {actionLabel} {getIcon()}
        </Link>
      )}
    </div>
  );
}

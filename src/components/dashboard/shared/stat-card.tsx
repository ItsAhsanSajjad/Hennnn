import { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

export interface StatItem {
  label: string;
  value: string | number;
  subtext?: string;
  subtextColor?: "emerald" | "amber" | "neutral" | "copper";
  icon: LucideIcon;
  iconBg?: "emerald" | "copper" | "navy" | "amber";
  actionHref?: string;
  actionLabel?: string;
}

interface StatisticsStripProps {
  stats: StatItem[];
  ctaHref?: string;
  ctaLabel?: string;
  ariaLabel?: string;
}

export function StatisticsStrip({
  stats,
  ctaHref,
  ctaLabel,
  ariaLabel = "Statistics Overview",
}: StatisticsStripProps) {
  const getIconBgClass = (bg?: "emerald" | "copper" | "navy" | "amber") => {
    switch (bg) {
      case "emerald":
        return "bg-[#10B981]/15 text-[#0A3323]";
      case "navy":
        return "bg-[#0D3850]/10 text-[#09263A]";
      case "amber":
        return "bg-amber-100 text-amber-900";
      case "copper":
      default:
        return "bg-[#D8793F]/15 text-[#8C3A14]";
    }
  };

  const getSubtextColorClass = (color?: "emerald" | "amber" | "neutral" | "copper") => {
    switch (color) {
      case "emerald":
        return "text-[#10B981]";
      case "amber":
        return "text-amber-700";
      case "copper":
        return "text-[#8C3A14]";
      case "neutral":
      default:
        return "text-[#566D7E]";
    }
  };

  return (
    <section
      aria-label={ariaLabel}
      className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-6 shadow-[0_12px_28px_rgba(16,34,45,0.07)]"
    >
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${stats.length + (ctaHref ? 1 : 0)} gap-4 items-center`}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3.5 p-2 min-w-0 ${
                idx > 0 ? "border-t sm:border-t-0 sm:border-l border-[#D8793F]/15 sm:pl-4" : ""
              }`}
            >
              <div
                className={`size-11 sm:size-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconBgClass(
                  stat.iconBg
                )}`}
              >
                <Icon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14] truncate">
                  {stat.label}
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight truncate mt-0.5">
                  {stat.value}
                </h3>
                {stat.subtext && (
                  <p className={`text-[11px] font-bold truncate mt-0.5 ${getSubtextColorClass(stat.subtextColor)}`}>
                    {stat.subtext}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Global CTA button in stat strip if provided */}
        {ctaHref && ctaLabel && (
          <div className="pt-2 sm:pt-0 sm:border-l border-[#D8793F]/15 sm:pl-4 flex justify-end">
            <Link
              href={ctaHref}
              style={{
                background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 2px 0 #8C3A14, 0 4px 14px rgba(216, 121, 63, 0.25)",
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
            >
              {ctaLabel} <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

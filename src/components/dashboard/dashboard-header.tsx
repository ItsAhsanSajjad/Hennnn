import Link from "next/link";
import { BadgeCheck, Bell, Sparkles } from "lucide-react";
import { UserAvatar } from "@/components/layout/user-avatar";

export function DashboardHeader({
  username,
  status,
  isFirstVisit,
}: {
  username: string;
  status: string;
  isFirstVisit?: boolean;
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-2.5 sm:pb-4 mb-2.5 sm:mb-5 border-b border-[#D8793F]/15">
      <div className="min-w-0">
        {/* Row 1: Label & Status Badge aligned on one row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-[0.14em] text-[#8C3A14]">
            <Sparkles size={12} className="text-[#D8793F]" aria-hidden="true" />
            MY FARM
          </span>
          <span className="text-[#8C3A14]/40 font-bold text-xs">·</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {status === "ACTIVE" ? "Active" : status}
          </span>
        </div>

        {/* Row 2: 20-24px Welcome Heading with wrapping username */}
        <h1 className="mt-1 text-[20px] sm:text-2xl lg:text-3xl font-black tracking-tight text-[#17372F] leading-tight break-words">
          {isFirstVisit ? "Welcome," : "Welcome back,"}{" "}
          <span className="text-[#D8793F] inline-block">{username}</span>
        </h1>
      </div>

      {/* Top Right Profile & Notification Pill (Desktop/Tablet) */}
      <div className="hidden sm:flex items-center gap-3 self-start sm:self-auto shrink-0">
        {/* Notification Bell */}
        <Link
          href="/dashboard/notifications"
          aria-label="Notifications"
          className="relative grid size-11 place-items-center rounded-2xl border border-[#D8793F]/25 bg-white text-[#17372F] shadow-xs transition hover:border-[#D8793F] hover:bg-[#FFF8EC] hover:scale-105 active:scale-95"
        >
          <Bell size={18} aria-hidden="true" />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#D8793F]" />
        </Link>

        {/* Profile Card Pill */}
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-2xl border border-[#D8793F]/25 bg-white py-1.5 pl-2 pr-4 shadow-xs transition hover:border-[#D8793F] hover:bg-[#FFF8EC] hover:scale-[1.02] active:scale-98"
        >
          <UserAvatar username={username} size="sm" />
          <div className="text-left">
            <p className="flex items-center gap-1 text-xs font-black text-[#17372F]">
              <span className="truncate max-w-[120px]">{username}</span>
              <BadgeCheck size={14} className="text-[#D8793F]" />
            </p>
            <p className="text-[10px] font-bold text-[#D8793F]">View profile</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

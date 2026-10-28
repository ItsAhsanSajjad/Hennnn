"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Banknote,
  Bell,
  Bird,
  ChevronDown,
  ClipboardList,
  Egg,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  User,
  Users,
  WalletCards,
} from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { LogoutConfirmation } from "@/components/auth/logout-confirmation";

// 5 Primary reference items
const primaryNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Hens", href: "/dashboard/hens", icon: Bird },
  { label: "Buy Hens", href: "/dashboard/plans", icon: ShoppingCart },
  { label: "Sell Eggs", href: "/dashboard/sell-eggs", icon: Banknote },
  { label: "My Profile", href: "/dashboard/profile", icon: User },
] as const;

// Secondary items accessible in clean expandable section
const secondaryNavItems = [
  { label: "Egg Ledger", href: "/dashboard/egg-ledger", icon: Egg },
  { label: "Orders", href: "/dashboard/orders", icon: PackageCheck },
  { label: "Egg Sales", href: "/dashboard/egg-sales", icon: ClipboardList },
  { label: "Referrals", href: "/dashboard/referrals", icon: Users },
  { label: "Payout Methods", href: "/dashboard/payout-methods", icon: WalletCards },
  { label: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
] as const;

export function UserSidebar() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const hasActiveSecondary = secondaryNavItems.some((item) => isActive(item.href));

  return (
    <aside
      style={{
        background: "linear-gradient(180deg, #061A2B 0%, #082236 60%, #061A2B 100%)",
        borderRight: "1px solid rgba(216, 121, 63, 0.22)",
      }}
      className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col justify-between p-4 xl:p-5 text-[#FFFDF8] z-30 shadow-2xl overflow-y-auto select-none"
    >
      <div>
        {/* Brand Lockup */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D8793F]/20 min-w-0">
          <BrandMark size="sm" />
          <span className="inline-flex items-center gap-1 rounded-full border border-[#D8793F]/35 bg-[#D8793F]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FFD0A5] shrink-0">
            Member
          </span>
        </div>

        {/* Primary Navigation Links (5 Clean Items) */}
        <nav className="mt-5 space-y-1.5" aria-label="Sidebar Primary Navigation">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-black transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-[#F59B52] to-[#D8793F] text-white shadow-lg shadow-[#D8793F]/30 translate-x-1"
                    : "text-[#DCE8E8] hover:bg-[#0D3850]/70 hover:text-white"
                }`}
              >
                <span
                  className={`grid size-7 place-items-center rounded-lg transition-transform group-hover:scale-110 ${
                    active ? "text-white" : "text-[#F59B52]"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Expandable "More Tools" Trigger */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMore((prev) => !prev)}
              className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ${
                hasActiveSecondary || showMore
                  ? "bg-[#0D3850]/80 text-[#FFD0A5]"
                  : "text-[#DCE8E8] hover:bg-[#0D3850]/50 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-lg text-[#D8793F] transition-transform group-hover:scale-110">
                  <MoreHorizontal size={18} />
                </span>
                <span>More Tools</span>
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${showMore ? "rotate-180 text-[#D8793F]" : ""}`}
              />
            </button>

            {/* Expandable Menu */}
            {showMore || hasActiveSecondary ? (
              <div className="mt-1.5 ml-4 pl-3 border-l border-[#D8793F]/30 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#F59B52] to-[#D8793F] text-white shadow-xs"
                          : "text-[#DCE8E8] hover:bg-[#0D3850]/60 hover:text-white"
                      }`}
                    >
                      <Icon size={14} className={active ? "text-white" : "text-[#F59B52]"} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 pt-4 border-t border-[#D8793F]/20 space-y-3">
        {/* Friendly Poultry Status Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[#D8793F]/30 bg-gradient-to-br from-[#0D3850] to-[#082236] p-3 text-left">
          <div className="flex items-center gap-3 relative z-10">
            <div className="size-11 shrink-0 rounded-xl overflow-hidden border border-[#D8793F]/40 bg-[#FFF8EC] shadow-sm">
              <Image
                src="/dashboard/brown-hen-3d.jpg"
                alt="Happy Farming Hen"
                width={44}
                height={44}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#FFD0A5]">Happy farming!</p>
              <p className="text-[11px] font-semibold text-[#DCE8E8] truncate">
                Your farm is ready.
              </p>
            </div>
          </div>
        </div>

        {/* Farm Status Indicator */}
        <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-[#DCE8E8]">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#F59B52]" />
            Flock Live
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>

        {/* Logout Action */}
        <div className="pt-1">
          <LogoutConfirmation />
        </div>
      </div>
    </aside>
  );
}

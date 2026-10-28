"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { FloatingDock } from "@/components/layout/floating-dock";
import { NotificationBellIcon } from "@/components/layout/notification-bell-icon";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { UserTopDock } from "@/components/layout/user-top-dock";
import { UserAvatar } from "@/components/layout/user-avatar";
import { WelcomeWhatsAppModal } from "@/components/dashboard/welcome-whatsapp-modal";

export function UserPortalShell({
  children,
  userLabel,
}: {
  children: ReactNode;
  userLabel: string;
}) {
  const pathname = usePathname();
  const isDashboardHome = pathname === "/dashboard";

  if (isDashboardHome) {
    // Exact Dashboard Home Shell: Desktop Left Sidebar + Cream Workspace
    return (
      <div className="min-h-screen flex w-full bg-[#061A2B]">
        {/* Left Fixed Sidebar on Desktop */}
        <UserSidebar />

        {/* Main Content Workspace (Light Warm Sand/Porcelain) */}
        <div
          style={{
            background:
              "radial-gradient(60rem 45rem at 50% 10%, rgba(255, 208, 165, 0.35), transparent 70%), linear-gradient(180deg, #FFF8EC 0%, #F4E8D2 100%)",
          }}
          className="flex-1 min-w-0 min-h-screen flex flex-col text-[#10222D]"
        >
          {/* Balanced Top Bar for Mobile/Tablet (62-66px height) */}
          <header className="sticky top-0 z-20 grid lg:hidden grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-[#D8793F]/20 bg-[#061A2B] px-3 sm:px-4 py-2.5 min-h-[62px] max-h-[66px] text-white shadow-md select-none animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Left: Complete Official Brand */}
            <BrandMark size="sm" />

            {/* Right: Notification Bell (42px) & Account Avatar (42px) */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/notifications"
                aria-label="Notifications"
                style={{
                  background: "linear-gradient(135deg, rgba(16, 60, 88, 0.45) 0%, rgba(6, 26, 43, 0.8) 100%)",
                  border: "1px solid rgba(255, 208, 165, 0.25)",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.12)",
                }}
                className="relative size-[42px] rounded-xl grid place-items-center text-white hover:brightness-110 active:scale-[0.97] transition-all duration-200 shrink-0"
              >
                <NotificationBellIcon size={22} className="pointer-events-none select-none drop-shadow-xs" />
              </Link>
              <Link
                href="/dashboard/profile"
                aria-label="Farmer Profile"
                className="size-[42px] shrink-0 block hover:scale-[1.03] active:scale-[0.97] transition-transform duration-200"
              >
                <UserAvatar username={userLabel} size="header" />
              </Link>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="flex-1 w-full max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8 pb-[calc(86px+env(safe-area-inset-bottom))] lg:pb-12 min-w-0 box-border">
            {children}
          </main>

          {/* Floating Bottom Quick Action Dock */}
          <FloatingDock />

          {/* Welcome Modal */}
          <WelcomeWhatsAppModal />
        </div>
      </div>
    );
  }

  // Inner Member Portal Pages Shell: NO Sidebar, Floating Centered Top Dock + Centered Container + Floating Bottom Dock
  return (
    <div
      style={{
        background:
          "radial-gradient(70rem 50rem at 50% 0%, rgba(255, 208, 165, 0.4), transparent 75%), linear-gradient(180deg, #FFF8EC 0%, #F4E8D2 100%)",
      }}
      className="min-h-screen flex flex-col text-[#10222D] relative pb-[calc(86px+env(safe-area-inset-bottom))] sm:pb-28"
    >
      {/* Floating Centered Top Navigation Dock */}
      <UserTopDock />

      {/* Centered Main Inner Page Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 min-w-0 box-border">
        {children}
      </main>

      {/* Floating Bottom Quick Action Dock */}
      <FloatingDock />
    </div>
  );
}

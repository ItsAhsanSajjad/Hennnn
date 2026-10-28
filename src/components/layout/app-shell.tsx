import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { FloatingDock } from "@/components/layout/floating-dock";
import { UserBottomNav } from "@/components/layout/user-bottom-nav";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { WelcomeWhatsAppModal } from "@/components/dashboard/welcome-whatsapp-modal";
import { LogoutConfirmation } from "@/components/auth/logout-confirmation";

import { UserPortalShell } from "@/components/layout/user-portal-shell";

export function AppShell({
  children,
  nav,
  title,
  userLabel,
  variant = "admin",
}: {
  children: ReactNode;
  nav: readonly { label: string; href: string; icon: LucideIcon }[];
  title: string;
  userLabel: string;
  variant?: "admin" | "user";
}) {
  const isUser = variant === "user";

  if (isUser) {
    return <UserPortalShell userLabel={userLabel}>{children}</UserPortalShell>;
  }

  return (
    <div className="pak-dark min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-mist bg-surface px-4 py-5 lg:block">
        <BrandMark />
        <nav className="mt-8 grid gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-charcoal/75 transition-colors hover:bg-ivory hover:text-forest"
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
          <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <BrandMark compact />
            </div>
            <nav className="hidden lg:block" />
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-charcoal/60">{title}</p>
              <p className="text-sm font-black text-forest">{userLabel}</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-mist px-3 py-2 lg:hidden">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 min-w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md px-3 text-xs font-semibold text-charcoal/75 hover:bg-ivory hover:text-forest"
                >
                  <Icon aria-hidden="true" size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}


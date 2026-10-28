"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Banknote,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Egg,
  Home,
  LayoutPanelLeft,
  ListChecks,
  Menu,
  ReceiptText,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  Sprout,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { LogoutConfirmation } from "@/components/auth/logout-confirmation";
import { cn } from "@/lib/utilities/cn";

const icons: Record<string, LucideIcon> = {
  Home,
  Users,
  CreditCard,
  Banknote,
  Bell,
  WalletCards,
  Sprout,
  Egg,
  ListChecks,
  ReceiptText,
  PackageCheck,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Settings,
};

type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  group: string;
};

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function NavigationList({
  nav,
  compact,
  onNavigate,
}: {
  nav: readonly AdminNavItem[];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const grouped = useMemo(
    () =>
      nav.reduce<Record<string, AdminNavItem[]>>((groups, item) => {
        groups[item.group] ??= [];
        groups[item.group].push(item);
        return groups;
      }, {}),
    [nav],
  );

  return (
    <nav aria-label="Admin navigation" className="grid gap-5">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="grid gap-1">
          {!compact ? (
            <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-charcoal/45">
              {group}
            </p>
          ) : null}
          {items.map((item) => {
            const Icon = icons[item.icon] ?? LayoutPanelLeft;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={compact ? item.label : undefined}
                onClick={onNavigate}
                className={cn(
                  "group flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-offset-2",
                  compact ? "justify-center px-2" : "",
                  active
                    ? "bg-forest font-extrabold shadow-sm ring-1 ring-forest/30"
                    : "text-charcoal/70 hover:bg-ivory hover:text-forest",
                )}
                style={active ? { backgroundColor: "#0f5c4e", color: "#ffffff" } : undefined}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("shrink-0", active ? "text-white" : "")}
                  style={active ? { color: "#ffffff" } : undefined}
                  size={18}
                />
                {!compact ? (
                  <span
                    className={cn("truncate", active ? "text-white" : "")}
                    style={active ? { color: "#ffffff" } : undefined}
                  >
                    {item.label}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  children,
  nav,
  username,
  roleLabel,
}: {
  children: React.ReactNode;
  nav: readonly AdminNavItem[];
  username: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const currentItem = nav.find((item) => isActivePath(pathname, item.href));
  const currentLabel = currentItem?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-[#f5f8f7] text-charcoal">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-mist bg-white px-3 py-4 transition-[width] duration-200 lg:flex lg:flex-col",
          compact ? "w-20" : "w-[280px]",
        )}
      >
        <div
          className={cn(
            "flex min-h-11 items-center",
            compact ? "justify-center" : "justify-between gap-3 px-1",
          )}
        >
          <BrandMark compact={compact} />
          {!compact ? (
            <button
              type="button"
              onClick={() => setCompact(true)}
              aria-label="Collapse navigation"
              className="flex size-9 cursor-pointer items-center justify-center rounded-md text-charcoal/60 transition-colors hover:bg-ivory hover:text-forest"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
          ) : null}
        </div>
        {compact ? (
          <button
            type="button"
            onClick={() => setCompact(false)}
            aria-label="Expand navigation"
            className="mt-5 flex size-11 cursor-pointer items-center justify-center self-center rounded-md border border-mist text-charcoal/60 transition-colors hover:bg-ivory hover:text-forest"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        ) : (
          <p className="mt-7 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-charcoal/45">
            Management console
          </p>
        )}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <NavigationList nav={nav} compact={compact} />
        </div>
        <div className={cn("border-t border-mist pt-3", compact ? "grid gap-2" : "")}>
          {!compact ? (
            <div className="px-3 pb-3">
              <p className="truncate text-sm font-bold text-forest">{username}</p>
              <p className="mt-0.5 truncate text-xs text-charcoal/55">{roleLabel}</p>
            </div>
          ) : null}
          <LogoutConfirmation portal="admin" appearance="admin" compact={compact} />
        </div>
      </aside>

      <div
        className={cn("transition-[padding] duration-200", compact ? "lg:pl-20" : "lg:pl-[280px]")}
      >
        <header className="sticky top-0 z-30 border-b border-mist bg-white/95 backdrop-blur">
          <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin navigation"
              className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-mist text-charcoal/70 transition-colors hover:bg-ivory hover:text-forest lg:hidden"
            >
              <Menu aria-hidden="true" size={21} />
            </button>
            <div className="min-w-0 lg:flex-1">
              <div className="flex min-w-0 items-center gap-2 text-sm text-charcoal/50">
                <span className="hidden sm:inline">GrowMeta Egg Admin</span>
                <ChevronRight aria-hidden="true" className="hidden sm:block" size={15} />
                <span className="truncate font-semibold text-charcoal/75">{currentLabel}</span>
              </div>
            </div>
            <form action="/admin/search" className="hidden w-full max-w-md lg:block">
              <label className="sr-only" htmlFor="admin-global-search">
                Search operational records
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/45"
                  size={18}
                />
                <input
                  id="admin-global-search"
                  name="q"
                  type="search"
                  placeholder="Search users, orders, payments, or sales"
                  className="min-h-10 w-full rounded-md border border-mist bg-[#fbfcfc] py-2 pl-10 pr-3 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/45 focus:border-leaf"
                />
              </div>
            </form>
            <Link
              href="/admin/search"
              aria-label="Search operational records"
              className="flex size-11 cursor-pointer items-center justify-center rounded-md text-charcoal/65 transition-colors hover:bg-ivory hover:text-forest lg:hidden"
            >
              <Search aria-hidden="true" size={20} />
            </Link>
            <div className="hidden min-w-fit text-right sm:block">
              <p className="text-sm font-bold text-forest">{username}</p>
              <p className="text-xs text-charcoal/55">{roleLabel}</p>
            </div>
            <div className="lg:hidden">
              <LogoutConfirmation portal="admin" appearance="admin-icon" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
        >
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 cursor-pointer bg-charcoal/35"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-white px-4 py-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <BrandMark />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close admin navigation"
                className="flex size-11 cursor-pointer items-center justify-center rounded-md border border-mist text-charcoal/65 hover:bg-ivory hover:text-forest"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <p className="mt-7 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-charcoal/45">
              Management console
            </p>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <NavigationList nav={nav} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-mist px-3 pt-4">
              <p className="truncate text-sm font-bold text-forest">{username}</p>
              <p className="mt-0.5 truncate text-xs text-charcoal/55">{roleLabel}</p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, Bird, LayoutDashboard, ShoppingCart, UserRound } from "lucide-react";

const items = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard, featured: false },
  { label: "Buy Hens", href: "/dashboard/plans", icon: ShoppingCart, featured: false },
  { label: "Sell Eggs", href: "/dashboard/sell-eggs", icon: Banknote, featured: true },
  { label: "My Hens", href: "/dashboard/hens", icon: Bird, featured: false },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound, featured: false },
] as const;

export function UserBottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        background: "rgba(6, 26, 43, 0.96)",
        borderColor: "rgba(216, 121, 63, 0.35)",
        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.55), 0 -2px 10px rgba(216, 121, 63, 0.15)",
      }}
      className="fixed inset-x-3 bottom-2 z-40 rounded-3xl border px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.featured) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="flex cursor-pointer flex-col items-center gap-1"
              >
                <span
                  style={{
                    background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                    boxShadow: active
                      ? "0 0 0 4px rgba(216, 121, 63, 0.4), 0 10px 24px rgba(216, 121, 63, 0.65)"
                      : "0 8px 24px rgba(216, 121, 63, 0.5), 0 2px 0 #8C3A14",
                  }}
                  className="-mt-7 grid size-14 place-items-center rounded-full border-2 border-[#FFD0A5] text-white transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Icon aria-hidden="true" size={24} />
                </span>
                <span className="text-[10px] font-black text-[#FFD0A5]">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 px-1"
            >
              <span
                className={`grid size-8 place-items-center rounded-xl transition-colors duration-200 ${
                  active ? "bg-[#D8793F]/25 text-[#FFD0A5]" : "text-[#DCE8E8]/70"
                }`}
              >
                <Icon aria-hidden="true" size={19} />
              </span>
              <span
                className={`text-[10px] font-bold transition-colors duration-200 ${
                  active ? "text-[#FFD0A5]" : "text-[#DCE8E8]/70"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utilities/cn";

type UserNavigationItem = {
  label: string;
  href: string;
};

export function UserDesktopNav({ items }: { items: readonly UserNavigationItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-2 md:flex" aria-label="Dashboard navigation">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-offset-2",
              active
                ? "bg-[var(--surface-dark)] font-extrabold shadow-sm ring-1 ring-forest/30"
                : "text-charcoal/70 hover:bg-ivory hover:text-forest",
            )}
            style={active ? { backgroundColor: "#0f5c4e", color: "#ffffff" } : undefined}
          >
            <span style={active ? { color: "#ffffff" } : undefined}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

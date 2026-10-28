import Link from "next/link";
import { LogIn, Menu, UserPlus } from "lucide-react";

import { publicNavigation } from "@/config/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import { ButtonLink } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/90 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex min-h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-5 text-sm font-semibold xl:flex">
          {publicNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="pak-nav-link cursor-pointer">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/sign-in" variant="ghost" className="hidden sm:inline-flex">
            <LogIn aria-hidden="true" size={18} />
            Login
          </ButtonLink>
          <ButtonLink href="/sign-up" className="hidden min-w-36 sm:inline-flex">
            <UserPlus aria-hidden="true" size={18} />
            Create account
          </ButtonLink>
          <details className="relative xl:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-md border border-line bg-surface-2 text-content marker:content-none">
              <Menu aria-hidden="true" size={20} />
              <span className="sr-only">Open navigation</span>
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 grid w-60 gap-1 rounded-lg border border-line bg-elevated p-2 shadow-soft">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pak-quiet-button flex min-h-11 items-center rounded-md px-3 text-sm font-semibold"
                >
                  {item.label}
                </Link>
              ))}
              <ButtonLink href="/sign-up" className="mt-1">
                Create account
              </ButtonLink>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

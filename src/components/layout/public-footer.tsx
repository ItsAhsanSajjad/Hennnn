import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { brand } from "@/config/brand";
import { publicNavigation } from "@/config/navigation";

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <BrandMark />
          <p className="mt-3 max-w-md text-sm leading-6 text-charcoal/65">{brand.description}</p>
          <p className="mt-5 text-xs font-semibold text-charcoal/55">
            Official domain: grow-meta-egg.digital
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm font-semibold sm:grid-cols-3 lg:self-center">
          {publicNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="pak-nav-link cursor-pointer">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-mist">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-charcoal/55 sm:px-6 lg:px-8">
          {brand.disclaimer}
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, LayoutDashboard } from "lucide-react";

export function FloatingDock() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolled(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrolled(false);
      }, 1500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const isHomeActive = pathname === "/dashboard";
  const isHensActive =
    pathname === "/dashboard/hens" ||
    pathname.startsWith("/dashboard/hens/") ||
    pathname === "/dashboard/plans" ||
    pathname.startsWith("/dashboard/plans/") ||
    pathname.startsWith("/dashboard/orders/");
  const isSellEggsActive =
    pathname === "/dashboard/sell-eggs" ||
    pathname.startsWith("/dashboard/sell-eggs/") ||
    pathname === "/dashboard/egg-sales";

  return (
    <div
      className={`fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[min(calc(100%-24px),360px)] transition-all duration-300 pointer-events-auto select-none ${
        isScrolled ? "opacity-80 hover:opacity-100 scale-95" : "opacity-100 scale-100"
      }`}
      aria-label="Floating Quick Navigation"
    >
      <nav
        style={{
          background: "linear-gradient(180deg, #0A3323 0%, #062217 100%)",
          border: "2px solid rgba(216, 121, 63, 0.55)",
          boxShadow:
            "0 18px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 24px rgba(10, 51, 35, 0.4)",
        }}
        className="flex items-center justify-between gap-1 px-2 sm:px-3 py-1.5 rounded-full backdrop-blur-2xl"
      >
        {/* 1. Home Action */}
        <Link
          href="/dashboard"
          style={{
            color: isHomeActive ? "#FFD0A5" : "#FFFDF4",
            backgroundColor: isHomeActive ? "rgba(216, 121, 63, 0.28)" : "transparent",
            border: isHomeActive ? "1px solid rgba(245, 155, 82, 0.5)" : "1px solid transparent",
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95"
        >
          <span
            style={{ color: isHomeActive ? "#F59B52" : "#FFD0A5" }}
            className="grid size-5 place-items-center transition-transform"
          >
            <LayoutDashboard size={16} className="stroke-[2.2]" />
          </span>
          <span
            style={{ color: isHomeActive ? "#FFD0A5" : "#FFFDF4" }}
            className="text-xs sm:text-sm font-bold tracking-wide truncate"
          >
            Home
          </span>
          {isHomeActive && (
            <span
              style={{ backgroundColor: "#F59B52", boxShadow: "0 0 8px #F59B52" }}
              className="size-1.5 rounded-full shrink-0"
            />
          )}
        </Link>

        {/* 2. Central Elevated Hens Action with Circular Hen Mascot */}
        <Link
          href="/dashboard/hens"
          className="group relative -my-3 px-1 focus:outline-none shrink-0"
          aria-label="My Hens"
        >
          <div
            style={{
              background: isHensActive
                ? "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)"
                : "linear-gradient(135deg, #134E4A 0%, #0A3323 100%)",
              border: isHensActive
                ? "2px solid rgba(255, 255, 255, 0.6)"
                : "2px solid rgba(216, 121, 63, 0.55)",
              boxShadow: isHensActive
                ? "0 8px 24px rgba(216, 121, 63, 0.6), 0 0 0 3px #062217, 0 0 0 5px rgba(216, 121, 63, 0.45)"
                : "0 4px 14px rgba(0, 0, 0, 0.4), 0 0 0 3px #062217",
            }}
            className="flex items-center gap-1.5 pl-1.5 pr-3 sm:pr-4 py-1.5 rounded-full text-white transition-all duration-300 group-hover:scale-105 active:scale-95"
          >
            {/* Circular Hen Mascot Artwork */}
            <div className="size-7 sm:size-8 rounded-full overflow-hidden border-2 border-white/90 bg-[#FFF8EC] shrink-0 shadow-md">
              <Image
                src="/dashboard/brown-hen-3d.jpg"
                alt="Hens"
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            </div>
            <span
              style={{ color: "#FFFFFF" }}
              className="text-xs sm:text-sm font-bold tracking-wide drop-shadow-xs"
            >
              Hens
            </span>
          </div>
        </Link>

        {/* 3. Sell Eggs Action */}
        <Link
          href="/dashboard/sell-eggs"
          style={{
            color: isSellEggsActive ? "#FFD0A5" : "#FFFDF4",
            backgroundColor: isSellEggsActive ? "rgba(216, 121, 63, 0.28)" : "transparent",
            border: isSellEggsActive
              ? "1px solid rgba(245, 155, 82, 0.5)"
              : "1px solid transparent",
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/10 active:scale-95"
        >
          <span
            style={{ color: isSellEggsActive ? "#F59B52" : "#FFD0A5" }}
            className="grid size-5 place-items-center transition-transform"
          >
            <Banknote size={16} className="stroke-[2.2]" />
          </span>
          <span
            style={{ color: isSellEggsActive ? "#FFD0A5" : "#FFFDF4" }}
            className="text-xs sm:text-sm font-bold tracking-wide truncate"
          >
            Sell Eggs
          </span>
          {isSellEggsActive && (
            <span
              style={{ backgroundColor: "#F59B52", boxShadow: "0 0 8px #F59B52" }}
              className="size-1.5 rounded-full shrink-0"
            />
          )}
        </Link>
      </nav>

    </div>
  );
}

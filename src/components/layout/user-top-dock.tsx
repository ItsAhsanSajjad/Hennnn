"use client";

import Image from "next/image";
import Link from "next/link";

export function UserTopDock() {
  return (
    <header className="sticky top-3 z-40 flex justify-center px-2.5 sm:px-4 mb-4 select-none">
      <div
        style={{
          background: "linear-gradient(180deg, rgba(9, 38, 58, 0.94) 0%, rgba(6, 26, 43, 0.96) 100%)",
          border: "1.5px solid rgba(216, 121, 63, 0.38)",
          boxShadow:
            "0 12px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 16px rgba(216, 121, 63, 0.18)",
        }}
        className="grid grid-cols-[42px_minmax(0,1fr)_42px] items-center gap-2 px-2 py-1.5 rounded-full backdrop-blur-xl w-[min(calc(100%-20px),340px)] sm:w-[350px] shadow-2xl min-h-[54px]"
      >
        {/* Left: Home Button (42x42px) with 3D House Pictogram */}
        <Link
          href="/dashboard"
          aria-label="Home Dashboard"
          style={{
            background: "linear-gradient(135deg, rgba(245, 155, 82, 0.15) 0%, rgba(16, 60, 88, 0.45) 100%)",
            border: "1px solid rgba(255, 208, 165, 0.35)",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
          }}
          className="size-[42px] rounded-full grid place-items-center shrink-0 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Image
            src="/assets/navigation/topnav-home.webp"
            alt="Home"
            width={26}
            height={26}
            className="w-[26px] h-[26px] object-contain select-none pointer-events-none drop-shadow-sm"
            priority
          />
        </Link>

        {/* Center: Mathematically & Optically Centered Official Brand Lockup from Landing Page */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center hover:opacity-90 active:scale-98 transition min-w-0 px-1"
          aria-label="GrowMeta Egg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/growmeta-egg-lockup.png"
            alt="GrowMeta Egg"
            width={160}
            height={48}
            className="h-[34px] sm:h-[38px] w-auto max-w-[175px] object-contain select-none pointer-events-none drop-shadow-sm"
          />
        </Link>

        {/* Right: Farmer Profile Button (42x42px) with 3D User Bust Pictogram */}
        <Link
          href="/dashboard/profile"
          aria-label="Farmer Profile"
          style={{
            background: "linear-gradient(135deg, rgba(245, 155, 82, 0.15) 0%, rgba(16, 60, 88, 0.45) 100%)",
            border: "1px solid rgba(255, 208, 165, 0.35)",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
          }}
          className="size-[42px] rounded-full grid place-items-center shrink-0 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Image
            src="/assets/navigation/topnav-profile.webp"
            alt="Profile"
            width={26}
            height={26}
            className="w-[26px] h-[26px] object-contain select-none pointer-events-none drop-shadow-sm"
            priority
          />
        </Link>
      </div>
    </header>
  );
}

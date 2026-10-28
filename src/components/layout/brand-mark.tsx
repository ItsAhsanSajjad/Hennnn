import Link from "next/link";

import { brand } from "@/config/brand";

type BrandMarkProps = {
  compact?: boolean;
  iconOnly?: boolean;
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  href?: string;
};

export function GrowMetaEggIcon({
  size = 26,
  tone = "dark",
}: {
  size?: number;
  tone?: "light" | "dark";
}) {
  const primaryColor = tone === "light" ? "#008F52" : "#00FFA3";
  const innerVeinColor = tone === "light" ? "#FFFFFF" : "#061A2B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-[0_0_8px_rgba(0,255,163,0.35)]"
      aria-hidden="true"
    >
      {/* Outer Glowing Egg Contour with Forward Growth Arrow */}
      <path
        d="M28 5 C15.5 5 7.5 18 7.5 34 C7.5 47 16.5 53 28 53 C39.5 53 48.5 47 48.5 34 C48.5 27 46.5 21 42 15"
        stroke={primaryColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M34 16 L43 13 L45 22"
        stroke={primaryColor}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner Growth Leaf */}
      <path
        d="M15.5 40 C15.5 29 23.5 21 32.5 21 C30.5 32 22.5 41 15.5 40 Z"
        fill={primaryColor}
      />
      <path
        d="M15.5 40 C21.5 34 26.5 29 31.5 22"
        stroke={innerVeinColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandMark({
  iconOnly = false,
  size = "md",
  tone = "dark",
  href = "/",
}: BrandMarkProps) {
  const iconPx = size === "sm" ? 26 : size === "lg" ? 40 : 32;
  const targetHref = href;

  if (iconOnly) {
    return (
      <Link href={targetHref} aria-label={brand.name} className="inline-flex items-center shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/growmeta-egg-icon.png"
          alt={brand.name}
          width={iconPx}
          height={iconPx}
          className="size-auto object-contain shrink-0"
        />
      </Link>
    );
  }

  if (tone === "dark") {
    return (
      <Link
        href={targetHref}
        aria-label={brand.name}
        className="inline-flex items-center min-w-0 hover:opacity-95 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/growmeta-egg-lockup.png"
          alt={brand.name}
          width={size === "sm" ? 125 : size === "lg" ? 170 : 145}
          height={size === "sm" ? 36 : size === "lg" ? 52 : 44}
          className={`${
            size === "sm" ? "h-[28px] sm:h-[30px]" : size === "lg" ? "h-11 sm:h-12" : "h-9 sm:h-10"
          } w-auto object-contain select-none pointer-events-none drop-shadow-sm`}
        />
      </Link>
    );
  }

  return (
    <Link
      href={targetHref}
      aria-label={brand.name}
      className={`inline-flex items-center min-w-0 hover:opacity-95 transition-opacity ${
        size === "sm" ? "gap-[7px]" : size === "lg" ? "gap-2.5" : "gap-2"
      }`}
    >
      <GrowMetaEggIcon size={iconPx} tone={tone} />
      <span
        className={`font-black tracking-tight whitespace-nowrap truncate select-none ${
          size === "sm"
            ? "text-[13.5px] sm:text-[14px]"
            : size === "lg"
              ? "text-xl sm:text-2xl"
              : "text-base sm:text-lg"
        } ${tone === "light" ? "text-[#10222D]" : "text-[#FFFFFF]"}`}
      >
        GrowMeta <span className={tone === "light" ? "text-[#008F52]" : "text-[#00FFA3]"}>Egg</span>
      </span>
    </Link>
  );
}

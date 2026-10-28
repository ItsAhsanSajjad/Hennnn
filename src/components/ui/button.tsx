import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utilities/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "pak-gradient-button border-transparent font-bold focus-visible:outline-leaf",
  secondary:
    "bg-surface-2 text-content hover:bg-elevated border-line focus-visible:outline-leaf",
  ghost:
    "bg-transparent text-muted hover:bg-surface-2 hover:text-content border-transparent focus-visible:outline-leaf",
  danger:
    "bg-danger text-[#1b0605] font-bold hover:brightness-110 border-transparent focus-visible:outline-leaf",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-[background-color,filter,color,border-color] duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-[background-color,filter,color,border-color] duration-200",
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

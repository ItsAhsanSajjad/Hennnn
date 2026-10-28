"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utilities/cn";

export function PasswordInput({
  className,
  hasError,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { hasError?: boolean }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={cn(
          "min-h-11 w-full rounded-md border bg-[#0e1512] px-3 py-2 pr-12 text-base text-content shadow-sm transition-colors placeholder:text-faint focus:border-leaf focus:outline-none",
          hasError ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-md text-muted transition hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-leaf"
      >
        {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}

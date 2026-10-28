import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utilities/cn";

export function Field({
  label,
  name,
  error,
  children,
  hint,
}: {
  label: string;
  name: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="text-sm font-bold text-charcoal">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="text-sm text-charcoal/70">
          {hint}
        </p>
      ) : null}
      {error?.length ? (
        <p id={errorId} className="text-sm font-medium text-danger" role="alert">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  hasError,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-md border bg-[#0e1512] px-3 py-2 text-base text-content shadow-sm transition-colors placeholder:text-faint focus:border-leaf focus:outline-none",
        hasError ? "border-danger" : "border-line",
        className,
      )}
      {...props}
    />
  );
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full cursor-pointer rounded-md border border-line bg-[#0e1512] px-3 py-2 text-base text-content shadow-sm transition-colors focus:border-leaf focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function FormStatus({ state }: { state: { status: string; message?: string } }) {
  if (!state.message) return null;

  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        state.status === "success"
          ? "border-leaf/30 bg-leaf/10 text-leaf"
          : "border-danger/30 bg-danger/10 text-danger",
      )}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </div>
  );
}

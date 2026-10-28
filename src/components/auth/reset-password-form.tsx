"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole, RotateCcwKey } from "lucide-react";

import { resetPasswordAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialActionState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form action={formAction} className="grid gap-5">
      {state.message ? (
        <div
          className={`rounded-xl border p-3.5 text-sm font-semibold ${
            state.status === "success"
              ? "border-emerald-500/30 bg-emerald-50 text-emerald-800"
              : "border-red-500/30 bg-red-50 text-red-800"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </div>
      ) : null}

      <input type="hidden" name="token" value={token} />

      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
          New password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
            size={18}
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter new password"
            required
            className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-11 pr-12 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[#566D7E] transition hover:bg-black/5 hover:text-[#10222D]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {state.fieldErrors?.password?.[0] ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
          Confirm new password
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
            size={18}
          />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            required
            className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-11 pr-12 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[#566D7E] transition hover:bg-black/5 hover:text-[#10222D]"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {state.fieldErrors?.confirmPassword?.[0] ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.confirmPassword[0]}</p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className="gme-btn-copper mt-1">
        <RotateCcwKey aria-hidden="true" size={18} />
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

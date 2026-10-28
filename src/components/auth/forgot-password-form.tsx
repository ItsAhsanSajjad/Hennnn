"use client";

import { useActionState } from "react";
import { KeyRound, UserRound } from "lucide-react";

import { forgotPasswordAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialActionState);

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

      <div className="grid gap-1.5">
        <label htmlFor="identifier" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
          Username or Pakistani phone
        </label>
        <div className="relative">
          <UserRound
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
            size={18}
          />
          <input
            id="identifier"
            name="identifier"
            autoComplete="username"
            placeholder="e.g. 03001234567 or username"
            required
            className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-11 pr-4 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
          />
        </div>
        {state.fieldErrors?.identifier?.[0] ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.identifier[0]}</p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className="gme-btn-copper mt-1">
        <KeyRound aria-hidden="true" size={18} />
        {pending ? "Requesting..." : "Request reset instructions"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Phone, ShieldCheck, UserPlus, UserRound, Users } from "lucide-react";

import { saveQuickAccount, storePasswordCredential } from "@/lib/auth/quick-access";
import { initialActionState } from "@/server/actions/types";
import { registerAction } from "@/server/actions/auth";

export function SignUpForm({
  referralCode,
  inviterUsername,
}: {
  referralCode?: string;
  inviterUsername?: string;
}) {
  const [state, formAction, pending] = useActionState(registerAction, initialActionState);
  const [rememberAccount, setRememberAccount] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const credentialRef = useRef<{ username: string; password: string } | null>(null);
  const busy = pending || redirecting;

  useEffect(() => {
    if (state.status !== "success" || !state.redirectTo) return;
    const target = state.redirectTo;
    const cred = credentialRef.current;
    let cancelled = false;
    setRedirecting(true);

    if (rememberAccount && cred?.username && cred.password) {
      saveQuickAccount("customer", cred.username, cred.password);
    }

    async function finish() {
      if (cred?.username && cred.password) {
        await storePasswordCredential(cred.username, cred.password);
      }
      if (!cancelled) window.location.assign(target);
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [state, rememberAccount]);

  function captureCredential(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    credentialRef.current = {
      username: String(data.get("username") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    };
  }

  return (
    <form action={formAction} onSubmit={captureCredential} className="grid gap-4.5">
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

      {inviterUsername ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#D8793F]/30 bg-[#FFF8EC] p-3.5 text-xs text-[#8C3A14]">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[#D8793F]" size={18} />
          <p>
            Referral from <strong className="font-black text-[#10222D]">@{inviterUsername}</strong> is attached.
            Commission rewards activate with verified purchases.
          </p>
        </div>
      ) : null}

      {/* Username Field */}
      <div className="grid gap-1.5">
        <label htmlFor="username" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
          Username
        </label>
        <div className="relative">
          <UserRound
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
            size={18}
          />
          <input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="Choose a username"
            minLength={4}
            maxLength={24}
            required
            className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-11 pr-4 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
          />
        </div>
        {state.fieldErrors?.username?.[0] ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.username[0]}</p>
        ) : null}
      </div>

      {/* Pakistani Phone */}
      <div className="grid gap-1.5">
        <label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
          Pakistani phone number
        </label>
        <div className="relative">
          <Phone
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
            size={18}
          />
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="03001234567"
            minLength={11}
            maxLength={11}
            pattern="03[0-9]{9}"
            title="Enter an 11-digit Pakistani mobile number starting with 03."
            required
            className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-11 pr-4 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
          />
        </div>
        {state.fieldErrors?.phone?.[0] ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.phone[0]}</p>
        ) : null}
      </div>

      {/* Password Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
            Password
          </label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
              size={17}
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="2-20 chars"
              minLength={2}
              maxLength={20}
              required
              className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-10 pr-10 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[#566D7E] transition hover:bg-black/5 hover:text-[#10222D]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {state.fieldErrors?.password?.[0] ? (
            <p className="text-xs font-semibold text-red-600">{state.fieldErrors.password[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
            Confirm password
          </label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
              size={17}
            />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter password"
              minLength={2}
              maxLength={20}
              required
              className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-10 pr-10 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[#566D7E] transition hover:bg-black/5 hover:text-[#10222D]"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {state.fieldErrors?.confirmPassword?.[0] ? (
            <p className="text-xs font-semibold text-red-600">{state.fieldErrors.confirmPassword[0]}</p>
          ) : null}
        </div>
      </div>

      {/* Referral Code (Optional) */}
      <div className="grid gap-1.5">
        <label htmlFor="referralCode" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
          Referral code <span className="text-[10px] font-bold text-[#566D7E] lowercase">(optional)</span>
        </label>
        <div className="relative">
          <Users
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
            size={18}
          />
          <input
            id="referralCode"
            name="referralCode"
            defaultValue={referralCode}
            autoComplete="off"
            placeholder="e.g. GROW8841"
            className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-11 pr-4 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
          />
        </div>
        {state.fieldErrors?.referralCode?.[0] ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.referralCode[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2 text-xs">
        <label className="flex cursor-pointer items-center gap-2.5 font-bold text-[#566D7E]">
          <input
            type="checkbox"
            checked={rememberAccount}
            onChange={(event) => setRememberAccount(event.target.checked)}
            className="size-4 rounded accent-[#D8793F]"
          />
          <span>Remember this account for one-tap sign-in on this device</span>
        </label>
        <p className="text-[11px] leading-relaxed text-[#566D7E]">
          By registering, you agree to our{" "}
          <Link href="/legal/terms" className="font-bold text-[#D8793F] hover:underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="font-bold text-[#D8793F] hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        style={{
          background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
          boxShadow: "0 4px 0 #8C3A14, 0 12px 24px rgba(216, 121, 63, 0.35)",
          textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
        className="inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#FFD0A5] text-white text-base font-black cursor-pointer transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-50 mt-1"
      >
        <UserPlus aria-hidden="true" size={18} />
        {redirecting
          ? "Opening your dashboard…"
          : pending
            ? "Creating account..."
            : "Create Free Account"}
      </button>
    </form>
  );
}

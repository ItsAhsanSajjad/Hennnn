"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { AtSign, Eye, EyeOff, Loader2, LockKeyhole, LogIn, UserRound, X } from "lucide-react";

import {
  clearLegacyQuickAccounts,
  decodeSecret,
  readQuickAccounts,
  removeQuickAccount,
  saveQuickAccount,
  storePasswordCredential,
  type QuickAccount,
} from "@/lib/auth/quick-access";
import { adminLoginAction, loginAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

export function SignInForm({
  notice,
  callbackUrl,
  portal = "customer",
}: {
  notice?: string;
  callbackUrl?: string;
  portal?: "customer" | "admin";
}) {
  const action = portal === "admin" ? adminLoginAction : loginAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccount, setRememberAccount] = useState(true);
  const [quickAccounts, setQuickAccounts] = useState<QuickAccount[]>([]);
  const [activeQuickId, setActiveQuickId] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const busy = pending || redirecting;

  useEffect(() => {
    setQuickAccounts(readQuickAccounts(portal));
    clearLegacyQuickAccounts(portal);
  }, [portal]);

  useEffect(() => {
    if (state.status === "error") setActiveQuickId(null);
  }, [state]);

  useEffect(() => {
    if (state.status !== "success" || !state.redirectTo) return;
    const target = state.redirectTo;
    const value = identifier.trim();
    let cancelled = false;
    setRedirecting(true);

    if (rememberAccount && value && password) {
      saveQuickAccount(portal, value, password);
    }

    async function finish() {
      await storePasswordCredential(value, password);
      if (!cancelled) window.location.assign(target);
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [state, identifier, password, rememberAccount, portal]);

  function startQuickLogin(account: QuickAccount) {
    if (busy) return;
    const secret = decodeSecret(account.secret);
    setActiveQuickId(account.id);
    flushSync(() => {
      setIdentifier(account.id);
      setPassword(secret);
      setRememberAccount(true);
    });
    formRef.current?.requestSubmit();
  }

  function forgetAccount(id: string) {
    setQuickAccounts(removeQuickAccount(portal, id));
  }

  return (
    <form action={formAction} ref={formRef} className="grid gap-5">
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}

      {notice ? (
        <div className="rounded-xl border border-[#D8793F]/30 bg-[#FFF8EC] p-3.5 text-sm font-semibold text-[#8C3A14]">
          {notice}
        </div>
      ) : null}

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

      {quickAccounts.length ? (
        <section className="grid gap-2.5" aria-label="Quick access accounts">
          <p className="text-xs font-black uppercase tracking-wider text-[#D8793F]">
            Quick access — tap to login
          </p>
          <div className="grid gap-2">
            {quickAccounts.map((account) => {
              const active = activeQuickId === account.id && busy;
              return (
                <div key={account.id} className="relative">
                  <button
                    type="button"
                    onClick={() => startQuickLogin(account)}
                    disabled={busy}
                    aria-label={`Login as ${account.id}`}
                    title={`Login as ${account.id}`}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-[#D8793F]/30 bg-[#FFF8EC] py-2.5 pl-3 pr-12 text-left shadow-xs transition hover:border-[#D8793F] hover:bg-[#FFF3DF] focus-visible:border-[#D8793F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white shadow-xs">
                      <UserRound aria-hidden="true" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-[#10222D]">
                        {account.id}
                      </span>
                      <span className="block text-[11px] font-bold text-[#D8793F]">
                        {active ? "Logging in…" : "Tap to open your dashboard"}
                      </span>
                    </span>
                  </button>
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-[#D8793F]"
                    >
                      <Loader2 className="size-5 animate-spin" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => forgetAccount(account.id)}
                      disabled={busy}
                      aria-label={`Remove ${account.id} from quick access`}
                      title="Remove from this device"
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#566D7E] transition hover:bg-red-100 hover:text-red-700 disabled:opacity-40"
                    >
                      <X aria-hidden="true" size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#566D7E]">Or login below with another account.</p>
        </section>
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="identifier" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
          Username or Pakistani phone
        </label>
        <div className="relative">
          <AtSign
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566D7E]"
            size={18}
          />
          <input
            id="identifier"
            name="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
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

      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-[#10222D]">
            Password
          </label>
          {portal === "customer" ? (
            <Link
              href="/forgot-password"
              className="cursor-pointer text-xs font-extrabold text-[#D8793F] hover:text-[#8C3A14] hover:underline"
            >
              Forgot password?
            </Link>
          ) : null}
        </div>
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="min-h-[52px] w-full rounded-xl border border-[#10222D]/20 bg-white pl-11 pr-12 text-base text-[#10222D] placeholder:text-[#8C9BA5] shadow-xs transition-all focus:border-[#D8793F] focus:outline-none focus:ring-4 focus:ring-[#D8793F]/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[#566D7E] transition hover:bg-black/5 hover:text-[#10222D]"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
          </button>
        </div>
        {state.fieldErrors?.password?.[0] ? (
          <p className="text-xs font-semibold text-red-600">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-[#566D7E]">
        <input
          type="checkbox"
          checked={rememberAccount}
          onChange={(event) => setRememberAccount(event.target.checked)}
          className="size-4 rounded accent-[#D8793F]"
        />
        <span>Remember this account for one-tap login on this device</span>
      </label>

      <button
        type="submit"
        disabled={busy}
        style={{
          background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
          boxShadow: "0 4px 0 #8C3A14, 0 12px 24px rgba(216, 121, 63, 0.35)",
          textShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
        className="inline-flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#FFD0A5] text-white text-base font-black cursor-pointer transition hover:brightness-105 active:translate-y-0.5 disabled:opacity-50 mt-2"
      >
        <LogIn aria-hidden="true" size={18} />
        {busy ? "Logging in..." : "Login to Dashboard"}
      </button>
    </form>
  );
}

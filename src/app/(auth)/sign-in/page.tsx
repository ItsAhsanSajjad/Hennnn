import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { BrandMark } from "@/components/layout/brand-mark";
import { getSafePostLoginPath } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  registered?: string;
  reset?: string;
  signedOut?: string;
  callbackUrl?: string;
  next?: string;
}>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const notice = params.registered
    ? "Account created. Login to continue."
    : params.reset
      ? "Password updated. Login with your new password."
      : params.signedOut
        ? "You have been signed out."
        : undefined;
  const callbackUrl =
    getSafePostLoginPath(params.callbackUrl) ?? getSafePostLoginPath(params.next) ?? undefined;

  return (
    <main className="min-h-screen flex flex-col lg:flex-row w-full bg-[#061A2B]">
      {/* Left Visual Panel: 50% Desktop Split, Midnight Blue & Burnished Copper (Preserved Exactly on Desktop) */}
      <aside
        style={{
          background:
            "radial-gradient(45rem 40rem at 85% 15%, rgba(245, 155, 82, 0.15), transparent 60%), radial-gradient(40rem 35rem at 20% 70%, rgba(13, 56, 80, 0.8), transparent 60%), linear-gradient(180deg, #061A2B 0%, #09263A 50%, #061A2B 100%)",
        }}
        className="hidden lg:flex w-full lg:w-1/2 min-h-screen flex-col justify-between p-8 sm:p-12 lg:p-14 text-[#FFFDF8]"
      >
        <div>
          <div className="flex items-center justify-between">
            <BrandMark size="lg" />
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#D8793F]/15 border border-[#D8793F]/40 text-[#FFD0A5]">
              <Sparkles size={13} className="text-[#F59B52]" aria-hidden="true" />
              Poultry Platform
            </span>
          </div>

          <div className="mt-8 lg:mt-12 max-w-lg">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-[#FFFDF8]">
              Welcome back to your <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #FFD0A5 0%, #F59B52 50%, #D8793F 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 2px 4px rgba(216, 121, 63, 0.3))",
                }}
                className="font-serif italic font-extrabold inline-block"
              >
                growing flock.
              </span>
            </h2>
            <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-[#DCE8E8]/90">
              Login to monitor daily egg yield records, review active hen batches, and manage verified instant settlements in one protected ledger.
            </p>
          </div>
        </div>

        {/* Centerpiece: Organic Farm Image Frame + Floating Badge */}
        <div className="relative my-8 py-4 flex items-center justify-center">
          <div
            style={{
              borderRadius: "46% 54% 48% 52% / 58% 46% 54% 42%",
              boxShadow:
                "0 24px 48px rgba(0, 0, 0, 0.65), 0 8px 18px rgba(216, 121, 63, 0.25), inset 0 0 0 2px #FFD0A5",
            }}
            className="relative w-full max-w-[370px] aspect-[1.08] mx-auto overflow-hidden border-[6px] border-[#D8793F] border-b-[#8C3A14] border-r-[#8C3A14]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/hero-hen.jpg"
              alt="GrowMeta authentic farm flock"
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Floating Porcelain Badge */}
          <div
            style={{
              boxShadow: "0 12px 28px rgba(6, 26, 43, 0.45), 0 3px 0 #D8793F",
            }}
            className="inline-flex items-center gap-3 bg-[#FFF8EC] border border-[#D8793F]/35 rounded-2xl px-4 py-3 text-[#10222D] absolute -bottom-2 left-1/2 -translate-x-1/2 sm:left-12 sm:translate-x-0"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white shadow-md">
              <CheckCircle2 size={20} aria-hidden="true" />
            </span>
            <div className="text-left">
              <p className="text-xs font-black text-[#10222D]">Account Ready</p>
              <p className="text-[11px] font-bold text-[#D8793F]">Verified flock access</p>
            </div>
          </div>
        </div>

        {/* Bottom 3 Trust Cards */}
        <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#D8793F]/20">
          <div
            style={{ backdropFilter: "blur(10px)" }}
            className="bg-[#0D3850]/65 border border-[#D8793F]/25 border-b-[3px] border-b-[#061A2B] rounded-2xl p-3.5 text-center transition hover:-translate-y-0.5 hover:border-[#F59B52]/50"
          >
            <p className="text-xs font-black text-[#FFD0A5]">Simple</p>
            <p className="text-[11px] font-semibold text-[#DCE8E8] mt-0.5">One-tap login</p>
          </div>
          <div
            style={{ backdropFilter: "blur(10px)" }}
            className="bg-[#0D3850]/65 border border-[#D8793F]/25 border-b-[3px] border-b-[#061A2B] rounded-2xl p-3.5 text-center transition hover:-translate-y-0.5 hover:border-[#F59B52]/50"
          >
            <p className="text-xs font-black text-[#FFD0A5]">Secure</p>
            <p className="text-[11px] font-semibold text-[#DCE8E8] mt-0.5">Argon2 protection</p>
          </div>
          <div
            style={{ backdropFilter: "blur(10px)" }}
            className="bg-[#0D3850]/65 border border-[#D8793F]/25 border-b-[3px] border-b-[#061A2B] rounded-2xl p-3.5 text-center transition hover:-translate-y-0.5 hover:border-[#F59B52]/50"
          >
            <p className="text-xs font-black text-[#FFD0A5]">24/7</p>
            <p className="text-[11px] font-semibold text-[#DCE8E8] mt-0.5">Live yield tracking</p>
          </div>
        </div>
      </aside>

      {/* Right Form Panel / Main Mobile Container */}
      <section
        style={{
          background:
            "radial-gradient(50rem 40rem at 50% 30%, rgba(255, 208, 165, 0.4), transparent 70%), linear-gradient(180deg, #FFF8EC 0%, #F4E8D2 100%)",
        }}
        className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-14 text-[#10222D]"
      >
        {/* 1. Mobile Header */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-3 pt-2">
          <div className="lg:hidden">
            <BrandMark size="md" tone="light" />
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 border border-[#D8793F]/25 text-xs font-black uppercase tracking-wider text-[#8C3A14] hover:bg-white hover:text-[#D8793F] transition shadow-xs ml-auto"
          >
            <ArrowLeft size={13} aria-hidden="true" /> Back to home
          </Link>
        </div>

        {/* 2. Compact Visual Hero on Mobile & Tablet (< 1024px) */}
        <div className="lg:hidden w-full max-w-md mx-auto pt-2 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D8793F]/15 border border-[#D8793F]/35 text-[#8C3A14]">
              <Sparkles size={12} className="text-[#D8793F]" aria-hidden="true" />
              Poultry Platform
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black leading-tight text-[#10222D]">
            Welcome back to your <br />
            <span
              style={{
                background: "linear-gradient(135deg, #FFD0A5 0%, #F59B52 50%, #D8793F 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 2px 4px rgba(216, 121, 63, 0.3))",
              }}
              className="font-serif italic font-extrabold inline-block"
            >
              growing flock.
            </span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#566D7E] max-w-sm mx-auto">
            Login to monitor daily egg yield records, review active hen batches, and manage verified instant settlements.
          </p>

          {/* Centered Organic Farm Image Frame + Floating Badge */}
          <div className="relative my-6 py-2 flex items-center justify-center">
            <div
              style={{
                borderRadius: "46% 54% 48% 52% / 58% 46% 54% 42%",
                boxShadow: "0 16px 32px rgba(16, 34, 45, 0.15), 0 6px 14px rgba(216, 121, 63, 0.2), inset 0 0 0 2px #FFD0A5",
              }}
              className="relative w-[260px] sm:w-[300px] aspect-[1.08] mx-auto overflow-hidden border-[5px] border-[#D8793F] border-b-[#8C3A14] border-r-[#8C3A14]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marketing/hero-hen.jpg"
                alt="GrowMeta authentic farm flock"
                className="h-full w-full object-cover object-center"
              />
            </div>

            {/* Floating Porcelain Badge */}
            <div
              style={{
                boxShadow: "0 8px 20px rgba(6, 26, 43, 0.2), 0 2px 0 #D8793F",
              }}
              className="inline-flex items-center gap-2.5 bg-[#FFF8EC] border border-[#D8793F]/35 rounded-2xl px-3.5 py-2 text-[#10222D] absolute -bottom-3 left-1/2 -translate-x-1/2"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white shadow-xs">
                <CheckCircle2 size={15} aria-hidden="true" />
              </span>
              <div className="text-left">
                <p className="text-xs font-black text-[#10222D]">Account Ready</p>
                <p className="text-[10px] font-bold text-[#D8793F]">Verified flock access</p>
              </div>
            </div>
          </div>

          {/* 3 Trust Cards on Mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 mt-2">
            <div className="bg-[#FFFDF8] border border-[#D8793F]/25 border-b-[3px] border-b-[#D8793F] rounded-2xl p-2.5 text-center shadow-xs">
              <p className="text-xs font-black text-[#8C3A14]">Simple</p>
              <p className="text-[10px] font-semibold text-[#566D7E] mt-0.5">One-tap login</p>
            </div>
            <div className="bg-[#FFFDF8] border border-[#D8793F]/25 border-b-[3px] border-b-[#D8793F] rounded-2xl p-2.5 text-center shadow-xs">
              <p className="text-xs font-black text-[#8C3A14]">Secure</p>
              <p className="text-[10px] font-semibold text-[#566D7E] mt-0.5">Argon2 protect</p>
            </div>
            <div className="bg-[#FFFDF8] border border-[#D8793F]/25 border-b-[3px] border-b-[#D8793F] rounded-2xl p-2.5 text-center shadow-xs">
              <p className="text-xs font-black text-[#8C3A14]">24/7</p>
              <p className="text-[10px] font-semibold text-[#566D7E] mt-0.5">Live tracking</p>
            </div>
          </div>
        </div>

        {/* 3. Centered Form Card */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          <div
            style={{
              boxShadow: "0 24px 60px rgba(16, 34, 45, 0.10), 0 4px 0 rgba(216, 121, 63, 0.15)",
            }}
            className="bg-[#FFFDF8] border border-[#D8793F]/25 rounded-3xl p-5 sm:p-8"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8793F]/25 bg-[#D8793F]/10 px-3 py-1 text-xs font-black text-[#8C3A14]">
                <ShieldCheck aria-hidden="true" size={14} className="text-[#D8793F]" />
                Secure Access
              </span>
              <LockKeyhole size={16} className="text-[#566D7E]" aria-hidden="true" />
            </div>

            <h1 className="mt-4 text-2xl sm:text-3xl font-black text-[#10222D]">Welcome back</h1>
            <p className="mt-1 text-xs leading-relaxed text-[#566D7E]">
              Login with your username or Pakistani phone number to open your private workspace.
            </p>

            <div className="mt-5 text-left">
              <SignInForm notice={notice} callbackUrl={callbackUrl} />
            </div>

            <div className="mt-5 border-t border-[#10222D]/10 pt-5 text-center text-xs text-[#566D7E]">
              <p>
                New to GrowMeta Egg?{" "}
                <Link
                  href="/sign-up"
                  className="cursor-pointer font-black text-[#D8793F] hover:text-[#8C3A14] hover:underline"
                >
                  Create an account
                </Link>
              </p>
              <p className="mt-2">
                Administrator?{" "}
                <Link
                  href="/admin-login"
                  className="cursor-pointer font-bold text-[#10222D] hover:underline"
                >
                  Administrator Login
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] font-bold text-[#566D7E]">
            Protected by Argon2 password hashing &amp; verified session tokens.
          </p>
        </div>

        {/* 4. Footer */}
        <div className="w-full max-w-md mx-auto text-center text-[11px] text-[#566D7E]/80 pt-4 pb-2">
          © {new Date().getFullYear()} GrowMeta Egg. All rights reserved.
        </div>
      </section>
    </main>
  );
}

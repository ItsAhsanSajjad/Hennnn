import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { BrandMark } from "@/components/layout/brand-mark";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="gme-auth-right min-h-screen flex flex-col justify-between px-4 py-8 sm:px-6">
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-4">
        <BrandMark size="md" tone="light" />
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#D8793F]/25 text-xs font-black uppercase tracking-wider text-[#8C3A14] hover:bg-white hover:text-[#D8793F] transition shadow-xs"
        >
          <ArrowLeft size={13} aria-hidden="true" /> Back to login
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="gme-auth-card p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8793F]/25 bg-[#D8793F]/10 px-3 py-1 text-xs font-black text-[#8C3A14]">
            <KeyRound aria-hidden="true" size={14} className="text-[#D8793F]" />
            Account Recovery
          </span>

          <h1 className="mt-5 text-3xl font-black text-[#10222D]">Recover access</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#566D7E]">
            Reset architecture is ready. Enter your username or registered phone to receive reset instructions.
          </p>

          <div className="mt-6 text-left">
            <ForgotPasswordForm />
          </div>

          <div className="mt-6 border-t border-[#10222D]/10 pt-4 text-center text-xs text-[#566D7E]">
            <Link
              href="/sign-in"
              className="cursor-pointer font-black text-[#D8793F] hover:text-[#8C3A14] hover:underline"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto text-center text-[11px] text-[#566D7E]/80">
        © {new Date().getFullYear()} GrowMeta Egg. All rights reserved.
      </div>
    </main>
  );
}

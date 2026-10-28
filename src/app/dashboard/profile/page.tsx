import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  KeyRound,
  LogOut,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { LogoutConfirmation } from "@/components/auth/logout-confirmation";
import { CopyReferralButton } from "@/components/dashboard/copy-referral-button";
import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { env } from "@/lib/env/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const [referralCount, referredBy] = await Promise.all([
    prisma.referralRelationship.count({ where: { inviterId: user.id } }),
    prisma.referralRelationship.findUnique({
      where: { inviteeId: user.id },
      select: { inviter: { select: { username: true } } },
    }),
  ]);

  const inviterName = referredBy?.inviter?.username ?? null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Farmer Profile"
        subtitle="Manage your member account, referral link, security and official support channels."
      />

      {/* 2. Large Farmer Profile Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
          boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
        }}
        className="relative overflow-hidden rounded-3xl border-2 border-[#D8793F]/40 p-6 sm:p-8 text-white group"
        aria-label="Profile Hero"
      >
        <div className="absolute -right-8 -top-8 size-64 rounded-full border-2 border-[#D8793F]/15 pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 size-80 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* 3D Farmer Profile Avatar Badge */}
            <div className="size-20 sm:size-24 rounded-3xl overflow-hidden shadow-xl border-2 border-[#FFD0A5] bg-[#061A2B] shrink-0">
              <Image
                src="/dashboard/qa_profile.jpg"
                alt="Farmer Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D8793F]/25 text-[#FFD0A5] border border-[#D8793F]/40">
                <ShieldCheck size={12} /> VERIFIED FARMER
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#FFFDF4] flex items-center gap-2">
                {user.username}
                <BadgeCheck size={20} className="text-[#D8793F]" />
              </h2>
              <p className="text-xs sm:text-sm text-[#FFD0A5] font-semibold mt-0.5">
                {inviterName ? `Sponsor: @${inviterName}` : "Direct Registered Member"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              Account Status: {user.status}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Account Details & Referral Link (2 Columns) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6" aria-label="Account and Team">
        {/* Account Details Card */}
        <div
          style={{
            boxShadow: "0 12px 28px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.18)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                ACCOUNT INFORMATION
              </span>
              <span className="text-xs font-bold text-[#566D7E]">Role: {user.role}</span>
            </div>

            <h3 className="text-xl font-black text-[#17372F] mt-1">Your details</h3>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1">
                  <User size={12} /> Username
                </span>
                <p className="text-sm font-bold text-[#17372F] mt-1">{user.username}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1">
                  <Phone size={12} /> Mobile / WhatsApp
                </span>
                <p className="text-sm font-bold text-[#17372F] mt-1">{user.phoneE164 || "Not set"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1">
                  <Calendar size={12} /> Last Login
                </span>
                <p className="text-xs font-bold text-[#17372F] mt-1">
                  {formatDateTime(user.lastLoginAt)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1">
                  <ShieldCheck size={12} /> Security
                </span>
                <p className="text-xs font-bold text-emerald-700 mt-1">Password Protected</p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#17372F]/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#566D7E]">Manage session</span>
            <LogoutConfirmation appearance="profile" />
          </div>
        </div>

        {/* Referral Program Card */}
        <div
          style={{
            boxShadow: "0 12px 28px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.18)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                REFERRAL PROGRAM
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                {referralCount} Members Joined
              </span>
            </div>

            <h3 className="text-xl font-black text-[#17372F] mt-1">Your referral link</h3>
            <p className="text-xs text-[#566D7E] mt-1">
              Share your personal link to earn instant bonus eggs and commissions.
            </p>

            <div className="mt-4">
              <CopyReferralButton
                referralCode={user.referralCode}
                appUrl={env.NEXT_PUBLIC_APP_URL}
                buttonLabel="Copy Link"
                inline={true}
              />
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#17372F]/10 flex items-center justify-between">
            <span className="text-xs font-bold text-[#566D7E]">
              Code: <strong className="text-[#D8793F]">{user.referralCode}</strong>
            </span>
            <Link
              href="/dashboard/referrals"
              className="text-xs font-black text-[#D8793F] hover:text-[#8C3A14] transition"
            >
              View Full Team Tree →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Official WhatsApp Support (2x2 Grid) */}
      <section
        style={{
          boxShadow: "0 12px 28px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.18)",
        }}
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-6 lg:p-7"
        aria-label="Support Channels"
      >
        <div className="mb-3 sm:mb-4">
          {/* Row 1: Badge & 24/7 status */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#087A57] bg-[#E8F8EE] px-2.5 py-0.5 rounded-full border border-[#0F8A68]/30">
              <span className="size-1.5 rounded-full bg-[#25D366] animate-pulse" />
              WE ARE HERE TO HELP
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-[#566D7E] shrink-0">24/7</span>
          </div>
          {/* Row 2: WhatsApp logo & heading */}
          <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
            <div className="size-5 sm:size-5.5 rounded-full overflow-hidden shrink-0">
              <Image
                src="/assets/dashboard/support/whatsapp-official.svg"
                alt=""
                width={22}
                height={22}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#17372F]">WhatsApp Support</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
          {/* 1. Admin */}
          <a
            href="https://chat.whatsapp.com/growmeta-egg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Admin on WhatsApp"
            className="group grid grid-cols-[38px_minmax(0,1fr)] sm:grid-cols-[42px_minmax(0,1fr)] items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-[#0F8A68]/20 bg-gradient-to-br from-[#F6FCF8] to-[#EEF8F2] transition-all duration-200 hover:border-[#0F8A68]/45 hover:bg-[#E4F6EB] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[58px] sm:min-h-[62px] min-w-0 shadow-2xs"
          >
            <div className="size-[38px] sm:size-[42px] shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/assets/dashboard/support/support-admin.webp"
                alt=""
                width={42}
                height={42}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(6,38,58,0.08)]"
              />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[12.5px] sm:text-[13px] font-black text-[#0A3323] group-hover:text-[#087A57] transition-colors leading-tight">
                Admin
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[10.5px] font-semibold text-[#486B5E] group-hover:text-[#2D5345] leading-tight">
                Help desk
              </p>
            </div>
          </a>

          {/* 2. Owner */}
          <a
            href="https://chat.whatsapp.com/growmeta-egg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Owner on WhatsApp"
            className="group grid grid-cols-[38px_minmax(0,1fr)] sm:grid-cols-[42px_minmax(0,1fr)] items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-[#0F8A68]/20 bg-gradient-to-br from-[#F6FCF8] to-[#EEF8F2] transition-all duration-200 hover:border-[#0F8A68]/45 hover:bg-[#E4F6EB] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[58px] sm:min-h-[62px] min-w-0 shadow-2xs"
          >
            <div className="size-[38px] sm:size-[42px] shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/assets/dashboard/support/support-owner.webp"
                alt=""
                width={42}
                height={42}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(6,38,58,0.08)]"
              />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[12.5px] sm:text-[13px] font-black text-[#0A3323] group-hover:text-[#087A57] transition-colors leading-tight">
                Owner
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[10.5px] font-semibold text-[#486B5E] group-hover:text-[#2D5345] leading-tight">
                Direct help
              </p>
            </div>
          </a>

          {/* 3. Updates */}
          <a
            href="https://whatsapp.com/channel/growmeta-egg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Official Updates Channel on WhatsApp"
            className="group grid grid-cols-[38px_minmax(0,1fr)] sm:grid-cols-[42px_minmax(0,1fr)] items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-[#0F8A68]/20 bg-gradient-to-br from-[#F6FCF8] to-[#EEF8F2] transition-all duration-200 hover:border-[#0F8A68]/45 hover:bg-[#E4F6EB] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[58px] sm:min-h-[62px] min-w-0 shadow-2xs"
          >
            <div className="size-[38px] sm:size-[42px] shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/assets/dashboard/support/support-updates.webp"
                alt=""
                width={42}
                height={42}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(6,38,58,0.08)]"
              />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[12.5px] sm:text-[13px] font-black text-[#0A3323] group-hover:text-[#087A57] transition-colors leading-tight">
                Updates
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[10.5px] font-semibold text-[#486B5E] group-hover:text-[#2D5345] leading-tight">
                Official news
              </p>
            </div>
          </a>

          {/* 4. Community */}
          <a
            href="https://chat.whatsapp.com/growmeta-egg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join WhatsApp Community Group"
            className="group grid grid-cols-[38px_minmax(0,1fr)] sm:grid-cols-[42px_minmax(0,1fr)] items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-[#0F8A68]/20 bg-gradient-to-br from-[#F6FCF8] to-[#EEF8F2] transition-all duration-200 hover:border-[#0F8A68]/45 hover:bg-[#E4F6EB] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[58px] sm:min-h-[62px] min-w-0 shadow-2xs"
          >
            <div className="size-[38px] sm:size-[42px] shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/assets/dashboard/support/support-community.webp"
                alt=""
                width={42}
                height={42}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(6,38,58,0.08)]"
              />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[12.5px] sm:text-[13px] font-black text-[#0A3323] group-hover:text-[#087A57] transition-colors leading-tight">
                Community
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[10.5px] font-semibold text-[#486B5E] group-hover:text-[#2D5345] leading-tight">
                Member group
              </p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}

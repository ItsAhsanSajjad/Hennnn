import Image from "next/image";
import {
  Bird,
  CheckCircle2,
  Gift,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { CopyReferralButton } from "@/components/dashboard/copy-referral-button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { env } from "@/lib/env/server";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import {
  getReferralPurchaseBenefitConfig,
  referralPurchaseBenefitDefaults,
} from "@/server/services/referral-purchase-benefit";
import { getReferralDashboard } from "@/server/services/referral-reporting-service";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await requireUser();
  const [dashboard, config] = await Promise.all([
    getReferralDashboard(user.id),
    getReferralPurchaseBenefitConfig(),
  ]);
  const campaign = config ?? referralPurchaseBenefitDefaults;
  const referralUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/r/${user.referralCode}`;
  const encodedReferralUrl = encodeURIComponent(referralUrl);
  const shareText = encodeURIComponent("Join me on GrowMeta Egg to start earning daily eggs!");

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Referral Network"
        subtitle="Invite new farmers, earn bonus hens, and grow your flock collaboratively."
        actionLabel="Buy Hens"
        actionHref="/dashboard/plans"
        actionIcon="egg"
      />

      {/* 2. Feature Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
          boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
        }}
        className="relative overflow-hidden rounded-3xl border-2 border-[#D8793F]/40 p-6 sm:p-8 text-white group"
        aria-label="Referral Program Hero"
      >
        <div className="absolute -right-8 -top-8 size-64 rounded-full border-2 border-[#D8793F]/15 pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 size-80 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#D8793F]/25 text-[#FFD0A5] border border-[#D8793F]/40">
              <Sparkles size={13} /> GROW YOUR TEAM
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black text-[#FFFDF4] tracking-tight">
              Refer &amp; Earn Hens.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#DCE8E8] leading-relaxed max-w-lg">
              Earn {campaign.inviterHenRewardPercent}% in free hens for every flock your referrals
              purchase. Plus, your friends save{" "}
              {formatPaisa(campaign.inviteeDiscountPaisaPerHen)} per hen instantly.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#FFD0A5]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Automatic Bonus Credit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Verified Tracking
              </span>
            </div>
          </div>

          <div className="relative size-32 sm:size-44 shrink-0 self-center md:self-auto drop-shadow-2xl">
            <div className="absolute inset-0 rounded-full bg-[#D8793F]/20 blur-xl scale-90" />
            <Image
              src="/dashboard/brown-hen-3d.jpg"
              alt="Referral Program"
              width={180}
              height={180}
              className="relative z-10 w-full h-full object-cover rounded-3xl border-2 border-[#D8793F]/40 transition-transform group-hover:scale-105 duration-300"
            />
          </div>
        </div>
      </section>

      {/* 3. 4-Card Referral Metric Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Referral Metrics">
        {[
          {
            label: "TEAM MEMBERS",
            value: String(dashboard.members.length),
            unit: "Farmers",
            icon: Users,
          },
          {
            label: "HENS EARNED",
            value: String(dashboard.totalRewardHens),
            unit: "Active Hens",
            icon: Bird,
          },
          {
            label: "FRIEND DISCOUNT",
            value: formatPaisa(campaign.inviteeDiscountPaisaPerHen),
            unit: "Per Hen",
            icon: Gift,
          },
          {
            label: "REWARD RATE",
            value: `${campaign.inviterHenRewardPercent}%`,
            unit: "Of Purchases",
            icon: Sparkles,
          },
        ].map((metric) => {
          const IconComponent = metric.icon;
          return (
            <div
              key={metric.label}
              style={{
                boxShadow:
                  "0 12px 28px rgba(16, 34, 45, 0.06), 0 3px 0 rgba(216, 121, 63, 0.2)",
              }}
              className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                  {metric.label}
                </span>
                <div className="size-8 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/30 text-[#D8793F] grid place-items-center">
                  <IconComponent size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-[#17372F]">{metric.value}</p>
                <p className="text-[11px] font-semibold text-[#566D7E] mt-0.5">{metric.unit}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* 4. Referral Link & Social Sharing Card */}
      <section
        style={{
          boxShadow: "0 16px 36px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
        }}
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8"
        aria-label="Invite Link"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D8793F]/20">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
              UNIQUE REFERRAL LINK
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#17372F]">Your invite link</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-500/30 text-emerald-800 text-xs font-bold">
            {dashboard.members.length} Joined
          </span>
        </div>

        <div className="mt-5">
          <CopyReferralButton
            referralCode={user.referralCode}
            appUrl={env.NEXT_PUBLIC_APP_URL}
          />
        </div>

        <div className="mt-6 pt-5 border-t border-[#D8793F]/20">
          <p className="text-xs font-black uppercase tracking-wider text-[#17372F] mb-3">
            Quick Share on Social Media
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "WhatsApp",
                href: `https://wa.me/?text=${shareText}%20${encodedReferralUrl}`,
                icon: "/social/whatsapp.svg",
              },
              {
                label: "Telegram",
                href: `https://t.me/share/url?url=${encodedReferralUrl}&text=${shareText}`,
                icon: "/social/telegram.svg",
              },
              {
                label: "Facebook",
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodedReferralUrl}`,
                icon: "/social/facebook.svg",
              },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 p-3.5 rounded-2xl border border-[#D8793F]/30 bg-[#FFF8EC] font-black text-xs uppercase tracking-wider text-[#17372F] hover:bg-[#FFF3DF] hover:border-[#D8793F]/60 transition"
              >
                <Image src={social.icon} alt="" width={20} height={20} unoptimized />
                Share on {social.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Team Members & Commission History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Members */}
        <section
          style={{
            boxShadow:
              "0 14px 32px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6"
          aria-label="Your Team"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D8793F]/20">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                YOUR DIRECT NETWORK
              </span>
              <h4 className="text-lg font-black text-[#17372F]">Team Members</h4>
            </div>
            <Users size={18} className="text-[#D8793F]" />
          </div>

          {dashboard.members.length ? (
            <ul className="mt-4 divide-y divide-[#D8793F]/15">
              {dashboard.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-3 py-3.5 text-xs"
                >
                  <div>
                    <p className="font-black text-[#17372F]">{member.maskedIdentity}</p>
                    <p className="text-[#566D7E] mt-0.5">
                      Joined {formatDateTime(member.joinedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#17372F]">
                      {member.hensPurchased}
                    </p>
                    <p className="text-[10px] font-semibold text-[#566D7E]">
                      {member.hensPurchased === 1 ? "hen bought" : "hens bought"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Users}
                title="No referrals yet"
                message="People who join with your link will appear here."
              />
            </div>
          )}
        </section>

        {/* Hen Reward History */}
        <section
          style={{
            boxShadow:
              "0 14px 32px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6"
          aria-label="Reward History"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D8793F]/20">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                COMMISSION LOG
              </span>
              <h4 className="text-lg font-black text-[#17372F]">Hen Rewards</h4>
            </div>
            <Bird size={18} className="text-[#D8793F]" />
          </div>

          {dashboard.henRewards.length ? (
            <ul className="mt-4 divide-y divide-[#D8793F]/15">
              {dashboard.henRewards.map((reward) => (
                <li key={reward.id} className="py-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black text-[#17372F]">
                      +{reward.quantity} hen{reward.quantity === 1 ? "" : "s"} earned
                    </p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-500/30 text-emerald-800 text-[10px] font-bold">
                      CREDITED
                    </span>
                  </div>
                  <p className="mt-1 text-[#566D7E]">
                    Order #{reward.orderReference} · {formatDateTime(reward.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Gift}
                title="No commission yet"
                message="Hens appear here automatically when a referral purchase is approved."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

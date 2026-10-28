"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gift,
  Trophy,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Info,
  Award,
  Egg,
  LayoutDashboard,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  VIP_REWARD_TIERS,
  VIPRewardTier,
  calculateRewardProgress,
  getRemainingRewardInvestmentRs,
} from "@/lib/rewards/config";
import { submitMilestoneRewardClaimAction } from "@/server/actions/rewards";
import { formatDateTime } from "@/lib/utilities/format";

export interface RewardClaimRecord {
  id: string;
  milestoneKey: string;
  milestoneName: string;
  tierNumber: number;
  rewardEggUnits: number;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "COLLECTED" | "REJECTED";
  createdAt: string;
  collectedAt: string | null;
  ledgerEntryId: string | null;
}

interface RewardsClientProps {
  verifiedLevelOneInvestment: number;
  activeLevelOneMembers: number;
  totalGoldenEggRewards: number;
  collectibleGoldenEggs: number;
  rewardRecordCount: number;
  claims: RewardClaimRecord[];
}

export function RewardsClient({
  verifiedLevelOneInvestment,
  activeLevelOneMembers,
  totalGoldenEggRewards,
  collectibleGoldenEggs,
  rewardRecordCount,
  claims,
}: RewardsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [claimMessage, setClaimMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmModalTier, setConfirmModalTier] = useState<VIPRewardTier | null>(null);

  const claimedMilestoneKeys = new Set(
    claims
      .filter((c) => c.status === "COLLECTED" || c.status === "APPROVED")
      .map((c) => c.milestoneKey)
  );

  const pendingMilestoneKeys = new Set(
    claims
      .filter((c) => c.status === "PENDING" || c.status === "UNDER_REVIEW")
      .map((c) => c.milestoneKey)
  );

  // Identify next uncompleted milestone
  const nextMilestone =
    VIP_REWARD_TIERS.find((t) => !claimedMilestoneKeys.has(t.id) && !pendingMilestoneKeys.has(t.id)) ||
    VIP_REWARD_TIERS[VIP_REWARD_TIERS.length - 1];

  const nextProgress = calculateRewardProgress(
    verifiedLevelOneInvestment,
    nextMilestone.requiredLevel1InvestmentRs
  );
  const nextRemaining = getRemainingRewardInvestmentRs(
    verifiedLevelOneInvestment,
    nextMilestone.requiredLevel1InvestmentRs
  );
  const isNextUnlocked = verifiedLevelOneInvestment >= nextMilestone.requiredLevel1InvestmentRs;

  const handleCollectReward = (tier: VIPRewardTier) => {
    setClaimMessage(null);
    startTransition(async () => {
      const res = await submitMilestoneRewardClaimAction(tier.id);
      if (res.success) {
        setClaimMessage({ type: "success", text: res.message });
      } else {
        setClaimMessage({ type: "error", text: res.message });
      }
      setConfirmModalTier(null);
    });
  };

  return (
    <div className="w-full max-w-[1320px] mx-auto px-3 sm:px-6 space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Context Navigation Row */}
      <div className="flex items-center justify-between gap-3 py-2 border-b border-[#D8793F]/15">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-[#10B981]/15 text-[#0A3323]">
            <Trophy size={18} />
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#17372F]">
            Farm Rewards
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/team"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-[#D8793F]/25 bg-[#FFFDF4] px-4 py-2 text-xs font-bold text-[#17372F] shadow-sm hover:bg-[#FFF8EC] transition cursor-pointer min-h-[40px]"
          >
            <Users size={14} /> My Team
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-[#D8793F]/25 bg-[#FFFDF4] px-4 py-2 text-xs font-bold text-[#17372F] shadow-sm hover:bg-[#FFF8EC] transition cursor-pointer min-h-[40px]"
          >
            <LayoutDashboard size={14} /> Dashboard
          </Link>
        </div>
      </div>

      {/* Global Claim Toast Message */}
      {claimMessage && (
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${
            claimMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            {claimMessage.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{claimMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setClaimMessage(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Large Premium Rewards Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D8793F]/25 bg-gradient-to-br from-[#17372F] via-[#0D3850] to-[#0A221C] p-6 sm:p-10 md:p-12 shadow-[0_20px_45px_rgba(16,34,45,0.22)] text-white min-h-[300px] flex items-center">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[#10B981]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-[#D8793F]/20 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center w-full">
          {/* Left Hero Content (65%) */}
          <div className="space-y-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#A7F3D0]">
              <Sparkles size={14} className="text-[#10B981]" /> FARM REWARDS
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-[#FFFDF4]">
              Grow more. Earn more.
            </h1>

            <p className="text-sm sm:text-base md:text-lg font-semibold text-[#E6F4EA]/85 max-w-2xl leading-relaxed">
              Grow your Level 1 team investment to unlock approved Golden Egg rewards.
            </p>

            {/* Indicator Chips */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-bold text-[#E6F4EA]">
                <ShieldCheck size={14} className="text-[#10B981]" /> Level 1 team targets
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-bold text-[#E6F4EA]">
                <CheckCircle2 size={14} className="text-[#10B981]" /> Verified reward records
              </span>
            </div>
          </div>

          {/* Right Hero Visual (35%) */}
          <div className="flex justify-center lg:col-span-4">
            <div className="relative size-44 sm:size-56 md:size-64 rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-transparent p-4 grid place-items-center shadow-[0_20px_40px_rgba(0,0,0,0.35)] hover:scale-105 transition-transform duration-500">
              <Image
                src="/assets/dashboard/shortcuts/shortcut-rewards.webp"
                alt="GrowMeta Rewards Gift"
                width={240}
                height={240}
                priority
                className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three Separate Statistics Cards */}
      <section aria-label="Rewards Overview" className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {/* Card 1: Level 1 Investment */}
        <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_12px_28px_rgba(16,34,45,0.06)] flex items-center gap-4">
          <div className="size-13 sm:size-14 rounded-2xl bg-[#10B981]/15 text-[#0A3323] grid place-items-center shrink-0">
            <Users size={26} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              Level 1 Investment
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight truncate mt-0.5">
              PKR {verifiedLevelOneInvestment.toLocaleString()}
            </h3>
            <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
              {activeLevelOneMembers} active farmers
            </p>
          </div>
        </div>

        {/* Card 2: Rewards Earned */}
        <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_12px_28px_rgba(16,34,45,0.06)] flex items-center gap-4">
          <div className="size-13 sm:size-14 rounded-2xl bg-[#D8793F]/15 text-[#8C3A14] grid place-items-center shrink-0">
            <Gift size={26} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              Rewards Earned
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight truncate mt-0.5">
              {totalGoldenEggRewards.toLocaleString()} Eggs
            </h3>
            <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
              {rewardRecordCount} reward records
            </p>
          </div>
        </div>

        {/* Card 3: Ready to Collect */}
        <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_12px_28px_rgba(16,34,45,0.06)] flex items-center gap-4">
          <div className="size-13 sm:size-14 rounded-2xl bg-[#0D3850]/10 text-[#09263A] grid place-items-center shrink-0">
            <Award size={26} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              Ready to Collect
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight truncate mt-0.5">
              {collectibleGoldenEggs.toLocaleString()} Eggs
            </h3>
            <p className="text-xs font-semibold text-[#10B981] font-bold mt-0.5">
              Keep growing your farm
            </p>
          </div>
        </div>
      </section>

      {/* 4. Large Next Reward Goal Panel */}
      <section
        aria-label="Next Reward Goal"
        className="rounded-3xl border border-[#D8793F]/30 bg-gradient-to-br from-[#FFFDF4] to-[#FFF8EC] p-6 sm:p-8 md:p-10 shadow-[0_16px_36px_rgba(16,34,45,0.08)]"
      >
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          {/* Left Asset Visual */}
          <div className="flex justify-center lg:col-span-3">
            <div className="relative size-36 sm:size-44 rounded-3xl bg-[#FFF8EC] border border-[#D8793F]/20 p-3 grid place-items-center shadow-inner">
              <Image
                src="/assets/dashboard/shortcuts/shortcut-rewards.webp"
                alt="Next Reward Goal"
                width={160}
                height={160}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Center Goal Details & Progress */}
          <div className="space-y-4 lg:col-span-6">
            <div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8C3A14]">
                NEXT REWARD GOAL
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#17372F] tracking-tight mt-0.5">
                {nextMilestone.levelCode}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#566D7E] mt-1">
                {nextMilestone.description}
              </p>
            </div>

            {/* Target & Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#17372F]">
                <span>
                  PKR {verifiedLevelOneInvestment.toLocaleString()} / PKR{" "}
                  {nextMilestone.requiredLevel1InvestmentRs.toLocaleString()}
                </span>
                <span className="text-[#8C3A14] font-black">{nextProgress}% complete</span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-[#E5E1D8] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${nextProgress}%`,
                    background: isNextUnlocked
                      ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                      : "linear-gradient(90deg, #F59B52 0%, #D8793F 100%)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#566D7E]">
                {nextRemaining > 0 ? (
                  <span>PKR {nextRemaining.toLocaleString()} remaining to unlock</span>
                ) : (
                  <span className="text-[#10B981] font-bold">Goal Target Achieved!</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Reward Value & Action */}
          <div className="lg:col-span-3 flex flex-col justify-center items-center lg:items-end text-center lg:text-right space-y-3 border-t lg:border-t-0 lg:border-l border-[#D8793F]/15 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8C3A14]">
                REWARD VALUE
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#17372F] mt-0.5">
                {nextMilestone.goldenEggReward.toLocaleString()}
              </div>
              <span className="text-xs font-bold text-[#566D7E]">Golden Eggs</span>
            </div>

            {isNextUnlocked && !claimedMilestoneKeys.has(nextMilestone.id) ? (
              <button
                type="button"
                onClick={() => setConfirmModalTier(nextMilestone)}
                disabled={isPending}
                style={{
                  background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                  boxShadow: "0 2px 0 #047857, 0 6px 16px rgba(16, 185, 129, 0.3)",
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl py-3 px-6 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
              >
                <CheckCircle2 size={15} /> Collect Reward
              </button>
            ) : (
              <Link
                href="/dashboard/team"
                style={{
                  background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                  boxShadow: "0 2px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.25)",
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl py-3 px-6 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
              >
                Grow Level 1 team <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 5. Reward Journey Container (2-Column Grid on Desktop) */}
      <section aria-label="Reward Levels" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8793F]/15 pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              REWARD LEVELS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Your reward journey
            </h2>
          </div>
          <span className="text-xs font-bold text-[#566D7E]">
            Level 1 team targets
          </span>
        </div>

        {/* 2-Column Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {VIP_REWARD_TIERS.map((tier) => {
            const progress = calculateRewardProgress(
              verifiedLevelOneInvestment,
              tier.requiredLevel1InvestmentRs
            );
            const remaining = getRemainingRewardInvestmentRs(
              verifiedLevelOneInvestment,
              tier.requiredLevel1InvestmentRs
            );
            const isClaimed = claimedMilestoneKeys.has(tier.id);
            const isClaimPending = pendingMilestoneKeys.has(tier.id);
            const isUnlocked = verifiedLevelOneInvestment >= tier.requiredLevel1InvestmentRs && !isClaimed;

            return (
              <div
                key={tier.id}
                className={`rounded-3xl border p-6 transition-all duration-300 flex flex-col justify-between space-y-5 ${
                  isClaimed
                    ? "bg-[#F4FAF6] border-emerald-300 shadow-[0_10px_24px_rgba(16,185,129,0.08)]"
                    : isUnlocked
                    ? "bg-[#FFFDF4] border-[#10B981]/50 shadow-[0_12px_28px_rgba(16,185,129,0.12)]"
                    : "bg-[#FFFDF4] border-[#D8793F]/25 shadow-[0_10px_24px_rgba(16,34,45,0.05)]"
                }`}
              >
                {/* Top: Level Badge & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8793F]/25 bg-[#FFF8EC] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                    {tier.levelBadge}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                      isClaimed
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : isClaimPending
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : isUnlocked
                        ? "bg-[#10B981]/15 text-[#0A3323] border border-[#10B981]/30"
                        : "bg-stone-100 text-stone-700 border border-stone-300"
                    }`}
                  >
                    {isClaimed ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-700" /> Collected
                      </>
                    ) : isClaimPending ? (
                      <>
                        <Clock size={13} className="text-amber-700" /> Under Review
                      </>
                    ) : isUnlocked ? (
                      <>
                        <CheckCircle2 size={13} className="text-[#10B981]" /> Unlocked
                      </>
                    ) : (
                      <>
                        <Lock size={12} /> Locked
                      </>
                    )}
                  </span>
                </div>

                {/* Hen / Name Row */}
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-[#FFD0A5]/30 text-[#8C3A14] grid place-items-center font-black shrink-0 border border-[#D8793F]/20">
                    <Egg size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#17372F]">{tier.levelCode}</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#566D7E]">
                      HEN POINT
                    </span>
                  </div>
                </div>

                {/* Level 1 Team Investment Progress */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14] block">
                    LEVEL 1 TEAM INVESTMENT
                  </span>
                  <div className="flex items-center justify-between text-xs font-bold text-[#17372F]">
                    <span>
                      PKR {verifiedLevelOneInvestment.toLocaleString()} / PKR{" "}
                      {tier.requiredLevel1InvestmentRs.toLocaleString()}
                    </span>
                    <span className="text-[#8C3A14] font-black">{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#E5E1D8] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: isClaimed || isUnlocked
                          ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                          : "linear-gradient(90deg, #F59B52 0%, #D8793F 100%)",
                      }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-[#566D7E]">
                    {remaining > 0 ? (
                      <span>PKR {remaining.toLocaleString()} remaining</span>
                    ) : (
                      <span className="text-[#10B981] font-bold">Requirement Met!</span>
                    )}
                  </div>
                </div>

                {/* Reward & Bottom Action Button */}
                <div className="pt-4 border-t border-[#D8793F]/15 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#8C3A14] block">
                      REWARD
                    </span>
                    <div className="text-base sm:text-lg font-black text-[#10B981]">
                      {tier.goldenEggReward.toLocaleString()}{" "}
                      <span className="text-xs text-[#566D7E] font-bold">Golden Eggs</span>
                    </div>
                  </div>

                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200">
                      <Check size={14} /> Claimed
                    </span>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => setConfirmModalTier(tier)}
                      disabled={isPending}
                      style={{
                        background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                        boxShadow: "0 2px 0 #047857, 0 4px 12px rgba(16, 185, 129, 0.25)",
                      }}
                      className="inline-flex items-center gap-1.5 rounded-2xl py-2.5 px-5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
                    >
                      <CheckCircle2 size={14} /> Collect reward
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/team"
                      style={{
                        background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                        boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.25)",
                      }}
                      className="inline-flex items-center gap-1 rounded-2xl py-2.5 px-5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
                    >
                      Grow Level 1 team <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Reward Claims Section */}
      <section
        aria-label="Reward Claims History"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_12px_28px_rgba(16,34,45,0.06)] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8793F]/15 pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              CLAIM HISTORY
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Your reward claims
            </h2>
          </div>
          <span className="text-xs font-bold text-[#566D7E]">
            View all rewards
          </span>
        </div>

        {claims.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="size-12 rounded-2xl bg-[#FFD0A5]/30 text-[#8C3A14] grid place-items-center mx-auto">
              <Gift size={22} />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#566D7E]">
              No rewards collected yet. Complete your first target to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="rounded-2xl border border-[#D8793F]/20 bg-[#FFF8EC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#10B981]/15 text-[#0A3323] grid place-items-center shrink-0 font-black">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#17372F]">{claim.milestoneName}</h3>
                    <p className="text-[11px] font-semibold text-[#566D7E]">
                      Claimed on: {formatDateTime(claim.collectedAt || claim.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-sm font-black text-[#10B981]">
                    +{claim.rewardEggUnits.toLocaleString()} Golden Eggs
                  </span>
                  <span className="text-[11px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. How Rewards Unlock Section */}
      <section
        aria-label="How Rewards Unlock"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_12px_28px_rgba(16,34,45,0.06)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              REWARD RULES
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
              How rewards unlock
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
              Only verified Level 1 team investment counts toward these reward levels. When a target is completed, submit the available reward for verification and collection.
            </p>
          </div>

          <div className="shrink-0 flex justify-center sm:justify-end">
            <div className="size-20 sm:size-24 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20 p-2 grid place-items-center">
              <Image
                src="/assets/dashboard/shortcuts/shortcut-egg-ledger.webp"
                alt="Reward Rules Ledger"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      {confirmModalTier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmModalTier(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-[#D8793F]/30 bg-[#FFFDF4] p-6 sm:p-8 shadow-2xl space-y-5 z-10">
            <div className="flex items-center gap-3">
              <span className="size-12 rounded-2xl bg-[#10B981]/15 text-[#0A3323] grid place-items-center">
                <Trophy size={24} />
              </span>
              <div>
                <h3 className="text-lg font-black text-[#17372F]">
                  Collect {confirmModalTier.levelCode} Reward
                </h3>
                <p className="text-xs font-semibold text-[#566D7E]">
                  Verified Level 1 Milestone
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-2 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-[#566D7E]">Target Milestone:</span>
                <span className="font-black text-[#17372F]">{confirmModalTier.levelCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#566D7E]">Golden Egg Reward:</span>
                <span className="font-black text-[#10B981] text-sm">
                  +{confirmModalTier.goldenEggReward.toLocaleString()} Eggs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#566D7E]">Your Verified Level 1:</span>
                <span className="font-bold text-[#17372F]">
                  PKR {verifiedLevelOneInvestment.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-[#566D7E] leading-relaxed">
              Clicking confirm will immediately credit {confirmModalTier.goldenEggReward.toLocaleString()} Golden Eggs to your production ledger.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalTier(null)}
                className="flex-1 rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] py-3 text-xs font-bold text-[#17372F] hover:bg-[#FFFDF4] transition cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCollectReward(confirmModalTier)}
                disabled={isPending}
                style={{
                  background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                  boxShadow: "0 2px 0 #047857, 0 4px 12px rgba(16, 185, 129, 0.25)",
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
              >
                {isPending ? "Collecting..." : "Confirm & Collect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  X,
  Clock3,
  PackageCheck,
  AlertCircle,
  Laptop,
  Car,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  PRIZE_CATALOGUE,
  PrizeCategory,
  PrizeMilestone,
  calculatePrizeProgress,
  getRemainingInvestmentRs,
} from "@/lib/prizes/config";
import { submitPrizeClaimAction, PrizeClaimActionState } from "@/server/actions/prizes";

interface UserClaimSummary {
  id: string;
  prizeKey: string;
  prizeName: string;
  prizeCategory: string;
  status: string;
  createdAt: string;
  adminNote?: string | null;
}

interface PrizesClientProps {
  verifiedInvestmentRs: number;
  userClaims: UserClaimSummary[];
  availablePrizesCount: number;
  claimedPrizesCount: number;
}

export function PrizesClient({
  verifiedInvestmentRs,
  userClaims,
  availablePrizesCount,
  claimedPrizesCount,
}: PrizesClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<"All" | PrizeCategory>("All");
  const [activeModalPrize, setActiveModalPrize] = useState<PrizeMilestone | null>(null);

  const [state, formAction, isPending] = useActionState(submitPrizeClaimAction, {
    status: "idle",
    message: "",
  });

  const filteredPrizes = PRIZE_CATALOGUE.filter((prize) => {
    if (selectedCategory === "All") return true;
    return prize.category === selectedCategory;
  });

  const featuredPrize = PRIZE_CATALOGUE[0]; // Laptop Prize
  const featuredProgress = calculatePrizeProgress(verifiedInvestmentRs, featuredPrize.requiredInvestmentRs);
  const featuredRemaining = getRemainingInvestmentRs(verifiedInvestmentRs, featuredPrize.requiredInvestmentRs);

  // Helper to determine user claim status for a prize
  const getPrizeUserStatus = (prizeId: string, requiredRs: number) => {
    const claim = userClaims.find((c) => c.prizeKey === prizeId);
    if (claim) {
      if (claim.status === "DELIVERED") return "Delivered";
      if (claim.status === "APPROVED") return "Approved";
      if (claim.status === "PENDING" || claim.status === "UNDER_REVIEW") return "Pending";
      return claim.status;
    }
    if (verifiedInvestmentRs >= requiredRs) return "Eligible";
    return "Locked";
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 1. Statistics Strip (3 parts: Verified Investment, Available Prizes, Claimed Prizes) */}
      <section
        aria-label="Investment & Prize Statistics"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-6 shadow-[0_12px_28px_rgba(16,34,45,0.07)]"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Stat 1: Verified Investment */}
          <div className="sm:col-span-4 flex items-center gap-3.5 p-2 min-w-0">
            <div className="size-12 rounded-2xl bg-[#10B981]/15 text-[#0A3323] flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#0A3323]">
                Verified Investment
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight truncate">
                PKR {verifiedInvestmentRs.toLocaleString()}
              </h3>
            </div>
          </div>

          {/* Stat 2: Available Prizes */}
          <div className="sm:col-span-3 flex items-center gap-3.5 p-2 border-t sm:border-t-0 sm:border-l border-[#D8793F]/15">
            <div className="size-12 rounded-2xl bg-[#D8793F]/15 text-[#8C3A14] flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                Available Prizes
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
                {availablePrizesCount} <span className="text-xs font-bold text-[#566D7E]">Tiers</span>
              </h3>
            </div>
          </div>

          {/* Stat 3: Claimed Prizes */}
          <div className="sm:col-span-2 flex items-center gap-3.5 p-2 border-t sm:border-t-0 sm:border-l border-[#D8793F]/15">
            <div className="size-12 rounded-2xl bg-[#0D3850]/10 text-[#09263A] flex items-center justify-center shrink-0">
              <PackageCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#566D7E]">
                Claimed
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
                {claimedPrizesCount}
              </h3>
            </div>
          </div>

          {/* Action: Grow Investment */}
          <div className="sm:col-span-3 flex sm:justify-end pt-2 sm:pt-0">
            <Link
              href="/dashboard/plans"
              style={{
                background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 2px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.3)",
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition"
            >
              Grow Investment <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured Prize Spotlight Card */}
      <section aria-label="Featured Milestone Prize" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#D8793F]" /> FEATURED MILESTONE
          </span>
          <span className="text-xs font-semibold text-[#566D7E]">Tier 1 Landmark</span>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #061A2B 0%, #0A3323 100%)",
            boxShadow: "0 18px 40px rgba(6, 26, 43, 0.25), 0 3px 0 #04121D",
          }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white border border-[#10B981]/30 group"
        >
          {/* Subtle Ambient Radial Light */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 size-80 rounded-full bg-[#10B981]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <div className="space-y-4 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#10B981]/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#A7F3D0]">
                <Laptop size={13} /> {featuredPrize.category} Tier
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {featuredPrize.name}
              </h2>

              <p className="text-xs sm:text-sm font-semibold text-[#CBD5E1] leading-relaxed max-w-xl">
                {featuredPrize.shortDescription}
              </p>

              {/* Progress Panel */}
              <div className="rounded-2xl bg-black/30 border border-white/10 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white/80">Investment Milestone</span>
                  <span className="text-[#FDE68A] font-black">{featuredProgress}% Unlocked</span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${featuredProgress}%`,
                      background: "linear-gradient(90deg, #10B981 0%, #F59E0B 100%)",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-white/70 pt-1">
                  <span>Current: <strong>PKR {verifiedInvestmentRs.toLocaleString()}</strong></span>
                  <span>Target: <strong>PKR {featuredPrize.requiredInvestmentRs.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModalPrize(featuredPrize)}
                  style={{
                    background: "linear-gradient(180deg, #FFFDF4 0%, #FFF8EC 100%)",
                    boxShadow: "0 2px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#D8793F]/30 px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-[#17372F] hover:bg-[#FFF8EC] transition cursor-pointer"
                >
                  View Prize Details <ChevronRight size={16} />
                </button>

                {verifiedInvestmentRs >= featuredPrize.requiredInvestmentRs ? (
                  <button
                    type="button"
                    onClick={() => setActiveModalPrize(featuredPrize)}
                    style={{
                      background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                      boxShadow: "0 2px 0 #047857, 0 6px 16px rgba(16, 185, 129, 0.35)",
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Claim Laptop
                  </button>
                ) : null}
              </div>
            </div>

            {/* Right Product Image */}
            <div className="flex justify-center lg:col-span-5">
              <div className="relative size-56 sm:size-72 rounded-3xl border border-white/15 bg-gradient-to-b from-white/10 to-transparent p-4 grid place-items-center group-hover:scale-105 transition-transform duration-500">
                <Image
                  src={featuredPrize.image}
                  alt={featuredPrize.name}
                  width={280}
                  height={280}
                  className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.4)]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Prize Catalogue Section with Filter Pills */}
      <section aria-label="Prize Catalogue" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              OFFICIAL MILESTONE REWARDS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Prize Catalogue
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20 self-start sm:self-auto">
            {(["All", "Electronics", "Vehicles"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#17372F] text-[#FFFDF4] shadow-sm"
                    : "text-[#566D7E] hover:text-[#17372F] hover:bg-[#FFFDF4]/80"
                }`}
              >
                {cat === "All" ? "All Prizes" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredPrizes.map((prize) => {
            const progress = calculatePrizeProgress(verifiedInvestmentRs, prize.requiredInvestmentRs);
            const remainingRs = getRemainingInvestmentRs(verifiedInvestmentRs, prize.requiredInvestmentRs);
            const userStatus = getPrizeUserStatus(prize.id, prize.requiredInvestmentRs);
            const isEligible = userStatus === "Eligible";
            const isClaimed = userStatus === "Delivered" || userStatus === "Approved";
            const isPendingClaim = userStatus === "Pending";

            return (
              <div
                key={prize.id}
                className={`relative overflow-hidden rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 ${
                  isEligible
                    ? "bg-[#F4FAF6] border-[#10B981]/40 shadow-[0_12px_28px_rgba(16,185,129,0.12)]"
                    : "bg-[#FFFDF4] border-[#D8793F]/25 shadow-[0_12px_28px_rgba(16,34,45,0.06)]"
                }`}
              >
                {/* Card Top: Badges */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8793F]/25 bg-[#FFF8EC] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                      {prize.category === "Electronics" ? <Laptop size={12} /> : <Car size={12} />}
                      {prize.category}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                        isClaimed
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-500/30"
                          : isPendingClaim
                          ? "bg-amber-100 text-amber-900 border border-amber-500/30"
                          : isEligible
                          ? "bg-[#10B981]/15 text-[#0A3323] border border-[#10B981]/30"
                          : "bg-stone-100 text-stone-700 border border-stone-300"
                      }`}
                    >
                      {isEligible ? (
                        <>
                          <CheckCircle2 size={13} className="text-[#10B981]" /> Eligible
                        </>
                      ) : isPendingClaim ? (
                        <>
                          <Clock3 size={13} className="text-amber-700" /> Pending Review
                        </>
                      ) : isClaimed ? (
                        <>
                          <PackageCheck size={13} className="text-emerald-700" /> Claimed
                        </>
                      ) : (
                        <>
                          <Lock size={12} /> Locked
                        </>
                      )}
                    </span>
                  </div>

                  {/* Product Visual */}
                  <div className="my-6 flex justify-center">
                    <div className="relative size-44 sm:size-52 rounded-2xl bg-gradient-to-br from-[#FFF8EC] to-[#FFD0A5]/25 border border-[#D8793F]/15 p-3 grid place-items-center group-hover:scale-105 transition-transform duration-300">
                      <Image
                        src={prize.image}
                        alt={prize.name}
                        width={200}
                        height={200}
                        priority
                        className="w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(16,34,45,0.18)]"
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-[#17372F]">{prize.name}</h3>
                  <p className="text-xs sm:text-sm font-semibold text-[#566D7E] mt-1 leading-relaxed">
                    {prize.shortDescription}
                  </p>
                </div>

                {/* Card Bottom: Progress & Buttons */}
                <div className="mt-6 pt-5 border-t border-[#D8793F]/15 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#17372F]">Required Investment</span>
                      <span className="text-[#8C3A14] font-black">PKR {prize.requiredInvestmentRs.toLocaleString()}</span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E5D7C5]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: isEligible
                            ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                            : "linear-gradient(90deg, #F59B52 0%, #D8793F 100%)",
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#566D7E]">
                      <span>Progress: {progress}%</span>
                      {remainingRs > 0 ? (
                        <span>Remaining: PKR {remainingRs.toLocaleString()}</span>
                      ) : (
                        <span className="text-[#10B981] font-bold">Requirement Met!</span>
                      )}
                    </div>
                  </div>

                  {/* Button Row */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveModalPrize(prize)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[#D8793F]/30 bg-[#FFF8EC] py-2.5 px-4 text-xs font-black uppercase tracking-wider text-[#17372F] hover:bg-[#FFFDF4] transition cursor-pointer"
                    >
                      Prize Details
                    </button>

                    {isEligible ? (
                      <button
                        type="button"
                        onClick={() => setActiveModalPrize(prize)}
                        style={{
                          background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                          boxShadow: "0 2px 0 #047857, 0 4px 12px rgba(16, 185, 129, 0.25)",
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer"
                      >
                        <CheckCircle2 size={14} /> Claim Now
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/plans"
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-2xl border border-[#17372F]/20 bg-[#17372F] py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-[#122A24] transition cursor-pointer text-center"
                      >
                        Invest More <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. My Claims Section */}
      <section aria-label="My Prize Claims" className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
            <PackageCheck size={20} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#17372F]">My Prize Claims</h2>
            <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
              Review submitted claim requests, admin review notes, and delivery dispatches.
            </p>
          </div>
        </div>

        {userClaims.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[#D8793F]/20">
            <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
              <thead className="bg-[#FFF8EC] text-[11px] font-black uppercase tracking-wider text-[#8C3A14] border-b border-[#D8793F]/20">
                <tr>
                  <th className="px-5 py-4">Prize Item</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Claim Status</th>
                  <th className="px-5 py-4">Submitted Date</th>
                  <th className="px-5 py-4 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8793F]/15 bg-[#FFFDF4]">
                {userClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-[#FFF8EC]/60 transition">
                    <td className="px-5 py-4 font-black text-[#17372F]">{claim.prizeName}</td>
                    <td className="px-5 py-4 font-bold text-[#566D7E]">{claim.prizeCategory}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          claim.status === "DELIVERED" || claim.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-500/30"
                            : "bg-amber-50 text-amber-800 border border-amber-500/30"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#566D7E]">{claim.createdAt}</td>
                    <td className="px-5 py-4 text-right font-medium text-[#566D7E]">
                      {claim.adminNote || "Under Verification"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8793F]/30 bg-[#FFF8EC]/50 p-8 text-center">
            <PackageCheck size={32} className="mx-auto text-[#D8793F]/60 mb-2" />
            <p className="text-sm font-bold text-[#17372F]">No prize claims yet.</p>
            <p className="mt-1 text-xs text-[#566D7E]">
              Reach any milestone tier above to submit your prize fulfillment request.
            </p>
          </div>
        )}
      </section>

      {/* 5. How It Works Section (3 concise steps) */}
      <section aria-label="How Prizes Work" className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
        <h2 className="text-xl font-black text-[#17372F] mb-6">How Farm Prize Milestones Work</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-[#FFF8EC] p-5 border border-[#D8793F]/15 space-y-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#D8793F]/20 text-[#8C3A14] font-black text-sm">
              1
            </span>
            <h3 className="text-base font-black text-[#17372F]">Build verified investment</h3>
            <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
              Complete approved hen-plan purchases across your account lifetime.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFF8EC] p-5 border border-[#D8793F]/15 space-y-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#D8793F]/20 text-[#8C3A14] font-black text-sm">
              2
            </span>
            <h3 className="text-base font-black text-[#17372F]">Reach a milestone</h3>
            <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
              Unlock electronics or vehicle prizes once your verified total crosses the tier.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFF8EC] p-5 border border-[#D8793F]/15 space-y-2">
            <span className="grid size-8 place-items-center rounded-xl bg-[#D8793F]/20 text-[#8C3A14] font-black text-sm">
              3
            </span>
            <h3 className="text-base font-black text-[#17372F]">Submit your claim</h3>
            <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
              Send the claim for order verification and physical dispatch to your address.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Accessible Prize Details & Claim Modal */}
      {activeModalPrize ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prize-modal-title"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#D8793F]/30 bg-[#FFFDF4] p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1.5">
                  <Award size={13} /> {activeModalPrize.category} Tier Prize
                </span>
                <h2 id="prize-modal-title" className="text-2xl font-black text-[#17372F] mt-1">
                  {activeModalPrize.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalPrize(null)}
                className="grid size-9 place-items-center rounded-full bg-[#FFF8EC] text-[#566D7E] hover:text-[#17372F] border border-[#D8793F]/20 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Image & Details */}
            <div className="grid gap-6 sm:grid-cols-12 items-center">
              <div className="sm:col-span-5 flex justify-center">
                <div className="size-48 rounded-2xl bg-gradient-to-br from-[#FFF8EC] to-[#FFD0A5]/30 border border-[#D8793F]/20 p-3 grid place-items-center">
                  <Image
                    src={activeModalPrize.image}
                    alt={activeModalPrize.name}
                    width={180}
                    height={180}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-7 space-y-3">
                <p className="text-xs sm:text-sm font-semibold text-[#566D7E] leading-relaxed">
                  {activeModalPrize.fullDescription}
                </p>

                <div className="rounded-2xl bg-[#FFF8EC] p-3.5 border border-[#D8793F]/15 space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-[#566D7E]">Required Verified Total:</span>
                    <span className="text-[#17372F] font-black">PKR {activeModalPrize.requiredInvestmentRs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#566D7E]">Your Verified Investment:</span>
                    <span className="text-[#10B981] font-black">PKR {verifiedInvestmentRs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#566D7E]">Milestone Progress:</span>
                    <span className="text-[#8C3A14] font-black">
                      {calculatePrizeProgress(verifiedInvestmentRs, activeModalPrize.requiredInvestmentRs)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#17372F]">
                Prize Terms & Fulfilment Policy
              </h3>
              <ul className="space-y-1.5 text-xs font-semibold text-[#566D7E]">
                {activeModalPrize.terms.map((term, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form / Claim / Feedback */}
            {state.status === "success" ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-500/30 p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-900 font-black text-sm">
                  <CheckCircle2 size={18} className="text-emerald-600" /> Claim Submitted Successfully!
                </div>
                <p className="text-xs font-semibold text-emerald-800">{state.message}</p>
                {state.whatsappUrl ? (
                  <a
                    href={state.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 transition"
                  >
                    Open Dispatch Desk on WhatsApp <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            ) : (
              <div>
                {state.status === "error" ? (
                  <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-500/30 p-3.5 flex items-center gap-2 text-rose-800 text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{state.message}</span>
                  </div>
                ) : null}

                {verifiedInvestmentRs >= activeModalPrize.requiredInvestmentRs ? (
                  <form action={formAction} className="space-y-4">
                    <input type="hidden" name="prizeKey" value={activeModalPrize.id} />
                    <div className="space-y-1.5">
                      <label htmlFor="userNote" className="text-xs font-bold text-[#17372F]">
                        Delivery Address / Contact Remarks (Optional)
                      </label>
                      <textarea
                        id="userNote"
                        name="userNote"
                        rows={2}
                        placeholder="Enter preferred delivery district or authorized pickup location..."
                        className="w-full rounded-2xl border border-[#D8793F]/25 bg-white p-3 text-xs font-semibold text-[#17372F] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalPrize(null)}
                        className="rounded-2xl border border-[#D8793F]/30 bg-[#FFF8EC] px-5 py-2.5 text-xs font-bold text-[#17372F] hover:bg-[#FFFDF4]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        style={{
                          background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                          boxShadow: "0 2px 0 #047857, 0 4px 12px rgba(16, 185, 129, 0.3)",
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition disabled:opacity-50"
                      >
                        {isPending ? "Submitting Claim..." : "Confirm & Submit Claim"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#D8793F]/15">
                    <div className="text-xs font-semibold text-[#566D7E]">
                      Need <strong>PKR {getRemainingInvestmentRs(verifiedInvestmentRs, activeModalPrize.requiredInvestmentRs).toLocaleString()}</strong> more verified investment.
                    </div>
                    <Link
                      href="/dashboard/plans"
                      style={{
                        background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                        boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.25)",
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 transition"
                    >
                      Buy Hen Plans <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

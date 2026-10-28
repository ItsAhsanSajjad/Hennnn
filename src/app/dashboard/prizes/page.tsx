import Image from "next/image";
import Link from "next/link";
import { Sparkles, Trophy, ShieldCheck, Gift, LayoutDashboard, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { PRIZE_CATALOGUE } from "@/lib/prizes/config";
import { PrizesClient } from "@/components/prizes/prizes-client";
import { formatDateTime } from "@/lib/utilities/format";

export const dynamic = "force-dynamic";

export default async function PrizesPage() {
  const user = await requireUser();

  // 1. Calculate authoritative verified investment from approved orders
  const approvedOrders = await prisma.purchaseOrder.findMany({
    where: { userId: user.id, status: "APPROVED" },
    select: { totalAmountPaisa: true },
  });

  const verifiedInvestmentPaisa = approvedOrders.reduce(
    (sum, o) => sum + BigInt(o.totalAmountPaisa),
    0n
  );
  const verifiedInvestmentRs = Number(verifiedInvestmentPaisa / 100n);

  // 2. Fetch real prize claims
  const claims = await prisma.prizeClaim.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const formattedClaims = claims.map((c) => ({
    id: c.id,
    prizeKey: c.prizeKey,
    prizeName: c.prizeName,
    prizeCategory: c.prizeCategory,
    status: c.status,
    createdAt: formatDateTime(c.createdAt),
    adminNote: c.adminNote,
  }));

  const claimedPrizesCount = claims.filter((c) =>
    ["APPROVED", "DELIVERED"].includes(c.status)
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Small Page-Navigation Row */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8793F]/25 bg-[#FFFDF4] px-3.5 py-1.5 text-xs font-bold text-[#17372F] hover:bg-[#FFF8EC] transition"
          >
            <LayoutDashboard size={14} className="text-[#D8793F]" /> Dashboard
          </Link>
          <Link
            href="/dashboard/rewards"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8793F]/25 bg-[#FFFDF4] px-3.5 py-1.5 text-xs font-bold text-[#17372F] hover:bg-[#FFF8EC] transition"
          >
            <Gift size={14} className="text-[#10B981]" /> My Rewards
          </Link>
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1">
          <Sparkles size={12} className="text-[#D8793F]" /> GROWMETA PRIZES
        </span>
      </div>

      {/* 2. Large Prize Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #061A2B 0%, #0A3323 100%)",
          boxShadow: "0 20px 48px rgba(6, 26, 43, 0.3), 0 3px 0 #04121D",
        }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white border border-[#10B981]/35 group"
      >
        {/* Subtle Ambient Glowing Rings */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 size-72 sm:size-96 rounded-full bg-[#10B981]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 size-48 sm:size-64 rounded-full bg-[#F59E0B]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Hero Text */}
          <div className="space-y-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/40 bg-[#10B981]/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#A7F3D0]">
              <Trophy size={13} /> PREMIUM FARM PRIZES
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
              Grow your farm. Unlock more.
            </h1>

            <p className="text-sm sm:text-base font-semibold text-[#CBD5E1] leading-relaxed max-w-xl">
              Build your verified farm investment and reach new prize milestones.
            </p>

            {/* Truthful Benefit Chips */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold text-white/90">
                <ShieldCheck size={14} className="text-[#10B981]" /> Verified progress
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold text-white/90">
                <Sparkles size={14} className="text-[#F59E0B]" /> Clear milestones
              </span>
            </div>
          </div>

          {/* Hero 3D Trophy Visual */}
          <div className="flex justify-center lg:col-span-4">
            <div className="relative size-44 sm:size-56 rounded-3xl border border-white/15 bg-gradient-to-b from-white/15 to-transparent p-4 grid place-items-center group-hover:scale-105 transition-transform duration-500">
              <Image
                src="/assets/dashboard/prizes/prize-trophy.webp"
                alt="Gold Championship Trophy"
                width={220}
                height={220}
                className="w-full h-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Prizes Client Area */}
      <PrizesClient
        verifiedInvestmentRs={verifiedInvestmentRs}
        userClaims={formattedClaims}
        availablePrizesCount={PRIZE_CATALOGUE.length}
        claimedPrizesCount={claimedPrizesCount}
      />
    </div>
  );
}

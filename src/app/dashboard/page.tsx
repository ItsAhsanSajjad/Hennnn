import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Bell,
  Bird,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Egg,
  ExternalLink,
  Gift,
  HelpCircle,
  History,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  Plus,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  TrendingUp,
  User,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import { CopyReferralButton } from "@/components/dashboard/copy-referral-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { HarvestCollectionTimer } from "@/components/dashboard/harvest-collection-timer";
import { EmptyState } from "@/components/shared/empty-state";
import { LogoutConfirmation } from "@/components/auth/logout-confirmation";
import { UserAvatar } from "@/components/layout/user-avatar";
import { env } from "@/lib/env/server";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utilities/format";
import { ensureEggAccrualsCurrent } from "@/server/services/egg-accrual";

export const dynamic = "force-dynamic";

type DashboardAggregates = {
  referralCount: number;
  activeHens: number;
  pendingPurchases: number;
  eggBalance: number | bigint;
  openSaleRequests: number;
  referralBonusEggs: number;
  totalInvestmentPaisa: number | bigint;
  soldEggs: number;
  eggEarningsPaisa: number | bigint;
  totalPaidPaisa: number | bigint;
  successfulLoginCount: number;
  totalHenAssetsCount: number;
  eggLedgerCount: number;
  marketSalesCount: number;
  payoutsCount: number;
};

export default async function DashboardPage() {
  const user = await requireUser();
  await ensureEggAccrualsCurrent();
  const [activity, notifications, nextOrder, referredBy, [statsRow]] = await Promise.all([
    prisma.auditLog.findMany({
      where: { actorUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.purchaseOrder.findFirst({
      where: {
        userId: user.id,
        status: { in: ["AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "UNDER_REVIEW"] },
      },
      orderBy: { createdAt: "desc" },
      include: { henPlan: true },
    }),
    prisma.referralRelationship.findUnique({
      where: { inviteeId: user.id },
      select: { inviter: { select: { username: true } } },
    }),
    prisma.$queryRaw<DashboardAggregates[]>`
      SELECT
        (SELECT COUNT(*)::int FROM "ReferralRelationship" WHERE "inviterId" = ${user.id}::uuid) AS "referralCount",
        (SELECT COALESCE(SUM("quantity"), 0)::int FROM "HenAsset" WHERE "userId" = ${user.id}::uuid AND "status" = 'ACTIVE') AS "activeHens",
        (SELECT COUNT(*)::int FROM "PurchaseOrder" WHERE "userId" = ${user.id}::uuid AND "status" IN ('AWAITING_PAYMENT', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW'))::int AS "pendingPurchases",
        (SELECT COALESCE(SUM("eggUnits"), 0) FROM "EggLedgerEntry" WHERE "userId" = ${user.id}::uuid) AS "eggBalance",
        (SELECT COUNT(*)::int FROM "EggMarketSale" WHERE "userId" = ${user.id}::uuid AND "status" IN ('PENDING_PAYMENT', 'PROCESSING'))::int
          + (SELECT COUNT(*)::int FROM "EggSaleRequest" WHERE "userId" = ${user.id}::uuid AND "status" IN ('AWAITING_REVIEW', 'UNDER_REVIEW', 'PAYMENT_PROCESSING'))::int AS "openSaleRequests",
        (SELECT COALESCE(SUM("rewardEggUnits"), 0)::int FROM "ReferralReward" WHERE "inviterUserId" = ${user.id}::uuid AND "status" = 'CREDITED') AS "referralBonusEggs",
        (SELECT COALESCE(SUM("totalAmountPaisa"), 0)::bigint FROM "PurchaseOrder" WHERE "userId" = ${user.id}::uuid AND "status" = 'APPROVED') AS "totalInvestmentPaisa",
        (SELECT COALESCE(SUM("eggQuantity"), 0)::int FROM "EggMarketSale" WHERE "userId" = ${user.id}::uuid AND "status" IN ('PAID', 'COMPLETED'))::int
          + (SELECT COALESCE(SUM("eggQuantity"), 0)::int FROM "EggSaleRequest" WHERE "userId" = ${user.id}::uuid AND "status" = 'PAID')::int AS "soldEggs",
        (SELECT COALESCE(SUM("totalAmountPaisa"), 0)::bigint FROM "EggMarketSale" WHERE "userId" = ${user.id}::uuid AND "status" IN ('PAID', 'COMPLETED'))::bigint
          + (SELECT COALESCE(SUM("totalAmountPaisa"), 0)::bigint FROM "EggSaleRequest" WHERE "userId" = ${user.id}::uuid AND "status" = 'PAID')::bigint AS "eggEarningsPaisa",
        (SELECT COALESCE(SUM("totalAmountPaisa"), 0)::bigint FROM "EggMarketSale" WHERE "userId" = ${user.id}::uuid AND "status" IN ('PAID', 'COMPLETED'))::bigint
          + (SELECT COALESCE(SUM("amountPaisa"), 0)::bigint FROM "Payout" WHERE "userId" = ${user.id}::uuid AND "status" = 'CONFIRMED')::bigint AS "totalPaidPaisa",
        (SELECT COUNT(*)::int FROM "AuditLog" WHERE "actorUserId" = ${user.id}::uuid AND "action" = 'USER_LOGIN_SUCCEEDED')::int AS "successfulLoginCount",
        (SELECT COUNT(*)::int FROM "HenAsset" WHERE "userId" = ${user.id}::uuid)::int AS "totalHenAssetsCount",
        (SELECT COUNT(*)::int FROM "EggLedgerEntry" WHERE "userId" = ${user.id}::uuid)::int AS "eggLedgerCount",
        (SELECT COUNT(*)::int FROM "EggMarketSale" WHERE "userId" = ${user.id}::uuid AND "status" != 'DRAFT')::int
          + (SELECT COUNT(*)::int FROM "EggSaleRequest" WHERE "userId" = ${user.id}::uuid)::int AS "marketSalesCount",
        (SELECT COUNT(*)::int FROM "EggMarketSale" WHERE "userId" = ${user.id}::uuid AND "status" != 'DRAFT')::int
          + (SELECT COUNT(*)::int FROM "Payout" WHERE "userId" = ${user.id}::uuid)::int AS "payoutsCount"
    `,
  ]);

  const referralCount = Number(statsRow?.referralCount ?? 0);
  const activeHens = Number(statsRow?.activeHens ?? 0);
  const pendingPurchases = Number(statsRow?.pendingPurchases ?? 0);
  const eggBalance = Number(statsRow?.eggBalance ?? 0);
  const openSaleRequests = Number(statsRow?.openSaleRequests ?? 0);
  const referralBonusEggs = Number(statsRow?.referralBonusEggs ?? 0);
  const totalInvestmentPaisa = BigInt(statsRow?.totalInvestmentPaisa ?? 0);
  const totalInvestmentRs = Math.round(Number(totalInvestmentPaisa) / 100);
  const soldEggs = Number(statsRow?.soldEggs ?? 0);
  const eggEarningsPaisa = BigInt(statsRow?.eggEarningsPaisa ?? 0);
  const eggEarningsRs = Math.round(Number(eggEarningsPaisa) / 100);
  const totalPaidPaisa = BigInt(statsRow?.totalPaidPaisa ?? 0);
  const totalPaidRs = Math.round(Number(totalPaidPaisa) / 100);
  const successfulLoginCount = Number(statsRow?.successfulLoginCount ?? 0);

  // Farm Records button counts
  const henRecordsCount = Number(statsRow?.totalHenAssetsCount ?? 0);
  const eggHistoryCount = Number(statsRow?.eggLedgerCount ?? 0);
  const soldEggHistoryCount = Number(statsRow?.marketSalesCount ?? 0);
  const payoutHistoryCount = Number(statsRow?.payoutsCount ?? 0);

  const isFirstVisit = successfulLoginCount === 0;
  const isVerified = Boolean(user.phoneVerifiedAt || user.emailVerified);
  const hasActiveFlock = activeHens > 0;
  const inviterName = referredBy?.inviter?.username ?? null;

  // Pakistan Standard Time (PKT, UTC+5) Daily Production Cycle Bounds
  const serverNow = new Date();
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const pktDate = new Date(serverNow.getTime() + PKT_OFFSET_MS);
  const cycleStartPkt = new Date(
    Date.UTC(pktDate.getUTCFullYear(), pktDate.getUTCMonth(), pktDate.getUTCDate(), 0, 0, 0)
  );
  const cycleEndPkt = new Date(
    Date.UTC(pktDate.getUTCFullYear(), pktDate.getUTCMonth(), pktDate.getUTCDate() + 1, 0, 0, 0)
  );
  const cycleStartIso = new Date(cycleStartPkt.getTime() - PKT_OFFSET_MS).toISOString();
  const cycleEndIso = new Date(cycleEndPkt.getTime() - PKT_OFFSET_MS).toISOString();
  const serverNowIso = serverNow.toISOString();

  // Clean 3D Illustrated Reference Parity Shortcuts (5 columns x 2 rows)
  const quickShortcuts = [
    // Row 1
    {
      label: "Rewards",
      href: "/dashboard/rewards",
      image: "/assets/dashboard/shortcuts/shortcut-rewards.webp",
      alt: "Referral rewards and bonus eggs",
      theme: "gold" as const,
    },
    {
      label: "Prizes",
      href: "/dashboard/prizes",
      image: "/assets/dashboard/shortcuts/shortcut-prizes.webp",
      alt: "Flock milestone prizes and plans",
      theme: "emerald" as const,
    },
    {
      label: "Team",
      href: "/dashboard/team",
      image: "/assets/dashboard/shortcuts/shortcut-team.webp",
      alt: "Active member network and team",
      theme: "gold" as const,
    },
    {
      label: "Deposits",
      href: "/dashboard/deposits",
      image: "/assets/dashboard/shortcuts/shortcut-deposits.webp",
      alt: "Deposit orders and payment verifications",
      theme: "emerald" as const,
    },
    {
      label: "Withdrawals",
      href: "/dashboard/withdrawals",
      image: "/assets/dashboard/shortcuts/shortcut-withdrawals.webp",
      alt: "Egg sales payouts and cash withdrawals",
      theme: "gold" as const,
    },
    // Row 2
    {
      label: "Profit Egg",
      href: "/dashboard/profit-egg",
      image: "/assets/dashboard/shortcuts/shortcut-profit-egg.webp",
      alt: "Daily egg harvest ledger and yield",
      theme: "emerald" as const,
    },
    {
      label: "Refer Bonus",
      href: "/dashboard/refer-bonus",
      image: "/assets/dashboard/shortcuts/shortcut-refer-bonus.webp",
      alt: "Referral commission and bonus records",
      theme: "gold" as const,
    },
    {
      label: "App Download",
      href: "/dashboard/app-download",
      image: "/assets/dashboard/shortcuts/shortcut-app-download.webp",
      alt: "Mobile app download and PWA installation",
      theme: "emerald" as const,
    },
    {
      label: "FBR / SECP",
      href: "/dashboard/legal",
      image: "/assets/dashboard/shortcuts/shortcut-fbr-secp.webp",
      alt: "FBR tax compliance and SECP custody disclosures",
      theme: "gold" as const,
    },
    {
      label: "Logout",
      href: "/login",
      image: "/assets/dashboard/shortcuts/shortcut-logout.webp",
      alt: "Secure account logout gate",
      theme: "emerald" as const,
      isLogout: true,
    },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-300 w-full min-w-0 box-border pb-36 sm:pb-28">
      {/* 1. Header Section */}
      <DashboardHeader
        username={user.username}
        status={user.status}
        isFirstVisit={isFirstVisit}
      />

      {/* 2. First Summary Row (3 Reference Proportioned Cards: Member Profile full-width on mobile/tablet, Eggs & Flock 2-column) */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6" aria-label="Overview Summary">
        {/* Card 1: Member Profile (Warm Cream - Full width on mobile/tablet, 1 col on desktop) */}
        <div
          style={{
            boxShadow: "0 10px 24px rgba(16, 34, 45, 0.07), 0 2px 0 rgba(216, 121, 63, 0.16)",
          }}
          className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#FFFDF4] border border-[#D8793F]/25 p-3 sm:p-4 lg:p-5 flex flex-col justify-between group transition-transform hover:-translate-y-0.5 min-w-0 box-border"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <UserAvatar username={user.username} image={user.image} size="profile" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                  MEMBER PROFILE
                </p>
                <h3 className="flex items-center gap-1 text-[15px] sm:text-[17px] font-black text-[#17372F] mt-0.5 truncate">
                  <span className="truncate">{user.username}</span>
                  {isVerified && <BadgeCheck size={16} className="text-[#D8793F] shrink-0" />}
                </h3>
                {inviterName ? (
                  <p className="text-[11px] sm:text-xs font-semibold text-[#566D7E] mt-0.5 truncate">
                    Sponsor: <span className="font-bold text-[#D8793F]">@{inviterName}</span>
                  </p>
                ) : (
                  <p className="text-[11px] sm:text-xs font-semibold text-[#566D7E] mt-0.5">Direct Member</p>
                )}
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-50 px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {user.status === "ACTIVE" ? "Active" : user.status}
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3.5 flex items-center justify-between text-[11px] sm:text-xs text-[#566D7E] border-t border-[#D8793F]/15 pt-2">
            <span className="font-bold flex items-center gap-1">
              {isVerified ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-700" /> Verified Account
                </>
              ) : (
                "Standard Account"
              )}
            </span>
            <span className="font-bold text-[#8C3A14]">
              {hasActiveFlock ? `${activeHens} Active Hen${activeHens === 1 ? "" : "s"}` : "No active hens"}
            </span>
          </div>
        </div>

        {/* Card 2: Available Eggs (Navy Hero Card) */}
        <Link
          href="/dashboard/egg-history"
          style={{
            background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
            boxShadow: "0 14px 28px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
          }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-[#D8793F]/40 p-3 sm:p-4 lg:p-5 flex flex-col justify-between text-white group transition-transform hover:-translate-y-0.5 min-w-0 box-border cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
        >
          <div className="absolute -right-8 -bottom-8 size-28 rounded-full border border-[#D8793F]/20 pointer-events-none" />
          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#FFD0A5]">
                AVAILABLE EGGS
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#FFFDF4] mt-0.5 tracking-tight truncate leading-none">
                {eggBalance} <span className="text-xs sm:text-sm font-bold text-[#DCE8E8]">Eggs</span>
              </p>
            </div>
            <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#103E5C] to-[#061A2B] shrink-0 border border-[#D8793F]/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/dashboard/golden-egg-3d.jpg"
                alt="Available Eggs"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-[#DCE8E8] border-t border-white/10 pt-2">
            <span className="flex items-center gap-1 font-bold text-[#FFD0A5]">
              <ShieldCheck size={13} className="text-[#D8793F]" /> Verified ledger
            </span>
            <span className="inline-flex items-center gap-0.5 text-[#FFD0A5] font-bold group-hover:underline">
              Sell Eggs <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Card 3: Active Flock (Warm Cream) */}
        <Link
          href="/dashboard/hens/history"
          style={{
            boxShadow: "0 10px 24px rgba(16, 34, 45, 0.07), 0 2px 0 rgba(216, 121, 63, 0.16)",
          }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#FFFDF4] border border-[#D8793F]/25 p-3 sm:p-4 lg:p-5 flex flex-col justify-between group transition-transform hover:-translate-y-0.5 min-w-0 box-border cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
        >
          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                ACTIVE FLOCK
              </p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#17372F] mt-0.5 tracking-tight truncate leading-none">
                {activeHens} <span className="text-xs sm:text-sm font-bold text-[#566D7E]">Hens</span>
              </p>
            </div>
            <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden bg-[#061A2B] shrink-0 border border-[#D8793F]/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/dashboard/brown-hen-3d.jpg"
                alt="Active Flock"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-center justify-between text-[10px] sm:text-xs text-[#566D7E] border-t border-[#D8793F]/15 pt-2">
            <span className="font-bold flex items-center gap-1 text-emerald-800">
              <Sparkles size={13} className="text-emerald-700" /> Daily eggs
            </span>
            <span className="inline-flex items-center gap-0.5 font-bold text-[#D8793F] group-hover:underline">
              Manage <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </section>

      {/* 3. High-Conversion CTA Action Row (Buy Hens & Sell Eggs) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6" aria-label="Quick Actions">
        {/* Banner 1: Buy Hens */}
        <Link
          href="/dashboard/plans"
          style={{
            background: "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)",
            boxShadow: "0 12px 28px rgba(216, 121, 63, 0.35), 0 3px 0 #8C3A14",
          }}
          className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex items-center justify-between text-white transition-all hover:brightness-105 active:translate-y-0.5 min-w-0 box-border"
        >
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="size-12 sm:size-16 rounded-xl sm:rounded-2xl overflow-hidden bg-[#061A2B]/20 p-1 sm:p-1.5 shrink-0 border border-white/30 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/dashboard/brown-hen-3d.jpg"
                alt="Buy Hens"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-lg sm:rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider text-[#FFF8EC] block truncate">
                GROW YOUR FLOCK
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">Buy Hens</h3>
            </div>
          </div>
          <div className="size-8 sm:size-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#D8793F] transition-colors ml-2">
            <Plus size={18} className="sm:w-5 sm:h-5" />
          </div>
        </Link>

        {/* Banner 2: Sell Eggs */}
        <Link
          href="/dashboard/sell-eggs"
          style={{
            background: "linear-gradient(135deg, #104C44 0%, #082923 100%)",
            boxShadow: "0 12px 28px rgba(8, 41, 35, 0.35), 0 3px 0 #041411",
          }}
          className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex items-center justify-between text-white transition-all hover:brightness-105 active:translate-y-0.5 min-w-0 box-border"
        >
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="size-12 sm:size-16 rounded-xl sm:rounded-2xl overflow-hidden bg-white/10 p-1 sm:p-1.5 shrink-0 border border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/dashboard/golden-egg-3d.jpg"
                alt="Sell Eggs"
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-lg sm:rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider text-[#A7F3D0] block truncate">
                TURN EGGS INTO VALUE
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white leading-tight truncate">Sell Eggs</h3>
            </div>
          </div>
          <div className="size-8 sm:size-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#104C44] transition-colors ml-2">
            <ArrowRight size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </section>

      {/* 4. Secondary Operations Row (Referral Box & Pending Activity Queue) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6" aria-label="Farm Operations">
        {/* Card A: Referral Link */}
        <div
          style={{
            boxShadow: "0 10px 24px rgba(16, 34, 45, 0.07), 0 2px 0 rgba(216, 121, 63, 0.16)",
          }}
          className="rounded-2xl sm:rounded-3xl bg-[#FFFDF4] border border-[#D8793F]/25 p-3.5 sm:p-5 flex flex-col justify-between min-w-0 box-border"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1.5">
                <Users size={13} className="text-[#D8793F]" /> GROW TOGETHER
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-600/30 px-2 py-0.5 rounded-full">
                {referralCount} Member{referralCount === 1 ? "" : "s"} Joined
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-[#17372F] leading-tight">Your referral link</h4>
            <p className="text-[11px] sm:text-xs text-[#566D7E] mt-0.5">Share your link and invite new members.</p>

            <div className="mt-2.5 sm:mt-3.5">
              <CopyReferralButton
                referralCode={user.referralCode}
                appUrl={env.NEXT_PUBLIC_APP_URL || "https://growmetaegg.digital"}
              />
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center justify-between text-[11px] sm:text-xs text-[#566D7E] border-t border-[#D8793F]/15 pt-2 sm:pt-2.5">
            <span className="font-bold">
              Bonus Eggs: <span className="text-[#D8793F]">{referralBonusEggs}</span>
            </span>
            <Link
              href="/dashboard/team"
              className="font-bold text-[#D8793F] hover:underline flex items-center gap-1"
            >
              View Full Team <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Card B: Pending Activity Queue */}
        <div
          style={{
            boxShadow: "0 10px 24px rgba(16, 34, 45, 0.07), 0 2px 0 rgba(216, 121, 63, 0.16)",
          }}
          className="rounded-2xl sm:rounded-3xl bg-[#FFFDF4] border border-[#D8793F]/25 p-3.5 sm:p-5 flex flex-col justify-between min-w-0 box-border"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1.5">
                <Clock3 size={13} className="text-[#D8793F]" /> IN PROCESS
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#566D7E]">Pending Queue</span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-[#17372F] leading-tight">Pending activity</h4>
            <p className="text-[11px] sm:text-xs text-[#566D7E] mt-0.5">Items waiting for review.</p>

            <div className="mt-2.5 sm:mt-3.5 grid grid-cols-2 gap-2 sm:gap-2.5">
              <Link
                href="/dashboard/orders"
                className="p-2 sm:p-2.5 rounded-xl border border-[#D8793F]/20 bg-[#FFF8EC] flex items-center justify-between hover:bg-[#FFF3DF] transition group"
              >
                <div>
                  <p className="text-base sm:text-xl font-black text-[#17372F]">{pendingPurchases}</p>
                  <p className="text-[9.5px] sm:text-[11px] font-bold text-[#566D7E]">Pending Hens</p>
                </div>
                <div className="size-7 sm:size-8 rounded-lg overflow-hidden bg-[#061A2B] shrink-0 border border-[#D8793F]/30 p-0.5">
                  <Image
                    src="/dashboard/brown-hen-3d.jpg"
                    alt="Pending Hen"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </Link>
              <Link
                href="/dashboard/sales-history"
                className="p-2 sm:p-2.5 rounded-xl border border-[#D8793F]/20 bg-[#FFF8EC] flex items-center justify-between hover:bg-[#FFF3DF] transition group"
              >
                <div>
                  <p className="text-base sm:text-xl font-black text-[#D8793F]">{openSaleRequests}</p>
                  <p className="text-[9.5px] sm:text-[11px] font-bold text-[#566D7E]">Pending Eggs</p>
                </div>
                <div className="size-7 sm:size-8 rounded-lg overflow-hidden bg-[#061A2B] shrink-0 border border-[#D8793F]/30 p-0.5">
                  <Image
                    src="/dashboard/golden-egg-3d.jpg"
                    alt="Pending Egg"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center justify-between text-[11px] sm:text-xs text-[#566D7E] border-t border-[#D8793F]/15 pt-2 sm:pt-2.5">
            <span className="font-bold">Active review queue</span>
            <Link href="/dashboard/orders" className="font-bold text-[#D8793F] hover:underline flex items-center gap-1">
              View Orders <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Community & Support Section (Clean Multi-Channel Grid) */}
      <section
        id="whatsapp"
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6"
        aria-label="Community and Support"
      >
        <div
          style={{
            boxShadow: "0 12px 28px rgba(15, 138, 104, 0.08), 0 3px 0 rgba(15, 138, 104, 0.2)",
          }}
          className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FCFFFD] via-[#F6FCF8] to-[#EEF8F2] border-2 border-[#0F8A68]/30 p-3.5 sm:p-5 relative overflow-hidden min-w-0 box-border"
        >

          {/* Section Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[#0F8A68]/15 pb-2.5 sm:pb-3 mb-2.5 sm:mb-3.5">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-[#0F8A68]/10 text-[#0F8A68] border border-[#0F8A68]/20">
                <span className="size-1.5 rounded-full bg-[#0F8A68] animate-pulse" /> WE ARE HERE TO HELP
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#0A3323] mt-1 flex items-center gap-1.5 leading-tight truncate">
                <MessageCircle size={18} className="text-[#0F8A68] shrink-0 fill-[#0F8A68]/20" />
                <span>WhatsApp Support</span>
              </h3>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#0F8A68] bg-[#0F8A68]/10 border border-[#0F8A68]/20 px-2 py-0.5 rounded-full shrink-0">
              24/7
            </span>
          </div>

          {/* Support Channels 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Channel 1: Admin Help-desk */}
            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Admin Help-desk on WhatsApp"
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
                  Help-desk
                </p>
              </div>
            </a>

            {/* Channel 2: Direct Owner Help */}
            <a
              href="https://wa.me/923007654321"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Owner Direct Help on WhatsApp"
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

            {/* Channel 3: Official News Channel */}
            <a
              href="https://whatsapp.com/channel/growmeta-egg"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Official News Channel on WhatsApp"
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

            {/* Channel 4: Member Community Group */}
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
        </div>

        {/* Intentionally Open Half matching Reference Composition */}
        <div className="hidden lg:block" />
      </section>

      {/* 6. Open Quick Access Section */}
      <section aria-label="Farm Shortcuts" className="pt-2 sm:pt-4 pb-1 sm:pb-2">
        <div className="flex items-baseline justify-between mb-3.5 sm:mb-6">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#8C3A14]">
              QUICK ACCESS
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-[28px] font-medium text-[#17372F] mt-0.5 tracking-tight">
              Farm shortcuts
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-[#566D7E]">Tap to open</span>
        </div>

        {/* 10 Dimensional Circular Shortcuts in 2 Rows of 5 */}
        <div className="grid grid-cols-5 gap-y-3 sm:gap-y-6 gap-x-1.5 sm:gap-x-4 md:gap-x-6">
          {quickShortcuts.map((item) => {
            const isGold = item.theme === "gold";
            const shortcutClass =
              "group flex flex-col items-center justify-start text-center focus:outline-none min-w-0 w-full cursor-pointer";
            const shortcutGraphic = (
              <>
                {/* Dimensional Circular Base matching reference */}
                <div
                  style={{
                    background: isGold
                      ? "linear-gradient(145deg, #FDE68A 0%, #F59E0B 45%, #D97706 80%, #92400E 100%)"
                      : "linear-gradient(145deg, #A7F3D0 0%, #10B981 45%, #059669 80%, #064E3B 100%)",
                    border: isGold
                      ? "2px solid rgba(254, 243, 199, 0.95)"
                      : "2px solid rgba(209, 250, 229, 0.95)",
                    boxShadow: isGold
                      ? "inset 0 2px 4px rgba(255, 255, 255, 0.75), inset 0 -4px 6px rgba(146, 64, 14, 0.45), 0 8px 18px rgba(180, 83, 9, 0.28), 0 3px 0 #78350F"
                      : "inset 0 2px 4px rgba(255, 255, 255, 0.75), inset 0 -4px 6px rgba(6, 78, 59, 0.5), 0 8px 18px rgba(5, 150, 105, 0.28), 0 3px 0 #064E3B",
                  }}
                  className="size-12 xs:size-14 sm:size-20 md:size-24 rounded-full p-1.5 sm:p-2.5 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 active:scale-95 shrink-0 relative"
                >
                  <Image
                    src={item.image}
                    alt={item.alt}
                    width={88}
                    height={88}
                    className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.22)] transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                {/* Clean Readable Label Underneath */}
                <span className="mt-1.5 sm:mt-2 text-[9px] xs:text-[11px] sm:text-xs md:text-[13px] font-bold text-[#17372F] group-hover:text-[#D8793F] transition-colors line-clamp-2 w-full max-w-[62px] xs:max-w-[80px] sm:max-w-[100px] leading-[1.15]">
                  {item.label}
                </span>
              </>
            );

            if (item.isLogout) {
              return (
                <LogoutConfirmation
                  key={item.label}
                  portal="user"
                  appearance="shortcut"
                >
                  {shortcutGraphic}
                </LogoutConfirmation>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={shortcutClass}
              >
                {shortcutGraphic}
              </Link>
            );
          })}
        </div>
      </section>

      {/* 7. Daily Egg Collection (Interactive Real-Time Countdown Timer) */}
      <HarvestCollectionTimer
        activeHens={activeHens}
        eggBalance={eggBalance}
        cycleStartIso={cycleStartIso}
        cycleEndIso={cycleEndIso}
        serverNowIso={serverNowIso}
      />

      {/* 8. Farm Performance Statistics (Clickable Links to History Hubs) */}
      <section aria-label="Farm Performance" className="pt-1 sm:pt-2">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              FARM PERFORMANCE
            </span>
            <h3 className="text-lg sm:text-2xl font-black text-[#17372F]">
              Your farming stats
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#566D7E]">Real-Time Ledger</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Stat 1: Total Hens -> /dashboard/hens/history */}
          <Link
            href="/dashboard/hens/history"
            style={{
              boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-2.5 sm:p-4 lg:p-5 relative group flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99] min-w-0 box-border min-h-[72px] sm:min-h-[92px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
            title="View complete hen and flock history"
          >

            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                <Image
                  src="/dashboard/brown-hen-3d.jpg"
                  alt="Total Hens"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-[#566D7E] truncate">Total Hens</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#17372F] leading-tight truncate">
                  {activeHens}
                </p>
                <p className="text-[9px] sm:text-[11px] font-semibold text-emerald-700 truncate">Active flock</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/40 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block" />
          </Link>

          {/* Stat 2: Available Eggs -> /dashboard/egg-history */}
          <Link
            href="/dashboard/egg-history"
            style={{
              boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-2.5 sm:p-4 lg:p-5 relative group flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99] min-w-0 box-border min-h-[72px] sm:min-h-[92px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
            title="View complete egg ledger history"
          >
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                <Image
                  src="/dashboard/golden-egg-3d.jpg"
                  alt="Available Eggs"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-[#566D7E] truncate">Available Eggs</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#D8793F] leading-tight truncate">
                  {eggBalance}
                </p>
                <p className="text-[9px] sm:text-[11px] font-semibold text-[#566D7E] truncate">Ready to sell</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/40 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block" />
          </Link>

          {/* Stat 3: Sold Eggs -> /dashboard/sales-history */}
          <Link
            href="/dashboard/sales-history"
            style={{
              boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-2.5 sm:p-4 lg:p-5 relative group flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99] min-w-0 box-border min-h-[72px] sm:min-h-[92px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
            title="View complete sold eggs and trades history"
          >
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                <Image
                  src="/dashboard/egg-basket-3d.jpg"
                  alt="Sold Eggs"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-[#566D7E] truncate">Sold Eggs</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#17372F] leading-tight truncate">
                  {soldEggs}
                </p>
                <p className="text-[9px] sm:text-[11px] font-semibold text-emerald-700 truncate">Completed</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/40 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block" />
          </Link>

          {/* Stat 4: Total Investment -> /dashboard/orders */}
          <Link
            href="/dashboard/orders"
            style={{
              boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-2.5 sm:p-4 lg:p-5 relative group flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99] min-w-0 box-border min-h-[72px] sm:min-h-[92px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
            title="View approved hen investment orders"
          >
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                <Image
                  src="/dashboard/farm-payout-3d.jpg"
                  alt="Total Investment"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-[#566D7E] truncate">Total Investment</p>
                <p className="text-sm sm:text-xl lg:text-2xl font-black text-[#17372F] leading-tight truncate">
                  Rs {totalInvestmentRs.toLocaleString()}
                </p>
                <p className="text-[9px] sm:text-[11px] font-semibold text-[#566D7E] truncate">Approved orders</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/40 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block" />
          </Link>

          {/* Stat 5: Referral Bonus -> /dashboard/referrals */}
          <Link
            href="/dashboard/referrals"
            style={{
              boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-2.5 sm:p-4 lg:p-5 relative group flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99] min-w-0 box-border min-h-[72px] sm:min-h-[92px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
            title="View referral network and earned bonuses"
          >
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                <Image
                  src="/dashboard/chicks-flock-3d.jpg"
                  alt="Referral Bonus"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-[#566D7E] truncate">Referral Bonus</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#D8793F] leading-tight truncate">
                  {referralBonusEggs} <span className="text-xs font-bold">Eggs</span>
                </p>
                <p className="text-[9px] sm:text-[11px] font-semibold text-emerald-700 truncate">Earned rewards</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/40 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block" />
          </Link>

          {/* Stat 6: Egg Earnings -> /dashboard/sales-history */}
          <Link
            href="/dashboard/sales-history"
            style={{
              boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-2.5 sm:p-4 lg:p-5 relative group flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99] min-w-0 box-border min-h-[72px] sm:min-h-[92px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
            title="View paid out egg earnings"
          >
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                <Image
                  src="/dashboard/qa_sell_eggs.jpg"
                  alt="Egg Earnings"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-[#566D7E] truncate">Egg Earnings</p>
                <p className="text-sm sm:text-xl lg:text-2xl font-black text-[#2D9B78] leading-tight truncate">
                  Rs {eggEarningsRs.toLocaleString()}
                </p>
                <p className="text-[9px] sm:text-[11px] font-semibold text-[#566D7E] truncate">Paid out</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/40 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block" />
          </Link>

          {/* Stat 7: Total Paid -> /dashboard/payouts */}
          <Link
            href="/dashboard/payouts"
            style={{
              boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
            }}
            className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-2.5 sm:p-4 lg:p-5 relative group flex items-center justify-between transition-transform hover:-translate-y-0.5 active:scale-[0.99] min-w-0 box-border min-h-[72px] sm:min-h-[92px] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8793F]"
            title="View settled cash payouts"
          >
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              <div className="size-10 sm:size-14 lg:size-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                <Image
                  src="/dashboard/qa_payments.jpg"
                  alt="Total Paid"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-[#566D7E] truncate">Total Paid</p>
                <p className="text-sm sm:text-xl lg:text-2xl font-black text-emerald-800 leading-tight truncate">
                  Rs {totalPaidRs.toLocaleString()}
                </p>
                <p className="text-[9px] sm:text-[11px] font-semibold text-emerald-700 truncate">Settled payouts</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/40 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1 hidden sm:block" />
          </Link>
        </div>
      </section>

      {/* 8.5 NEW: Compact Farm Records Section (Directly Below Stats & Above Notices) */}
      <section
        style={{
          boxShadow: "0 8px 20px rgba(16, 34, 45, 0.06), 0 2px 0 rgba(216, 121, 63, 0.15)",
        }}
        className="rounded-2xl sm:rounded-3xl bg-[#FFFDF4] border border-[#D8793F]/25 p-3.5 sm:p-5 box-border min-w-0 space-y-3"
        aria-label="Farm Records"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              FARM RECORDS
            </span>
            <h4 className="text-sm sm:text-base font-black text-[#17372F] mt-0.5 leading-tight">
              Farm Records
            </h4>
            <p className="text-[11px] sm:text-xs text-[#566D7E] mt-0.5">
              View your complete hen, egg, sale and payout history.
            </p>
          </div>
        </div>

        {/* 4 History Buttons Grid (4 cols on desktop, 2 on tablet/mobile, 1 on very small) */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Button 1: Hen History */}
          <Link
            href="/dashboard/hens/history"
            className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] hover:bg-[#FFF3DF] hover:border-[#D8793F]/45 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[46px] min-w-0 focus-visible:ring-2 focus-visible:ring-[#D8793F]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#D8793F]/15 text-[#8C3A14] shrink-0 group-hover:scale-105 transition-transform">
                <Sprout size={16} className="sm:w-4.5 sm:h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#17372F] group-hover:text-[#8C3A14] transition-colors leading-tight truncate">
                  Hen History
                </p>
                <p className="text-[10px] font-bold text-[#566D7E] mt-0.5 truncate">
                  {henRecordsCount} {henRecordsCount === 1 ? "record" : "records"}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/60 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </Link>

          {/* Button 2: Egg History */}
          <Link
            href="/dashboard/egg-history"
            className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] hover:bg-[#FFF3DF] hover:border-[#D8793F]/45 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[46px] min-w-0 focus-visible:ring-2 focus-visible:ring-[#D8793F]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#D8793F]/15 text-[#8C3A14] shrink-0 group-hover:scale-105 transition-transform">
                <Egg size={16} className="sm:w-4.5 sm:h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#17372F] group-hover:text-[#8C3A14] transition-colors leading-tight truncate">
                  Egg History
                </p>
                <p className="text-[10px] font-bold text-[#566D7E] mt-0.5 truncate">
                  {eggHistoryCount} {eggHistoryCount === 1 ? "record" : "records"}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/60 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </Link>

          {/* Button 3: Sold Egg History */}
          <Link
            href="/dashboard/sales-history"
            className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] hover:bg-[#FFF3DF] hover:border-[#D8793F]/45 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[46px] min-w-0 focus-visible:ring-2 focus-visible:ring-[#D8793F]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#D8793F]/15 text-[#8C3A14] shrink-0 group-hover:scale-105 transition-transform">
                <Banknote size={16} className="sm:w-4.5 sm:h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#17372F] group-hover:text-[#8C3A14] transition-colors leading-tight truncate">
                  Sold Egg History
                </p>
                <p className="text-[10px] font-bold text-[#566D7E] mt-0.5 truncate">
                  {soldEggHistoryCount} {soldEggHistoryCount === 1 ? "trade" : "trades"}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/60 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </Link>

          {/* Button 4: Payout History */}
          <Link
            href="/dashboard/payouts"
            className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] hover:bg-[#FFF3DF] hover:border-[#D8793F]/45 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-h-[46px] min-w-0 focus-visible:ring-2 focus-visible:ring-[#D8793F]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-[#D8793F]/15 text-[#8C3A14] shrink-0 group-hover:scale-105 transition-transform">
                <WalletCards size={16} className="sm:w-4.5 sm:h-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#17372F] group-hover:text-[#8C3A14] transition-colors leading-tight truncate">
                  Payout History
                </p>
                <p className="text-[10px] font-bold text-[#566D7E] mt-0.5 truncate">
                  {payoutHistoryCount} {payoutHistoryCount === 1 ? "payout" : "payouts"}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#D8793F]/60 group-hover:text-[#D8793F] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </Link>
        </div>
      </section>

      {/* 9. Compact Recent Updates Bar */}
      <section
        style={{
          boxShadow: "0 8px 20px rgba(16, 34, 45, 0.06), 0 2px 0 rgba(216, 121, 63, 0.15)",
        }}
        className="rounded-2xl sm:rounded-3xl bg-[#FFFDF4] border border-[#D8793F]/25 p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 box-border min-w-0"
        aria-label="Recent Updates"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span className="grid size-9 sm:size-10 place-items-center rounded-xl sm:rounded-2xl bg-[#D8793F]/15 text-[#8C3A14] shrink-0">
            <History size={18} className="sm:w-5 sm:h-5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-[#17372F] truncate">Account History &amp; Notices</h4>
            <p className="text-[11px] sm:text-xs text-[#566D7E] truncate">
              View your complete activity timeline and notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <Link
            href="/dashboard/activity"
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-xl border border-[#D8793F]/30 bg-[#FFF8EC] px-3 sm:px-3.5 py-2 text-xs font-bold text-[#8C3A14] hover:bg-[#FFF3DF] transition min-h-[38px] sm:min-h-[40px]"
          >
            <Activity size={14} /> Full Activity
          </Link>
          <Link
            href="/dashboard/notifications"
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-xl border border-[#D8793F]/30 bg-[#FFF8EC] px-3 sm:px-3.5 py-2 text-xs font-bold text-[#8C3A14] hover:bg-[#FFF3DF] transition min-h-[38px] sm:min-h-[40px]"
          >
            <Bell size={14} /> Notifications
          </Link>
        </div>
      </section>

      {/* 10. Farm Footer */}
      <footer className="pt-3 sm:pt-4 pb-4 sm:pb-6 text-center text-xs font-semibold text-[#566D7E] border-t border-[#D8793F]/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
        <p>© 2026 GrowMeta Egg. All rights reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs">
          <Link href="/dashboard/plans" className="hover:text-[#D8793F] transition">
            Plans
          </Link>
          <Link href="/dashboard/sell-eggs" className="hover:text-[#D8793F] transition">
            Sell Eggs
          </Link>
          <Link href="/dashboard/referrals" className="hover:text-[#D8793F] transition">
            Referrals
          </Link>
          <a
            href="https://chat.whatsapp.com/growmeta-egg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] font-bold hover:underline"
          >
            WhatsApp Support
          </a>
        </div>
      </footer>
    </div>
  );
}
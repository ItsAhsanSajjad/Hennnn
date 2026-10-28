"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Crown,
  Egg,
  History,
  Landmark,
  Lock,
  PauseCircle,
  Receipt,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  TrendingUp,
  Truck,
  WalletCards,
} from "lucide-react";

import { ActivePayoutsCard, type ActivePayoutItem } from "./active-payouts-card";
import { EggMarketSellModal } from "./egg-market-sell-modal";
import type { EggMarketWithEligibility } from "@/server/services/egg-market-service";

interface EggMarketsClientProps {
  markets: EggMarketWithEligibility[];
  stats: {
    availableEggs: number;
    reservedEggs?: number;
    pendingPayoutAmountRs?: number;
    bestAvailableRateRs: number;
    estimatedMaxValueRs: number;
    completedSalesCount: number;
    totalEggsSold: number;
    totalEarnedPaisa: bigint | string;
    totalEarnedRs: number;
  };
  activePayouts?: ActivePayoutItem[];
  recentSales: {
    id: string;
    publicReference: string;
    eggQuantity: number;
    totalAmountPaisa: bigint | string;
    pricePerEggPaisaSnapshot: bigint | string;
    status: string;
    payoutMethod?: string;
    accountNumberMasked?: string | null;
    adminTransactionId?: string | null;
    createdAt: Date | string;
    market: {
      id: string;
      name: string;
      code: string;
      icon: string | null;
      imagePath?: string | null;
    };
  }[];
}

const MARKET_FALLBACK_ICONS: Record<string, any> = {
  Egg,
  Store,
  Building2,
  Landmark,
  Scale,
  Truck,
  TrendingUp,
  Sprout,
  ShieldCheck,
  Crown,
};

export function EggMarketsClient({
  markets,
  stats,
  activePayouts = [],
  recentSales,
}: EggMarketsClientProps) {
  const [selectedMarket, setSelectedMarket] = useState<EggMarketWithEligibility | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "eligible" | "highest" | "wholesale">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const availableEggs = stats.availableEggs;
  const hasEggs = availableEggs > 0;
  const reservedEggs = stats.reservedEggs ?? 0;
  const pendingPayoutRs = stats.pendingPayoutAmountRs ?? 0;

  const eligibleCount = markets.filter((m) => m.isEligible).length;

  const filteredMarkets = useMemo(() => {
    let list = [...markets];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)),
      );
    }

    if (filterTab === "eligible") {
      return list.filter((m) => m.isEligible);
    }
    if (filterTab === "highest") {
      return list.sort((a, b) => b.pricePerEggRs - a.pricePerEggRs);
    }
    if (filterTab === "wholesale") {
      return list.filter((m) => m.minEggs >= 500);
    }
    return list;
  }, [markets, filterTab, searchQuery]);

  const handleOpenSellModal = (market: EggMarketWithEligibility) => {
    setSelectedMarket(market);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Banner */}
      <section
        style={{
          background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
          boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
        }}
        className="relative overflow-hidden rounded-3xl border-2 border-[#D8793F]/40 p-6 sm:p-8 md:p-10 text-white group"
        aria-label="Egg Markets Hero"
      >
        <div className="absolute -right-8 -top-8 size-64 rounded-full border-2 border-[#D8793F]/15 pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 size-80 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#D8793F]/25 text-[#FFD0A5] border border-[#D8793F]/40">
              <Sparkles size={13} /> OFFICIAL WHOLESALE EGG MARKETS
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black text-[#F59B52] tracking-tight leading-tight">
              {availableEggs.toLocaleString()}{" "}
              <span className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold">
                Eggs Available
              </span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#DCE8E8] leading-relaxed">
              Sell your collected hen eggs across 10 official wholesale trading desks. Receive direct manual cash transfers to your JazzCash or Easypaisa account.
            </p>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 shrink-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-bold text-white border border-white/15 transition active:scale-95"
            >
              <Egg size={16} /> Collect More Eggs
            </Link>
            <Link
              href="/dashboard/egg-ledger"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#D8793F]/20 hover:bg-[#D8793F]/30 text-xs sm:text-sm font-bold text-[#FFD0A5] border border-[#D8793F]/30 transition active:scale-95"
            >
              <History size={16} /> Egg Audit Ledger
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Four Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Available Balance */}
        <div
          style={{
            background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
            boxShadow: "0 8px 20px rgba(6, 26, 43, 0.35)",
          }}
          className="rounded-2xl border border-[#D8793F]/30 p-4 sm:p-5 text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8FA2B0] uppercase tracking-wider">
              Available Eggs
            </span>
            <div className="size-8 rounded-xl bg-[#D8793F]/20 text-[#FFD0A5] grid place-items-center">
              <Egg size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-white">
              {availableEggs.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold">
              Ready to sell now
            </span>
          </div>
        </div>

        {/* Metric 2: Best Available Rate */}
        <div
          style={{
            background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
            boxShadow: "0 8px 20px rgba(6, 26, 43, 0.35)",
          }}
          className="rounded-2xl border border-[#D8793F]/30 p-4 sm:p-5 text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8FA2B0] uppercase tracking-wider">
              Top Market Rate
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-300 grid place-items-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
              PKR 60.00
            </p>
            <span className="text-[11px] text-[#8FA2B0] font-medium">
              VIP tier buyback rate
            </span>
          </div>
        </div>

        {/* Metric 3: Estimated Potential Value */}
        <div
          style={{
            background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
            boxShadow: "0 8px 20px rgba(6, 26, 43, 0.35)",
          }}
          className="rounded-2xl border border-[#D8793F]/30 p-4 sm:p-5 text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8FA2B0] uppercase tracking-wider">
              Estimated Max Value
            </span>
            <div className="size-8 rounded-xl bg-[#F59B52]/20 text-[#F59B52] grid place-items-center">
              <Coins size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-[#FFD0A5]">
              PKR {stats.estimatedMaxValueRs.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[11px] text-[#8FA2B0] font-medium">
              at eligible tier rates
            </span>
          </div>
        </div>

        {/* Metric 4: Reserved / Pending Payouts */}
        <div
          style={{
            background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
            boxShadow: "0 8px 20px rgba(6, 26, 43, 0.35)",
          }}
          className="rounded-2xl border border-[#D8793F]/30 p-4 sm:p-5 text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8FA2B0] uppercase tracking-wider">
              In Payout Queue
            </span>
            <div className="size-8 rounded-xl bg-blue-500/20 text-blue-300 grid place-items-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-blue-400">
              PKR {pendingPayoutRs.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[11px] text-[#8FA2B0] font-medium">
              {reservedEggs.toLocaleString()} eggs reserved
            </span>
          </div>
        </div>
      </div>

      {/* 3. Active Payouts Timeline Widget (if any) */}
      {activePayouts && activePayouts.length > 0 && (
        <ActivePayoutsCard
          payouts={activePayouts}
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* 4. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#061A2B] border border-[#D8793F]/30 overflow-x-auto">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              filterTab === "all"
                ? "bg-[#D8793F] text-white shadow-md shadow-[#D8793F]/30"
                : "text-[#8FA2B0] hover:text-white hover:bg-white/5"
            }`}
          >
            All Markets ({markets.length})
          </button>
          <button
            onClick={() => setFilterTab("eligible")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              filterTab === "eligible"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-[#8FA2B0] hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-400"></span>
            Eligible Now ({eligibleCount})
          </button>
          <button
            onClick={() => setFilterTab("highest")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              filterTab === "highest"
                ? "bg-[#D8793F] text-white shadow-md shadow-[#D8793F]/30"
                : "text-[#8FA2B0] hover:text-white hover:bg-white/5"
            }`}
          >
            Highest Rate
          </button>
          <button
            onClick={() => setFilterTab("wholesale")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              filterTab === "wholesale"
                ? "bg-[#D8793F] text-white shadow-md shadow-[#D8793F]/30"
                : "text-[#8FA2B0] hover:text-white hover:bg-white/5"
            }`}
          >
            Wholesale Desk
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8FA2B0]" />
          <input
            type="text"
            placeholder="Search egg markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#061A2B] border border-[#D8793F]/30 text-xs font-medium text-white placeholder:text-[#8FA2B0]/50 focus:border-[#F59B52] focus:outline-none transition"
          />
        </div>
      </div>

      {/* 5. 2-Column Desktop Grid Layout */}
      {filteredMarkets.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#09263A]/40 border-2 border-dashed border-[#D8793F]/30 space-y-4">
          <div className="size-16 rounded-full bg-white/5 text-[#8FA2B0] grid place-items-center mx-auto">
            <Store size={32} />
          </div>
          <h3 className="text-xl font-bold text-white">No Egg Markets Found</h3>
          <p className="text-xs text-[#8FA2B0] max-w-sm mx-auto">
            {filterTab === "eligible"
              ? "You do not currently meet the minimum egg requirement for any market in this view. Harvest eggs daily to unlock higher tier desks."
              : "No markets match your current search query. Try clearing the filter."}
          </p>
          <button
            onClick={() => {
              setFilterTab("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#D8793F]/20 text-[#FFD0A5] hover:bg-[#D8793F]/30 border border-[#D8793F]/30 transition"
          >
            View All 10 Markets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMarkets.map((market) => {
            const isEligible = market.isEligible;
            const isPaused = market.isPaused;
            const priceRs = market.pricePerEggRs;
            const minEggs = market.minEggs;
            const maxEggs = market.maxEggs;
            const eggsNeeded = market.eggsNeeded;
            const progressPct = Math.min(100, Math.floor((availableEggs / minEggs) * 100));

            return (
              <div
                key={market.id}
                style={{
                  background: "linear-gradient(180deg, #09263A 0%, #061A2B 100%)",
                  boxShadow: isEligible
                    ? "0 12px 28px rgba(6, 26, 43, 0.45), 0 0 0 1px rgba(216, 121, 63, 0.35)"
                    : "0 8px 20px rgba(6, 26, 43, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)",
                }}
                className={`flex flex-col justify-between rounded-3xl border-2 transition-all duration-200 overflow-hidden ${
                  isEligible
                    ? "border-[#D8793F]/50 hover:border-[#F59B52] hover:shadow-xl hover:shadow-[#D8793F]/15"
                    : "border-white/10 opacity-90"
                }`}
              >
                {/* Top 16:9 Image Banner */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#061A2B]">
                  {market.imagePath ? (
                    <Image
                      src={market.imagePath}
                      alt={market.imageAlt || market.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 560px"
                    />
                  ) : (
                    <div className="size-full grid place-items-center bg-[#071C2E] text-[#F59B52] font-black text-2xl">
                      {market.name}
                    </div>
                  )}

                  {/* Gradient overlay for badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09263A] via-transparent to-black/40 pointer-events-none" />

                  {/* Top Left: Verified & Code Badges */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-[#FFD0A5] border border-white/15">
                      {market.code}
                    </span>
                    {market.isVerified && (
                      <span className="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-emerald-500/80 backdrop-blur-md text-white border border-emerald-400/40 flex items-center gap-1">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    )}
                  </div>

                  {/* Top Right: Status Badge */}
                  <div className="absolute top-3.5 right-3.5">
                    {isPaused ? (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/80 backdrop-blur-md text-black flex items-center gap-1">
                        <PauseCircle size={11} /> Paused
                      </span>
                    ) : isEligible ? (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/90 backdrop-blur-md text-black flex items-center gap-1 font-black shadow-lg">
                        <CheckCircle2 size={11} /> Eligible to Sell
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Lock size={11} /> Need {eggsNeeded} Eggs
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Overlay: Buyback Rate Tag */}
                  <div className="absolute bottom-3 right-3">
                    <div className="px-3.5 py-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-[#F59B52]/50 text-right shadow-xl">
                      <span className="text-[10px] font-bold text-[#8FA2B0] uppercase block">
                        Rate Per Egg
                      </span>
                      <span className="text-lg font-black text-emerald-400">
                        PKR {priceRs.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{market.name}</h3>
                    <p className="mt-1 text-xs text-[#8FA2B0] line-clamp-2 leading-relaxed">
                      {market.description || "Official wholesale poultry trade desk."}
                    </p>
                  </div>

                  {/* Crate Specs Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#061A2B] border border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#8FA2B0] uppercase block">
                        Egg Limit
                      </span>
                      <span className="font-bold text-[#FFD0A5]">
                        {minEggs} - {maxEggs} Eggs
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#8FA2B0] uppercase block">
                        Max Payout / Trade
                      </span>
                      <span className="font-bold text-emerald-400">
                        PKR {(maxEggs * priceRs).toLocaleString("en-PK")}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar towards eligibility if locked */}
                  {!isEligible && !isPaused && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#8FA2B0]">
                        <span>Egg Requirement Progress</span>
                        <span className="text-white font-bold">
                          {availableEggs} / {minEggs} ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-[#F59B52] rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    {isPaused ? (
                      <button
                        disabled
                        className="w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-white/5 text-[#8FA2B0] border border-white/10 cursor-not-allowed"
                      >
                        Market Temporarily Paused
                      </button>
                    ) : isEligible ? (
                      <button
                        onClick={() => handleOpenSellModal(market)}
                        style={{
                          background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                          boxShadow: "0 2px 0 #9E4A1A, 0 4px 14px rgba(216, 121, 63, 0.4)",
                        }}
                        className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2"
                      >
                        <Banknote size={16} />
                        <span>Sell Eggs to {market.name}</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-white/5 text-[#8FA2B0] border border-white/10 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Lock size={13} />
                        <span>Requires {eggsNeeded} More Eggs</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Professional Redesigned Recent Sales History Section */}
      <section
        style={{
          background: "linear-gradient(180deg, #09263A 0%, #061A2B 100%)",
          boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 0 0 1px rgba(216, 121, 63, 0.3)",
        }}
        className="rounded-3xl border-2 border-[#D8793F]/40 p-5 sm:p-7 text-white space-y-5"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-[#D8793F]/20 text-[#FFD0A5] border border-[#D8793F]/40 grid place-items-center shrink-0 shadow-lg shadow-[#D8793F]/10">
              <History size={20} className="text-[#F59B52]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Recent Market Trades & Settlements
                </h3>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-[#FFD0A5] border border-white/10">
                  {recentSales.length} {recentSales.length === 1 ? "Record" : "Records"}
                </span>
              </div>
              <p className="text-xs text-[#8FA2B0] mt-0.5">
                Verified audit record of your egg sales and direct cash transfers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/dashboard/egg-ledger"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#D8793F]/20 hover:bg-[#D8793F]/30 text-[#FFD0A5] hover:text-white border border-[#D8793F]/35 transition active:scale-95 shadow-sm"
            >
              <span>Full Egg Ledger</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {recentSales.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#061A2B]/60 border border-white/5 space-y-3">
            <div className="size-12 rounded-full bg-white/5 text-[#8FA2B0] grid place-items-center mx-auto">
              <Receipt size={24} />
            </div>
            <p className="text-sm font-bold text-white">No Egg Market Trades Yet</p>
            <p className="text-xs text-[#8FA2B0] max-w-sm mx-auto">
              Choose an eligible market above to sell your first batch of collected eggs for instant PKR cash payouts.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View Table (Hidden on Mobile) */}
            <div className="hidden md:block rounded-2xl border border-white/10 bg-[#061A2B]/80 overflow-hidden shadow-inner">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#DCE8E8]">
                  <thead className="bg-[#051523] border-b border-white/10 text-[10px] font-black uppercase tracking-wider text-[#8FA2B0]">
                    <tr>
                      <th className="px-5 py-3.5">Trade Reference</th>
                      <th className="px-5 py-3.5">Market Desk</th>
                      <th className="px-5 py-3.5">Eggs Traded</th>
                      <th className="px-5 py-3.5">Payout Amount</th>
                      <th className="px-5 py-3.5">Destination Account</th>
                      <th className="px-5 py-3.5">Settlement Status</th>
                      <th className="px-5 py-3.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {recentSales.map((sale) => {
                      const totalRs = Number(sale.totalAmountPaisa) / 100;
                      const pricePerEggRs = Number(sale.pricePerEggPaisaSnapshot) / 100;
                      const isPaid = sale.status === "PAID" || sale.status === "COMPLETED";
                      const isProcessing = sale.status === "PROCESSING";
                      const isPending = sale.status === "PENDING_PAYMENT";
                      const isRejected = sale.status === "REJECTED";

                      const methodLogo =
                        sale.payoutMethod === "EASYPAISA"
                          ? "/assets/payment-methods/easypaisa-logo.png"
                          : "/assets/payment-methods/jazzcash-logo.svg";

                      return (
                        <tr key={sale.id} className="hover:bg-white/[0.03] transition-colors group">
                          {/* Reference */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-[#FFD0A5] text-xs">
                                {sale.publicReference}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sale.publicReference);
                                }}
                                className="opacity-60 hover:opacity-100 text-[#8FA2B0] hover:text-white transition"
                                title="Copy Reference Code"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            <span className="text-[10px] text-[#8FA2B0] block mt-0.5">
                              {new Date(sale.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>

                          {/* Market */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative size-7 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                                {sale.market.imagePath ? (
                                  <Image
                                    src={sale.market.imagePath}
                                    alt={sale.market.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="size-full grid place-items-center text-[10px] font-black text-[#F59B52]">
                                    EG
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block">
                                  {sale.market.name}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  @ PKR {pricePerEggRs.toFixed(2)}/egg
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Eggs Sold */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs">
                              <Egg size={13} className="text-[#F59B52]" />
                              {sale.eggQuantity.toLocaleString()} Eggs
                            </span>
                          </td>

                          {/* Payout PKR */}
                          <td className="px-5 py-4">
                            <span className="text-sm font-black text-emerald-400">
                              PKR {totalRs.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Destination */}
                          <td className="px-5 py-4">
                            {sale.accountNumberMasked ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                                <div className="relative size-3.5 shrink-0">
                                  <Image
                                    src={methodLogo}
                                    alt={sale.payoutMethod || "JazzCash"}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <span className="font-mono text-[11px] text-[#FFD0A5] font-bold">
                                  {sale.accountNumberMasked}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted text-[11px]">Instant Trade</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isPaid
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : isProcessing
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                                  : isRejected
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {isPaid ? (
                                <CheckCircle2 size={12} className="text-emerald-400" />
                              ) : isProcessing ? (
                                <Clock size={12} className="text-blue-400" />
                              ) : isRejected ? (
                                <AlertCircle size={12} className="text-rose-400" />
                              ) : (
                                <Clock size={12} className="text-amber-400" />
                              )}
                              <span>
                                {isPaid
                                  ? "Paid & Verified"
                                  : isProcessing
                                  ? "Processing"
                                  : isRejected
                                  ? "Rejected"
                                  : "Pending Payout"}
                              </span>
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4 text-right text-xs text-[#8FA2B0] font-mono">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View Responsive Card List (Visible on Small Screens) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {recentSales.map((sale) => {
                const totalRs = Number(sale.totalAmountPaisa) / 100;
                const pricePerEggRs = Number(sale.pricePerEggPaisaSnapshot) / 100;
                const isPaid = sale.status === "PAID" || sale.status === "COMPLETED";
                const isProcessing = sale.status === "PROCESSING";
                const isRejected = sale.status === "REJECTED";

                const methodLogo =
                  sale.payoutMethod === "EASYPAISA"
                    ? "/assets/payment-methods/easypaisa-logo.png"
                    : "/assets/payment-methods/jazzcash-logo.svg";

                return (
                  <div
                    key={sale.id}
                    className="p-4 rounded-2xl bg-[#061A2B] border border-white/10 space-y-3"
                  >
                    {/* Top Row: Market & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative size-6 rounded-md overflow-hidden bg-white/5 border border-white/10 shrink-0">
                          {sale.market.imagePath ? (
                            <Image
                              src={sale.market.imagePath}
                              alt={sale.market.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="size-full grid place-items-center text-[9px] font-black text-[#F59B52]">
                              EG
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-white text-xs">{sale.market.name}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isPaid
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : isProcessing
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : isRejected
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>

                    {/* Middle Row: Eggs & Amount */}
                    <div className="flex items-center justify-between py-2 border-y border-white/5">
                      <div>
                        <span className="text-[10px] text-[#8FA2B0] uppercase block">Sold</span>
                        <span className="font-black text-[#FFD0A5] text-xs">
                          {sale.eggQuantity.toLocaleString()} Eggs @ PKR {pricePerEggRs.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8FA2B0] uppercase block">Payout</span>
                        <span className="font-black text-emerald-400 text-sm">
                          PKR {totalRs.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Reference & Destination */}
                    <div className="flex items-center justify-between text-[11px] text-[#8FA2B0]">
                      <span className="font-mono text-[10px] text-[#FFD0A5]">
                        {sale.publicReference}
                      </span>
                      {sale.accountNumberMasked && (
                        <div className="flex items-center gap-1">
                          <div className="relative size-3">
                            <Image
                              src={methodLogo}
                              alt={sale.payoutMethod || "Method"}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="font-mono text-[10px] text-white">
                            {sale.accountNumberMasked}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* 7. Egg Market Sell Modal */}
      <EggMarketSellModal
        market={selectedMarket}
        availableEggs={availableEggs}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMarket(null);
        }}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

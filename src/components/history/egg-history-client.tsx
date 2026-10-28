"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bird,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Egg,
  ExternalLink,
  Filter,
  Gift,
  History,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Sprout,
  Tag,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { SubpageHeader } from "@/components/dashboard/shared/subpage-header";
import { StatisticsStrip, StatItem } from "@/components/dashboard/shared/stat-card";
import { formatDateTime } from "@/lib/utilities/format";

export type EggLedgerRecord = {
  id: string;
  reference: string;
  entryType: string;
  displayEventType: string;
  eggUnits: number;
  description: string;
  createdAt: string;
  sourceType: string;
  sourceId: string | null;
  runningBalanceSnapshot?: number;
  relatedEntity?: {
    type: "HEN" | "SALE" | "REFERRAL" | "ADMIN" | "OTHER";
    label: string;
    subtext?: string;
    href?: string;
  };
  status: "COMPLETED" | "REVERSED";
  metadata?: Record<string, any> | null;
};

interface EggHistoryClientProps {
  records: EggLedgerRecord[];
  availableBalance: number;
  totalHarvested: number;
  totalSoldEggs: number;
  referralBonusEggs: number;
}

export function EggHistoryClient({
  records,
  availableBalance,
  totalHarvested,
  totalSoldEggs,
  referralBonusEggs,
}: EggHistoryClientProps) {
  const [selectedEventType, setSelectedEventType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "7DAYS" | "30DAYS">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<EggLedgerRecord | null>(null);

  const pageSize = 15;

  const stats: StatItem[] = [
    {
      label: "Available Eggs",
      value: `${availableBalance.toLocaleString()} Eggs`,
      subtext: "Ready to sell / hold",
      subtextColor: "emerald",
      icon: Egg,
      iconBg: "copper",
    },
    {
      label: "Total Harvested",
      value: `${totalHarvested.toLocaleString()} Eggs`,
      subtext: "Lifetime production",
      subtextColor: "neutral",
      icon: Sprout,
      iconBg: "emerald",
    },
    {
      label: "Total Sold / Redeemed",
      value: `${totalSoldEggs.toLocaleString()} Eggs`,
      subtext: "Market trades",
      subtextColor: "neutral",
      icon: TrendingDown,
      iconBg: "copper",
    },
    {
      label: "Referral Bonus",
      value: `${referralBonusEggs.toLocaleString()} Eggs`,
      subtext: "Community rewards",
      subtextColor: "emerald",
      icon: Gift,
      iconBg: "emerald",
    },
  ];

  const filteredRecords = useMemo(() => {
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    return records.filter((rec) => {
      // Event type filter
      if (selectedEventType !== "ALL") {
        if (selectedEventType === "PRODUCED" && rec.entryType !== "PRODUCTION_CREDIT") return false;
        if (selectedEventType === "SALE" && rec.entryType !== "EGG_SALE") return false;
        if (selectedEventType === "REFERRAL" && rec.entryType !== "REFERRAL_REWARD") return false;
        if (
          selectedEventType === "ADJUSTMENT" &&
          rec.entryType !== "ADMIN_CREDIT" &&
          rec.entryType !== "ADMIN_DEBIT" &&
          rec.entryType !== "ADMIN_ADJUSTMENT"
        )
          return false;
        if (selectedEventType === "REVERSAL" && rec.entryType !== "REVERSAL") return false;
      }

      // Date filter
      if (dateFilter !== "ALL") {
        const itemTime = new Date(rec.createdAt).getTime();
        if (dateFilter === "7DAYS" && now - itemTime > sevenDaysMs) return false;
        if (dateFilter === "30DAYS" && now - itemTime > thirtyDaysMs) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = rec.reference.toLowerCase().includes(q);
        const matchesDesc = rec.description.toLowerCase().includes(q);
        const matchesSource = rec.relatedEntity?.label.toLowerCase().includes(q) || false;
        return matchesRef || matchesDesc || matchesSource;
      }

      return true;
    });
  }, [records, selectedEventType, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const getEventBadge = (rec: EggLedgerRecord) => {
    const isCredit = rec.eggUnits > 0;
    if (rec.entryType === "PRODUCTION_CREDIT") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          <Sprout size={12} className="text-emerald-600" /> Daily Harvest
        </span>
      );
    }
    if (rec.entryType === "EGG_SALE") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#D8793F]/30 bg-[#FFF8EC] px-2.5 py-0.5 text-[11px] font-bold text-[#8C3A14]">
          <TrendingDown size={12} className="text-[#D8793F]" /> Market Sale
        </span>
      );
    }
    if (rec.entryType === "REFERRAL_REWARD") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-600/30 bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-800">
          <Gift size={12} className="text-purple-600" /> Refer Reward
        </span>
      );
    }
    if (rec.entryType === "REVERSAL") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-600/30 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
          <RotateCcw size={12} className="text-red-600" /> Reversal
        </span>
      );
    }
    if (rec.entryType.startsWith("ADMIN_")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-600/30 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
          <History size={12} className="text-blue-600" /> System Adjustment
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700">
        {rec.displayEventType}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-36 sm:pb-28">
      <SubpageHeader
        badge="Egg Ledger & Balance History"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard/sell-eggs"
        actionLabel="Sell Eggs Now"
        actionIcon="egg"
      />

      <StatisticsStrip stats={stats} />

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 bg-[#FFFDF4] border border-[#D8793F]/25 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_8px_20px_rgba(16,34,45,0.05)]">
        {/* Row 1: Event Type Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "All Events" },
            { id: "PRODUCED", label: "Harvests" },
            { id: "SALE", label: "Sales & Trades" },
            { id: "REFERRAL", label: "Referral Rewards" },
            { id: "ADJUSTMENT", label: "Adjustments" },
            { id: "REVERSAL", label: "Reversals" },
          ].map((tab) => {
            const isActive = selectedEventType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedEventType(tab.id);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all shrink-0 cursor-pointer min-h-[36px] ${
                  isActive
                    ? "bg-[#D8793F] text-white shadow-xs"
                    : "bg-[#FFF8EC] text-[#566D7E] hover:bg-[#FFF3DF] hover:text-[#17372F]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: Search & Time Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-[#D8793F]/10">
          <div className="relative flex-1 sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#566D7E]/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reference, description or hen tag..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D8793F]/25 rounded-xl text-[#17372F] placeholder:text-[#566D7E]/50 focus:outline-none focus:border-[#D8793F] min-h-[36px]"
            />
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <span className="text-[10px] font-black uppercase text-[#8C3A14] mr-1 hidden sm:inline">Time:</span>
            {[
              { id: "ALL", label: "All Time" },
              { id: "30DAYS", label: "30 Days" },
              { id: "7DAYS", label: "7 Days" },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => {
                  setDateFilter(period.id as typeof dateFilter);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  dateFilter === period.id
                    ? "bg-[#17372F] text-white"
                    : "bg-[#FFF8EC] text-[#566D7E] hover:bg-[#FFF3DF]"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table / Card List */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-8 sm:p-12 text-center shadow-[0_8px_24px_rgba(16,34,45,0.06)]">
          <div className="size-16 mx-auto rounded-2xl bg-[#D8793F]/15 flex items-center justify-center text-[#D8793F] mb-3">
            <Egg size={32} />
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#17372F]">No Egg Ledger Records Found</h3>
          <p className="mt-1 text-xs sm:text-sm text-[#566D7E] max-w-sm mx-auto">
            {searchQuery
              ? "No transactions matched your search. Try adjusting the query."
              : "No egg transactions recorded in this category yet."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/dashboard/plans"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#D8793F] text-white hover:brightness-105 transition"
            >
              <ShoppingCart size={14} /> Buy Hens to Lay Eggs
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] overflow-hidden shadow-[0_8px_24px_rgba(16,34,45,0.06)]">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8793F]/15 bg-[#FFF8EC] text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Record Ref</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Egg Delta</th>
                  <th className="py-3 px-4">Source / Context</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8793F]/10">
                {paginatedRecords.map((rec) => {
                  const isPositive = rec.eggUnits > 0;
                  return (
                    <tr key={rec.id} className="hover:bg-[#FFF8EC]/60 transition-colors">
                      <td className="py-3.5 px-4 text-[#566D7E] whitespace-nowrap">
                        {formatDateTime(rec.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#17372F]">
                        {rec.reference}
                      </td>
                      <td className="py-3.5 px-4">{getEventBadge(rec)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-black text-sm ${
                            isPositive ? "text-emerald-700" : "text-[#D8793F]"
                          }`}
                        >
                          {isPositive ? `+${rec.eggUnits}` : rec.eggUnits}
                          <span className="text-[10px] font-bold">Eggs</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#17372F] max-w-xs truncate">{rec.description}</p>
                        {rec.relatedEntity?.label && (
                          <p className="text-[10px] text-[#566D7E] mt-0.5 truncate">{rec.relatedEntity.label}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 size={10} /> Recorded
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#D8793F]/30 bg-[#FFF8EC] px-3 py-1.5 text-xs font-bold text-[#8C3A14] hover:bg-[#FFF3DF] transition cursor-pointer min-h-[32px]"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[#D8793F]/15">
            {paginatedRecords.map((rec) => {
              const isPositive = rec.eggUnits > 0;
              return (
                <div key={rec.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">{getEventBadge(rec)}</div>
                      <p className="text-[10px] font-mono text-[#566D7E] mt-1 font-bold">{rec.reference}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-0.5 font-black text-base ${
                        isPositive ? "text-emerald-700" : "text-[#D8793F]"
                      }`}
                    >
                      {isPositive ? `+${rec.eggUnits}` : rec.eggUnits} <span className="text-xs font-bold">Eggs</span>
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#17372F]">{rec.description}</p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#566D7E]">
                    <span>{formatDateTime(rec.createdAt)}</span>
                    <button
                      onClick={() => setSelectedRecord(rec)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#8C3A14] hover:underline cursor-pointer"
                    >
                      View Details <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 sm:p-4 bg-[#FFF8EC] border-t border-[#D8793F]/15 flex items-center justify-between text-xs">
              <span className="text-[#566D7E] font-bold">
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-[#D8793F]/25 bg-white text-[#17372F] font-bold hover:bg-[#FFFDF4] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-black text-[#17372F]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-[#D8793F]/25 bg-white text-[#17372F] font-bold hover:bg-[#FFFDF4] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-[#FFFDF4] border-2 border-[#D8793F]/30 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#D8793F]/15 pb-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-[#061A2B] border border-[#D8793F]/40 flex items-center justify-center text-white shrink-0">
                  <Egg size={24} className="text-[#FFD0A5]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8C3A14] uppercase">Ledger Transaction</span>
                  <h3 className="text-lg font-black text-[#17372F] leading-tight font-mono">{selectedRecord.reference}</h3>
                  <p className="text-xs text-[#566D7E]">{formatDateTime(selectedRecord.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="size-8 rounded-full border border-[#D8793F]/25 bg-[#FFF8EC] text-[#8C3A14] hover:bg-[#FFF3DF] flex items-center justify-center cursor-pointer transition shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#FFF8EC] border border-[#D8793F]/20 rounded-2xl p-3.5">
              <div>
                <span className="text-[10px] font-bold text-[#566D7E] uppercase block">Transaction Event</span>
                <div className="mt-1">{getEventBadge(selectedRecord)}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#566D7E] uppercase block">Egg Movement</span>
                <span
                  className={`text-lg font-black ${
                    selectedRecord.eggUnits > 0 ? "text-emerald-700" : "text-[#D8793F]"
                  }`}
                >
                  {selectedRecord.eggUnits > 0 ? `+${selectedRecord.eggUnits}` : selectedRecord.eggUnits} Eggs
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#D8793F]/15 bg-white p-3 space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#566D7E] block">Description</span>
                <p className="font-bold text-[#17372F] mt-0.5">{selectedRecord.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D8793F]/10">
                <div>
                  <span className="text-[10px] font-bold text-[#566D7E] block">Source Type</span>
                  <span className="font-mono font-bold text-[#17372F]">{selectedRecord.sourceType}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#566D7E] block">Audit Status</span>
                  <span className="font-bold text-emerald-800">Immutable Ledger Entry</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-[#17372F] text-white hover:bg-[#061A2B] transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

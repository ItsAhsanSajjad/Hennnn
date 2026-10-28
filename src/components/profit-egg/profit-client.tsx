"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Egg,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  X,
  ChevronRight,
  Copy,
  Check,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { RecordModal } from "@/components/dashboard/shared/record-modal";
import { formatDateTime } from "@/lib/utilities/format";

export interface ProfitRecordItem {
  id: string;
  reference: string;
  source: "DAILY_COLLECTION" | "REFERRAL_COMMISSION" | "REWARD_CLAIM" | "EGG_SALE" | "ADMIN_ADJUSTMENT" | "REVERSAL" | "OTHER";
  sourceLabel: string;
  description: string;
  eggUnits: number;
  isCredit: boolean;
  pkrAmount: number | null;
  status: "PAID" | "PENDING" | "OTHER";
  statusLabel: string;
  createdAt: string;
}

interface ProfitClientProps {
  records: ProfitRecordItem[];
  totalRecords: number;
  paidRecords: number;
  pendingRecords: number;
  initialTotalEggs: number;
}

type StatusFilter = "ALL" | "PAID" | "PENDING" | "OTHER";

const PAGE_SIZE = 15;

export function ProfitClient({
  records,
  totalRecords,
  paidRecords,
  pendingRecords,
}: ProfitClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<ProfitRecordItem | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        r.description.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.sourceLabel.toLowerCase().includes(q) ||
        r.statusLabel.toLowerCase().includes(q) ||
        formatDateTime(r.createdAt).toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ? true : r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  // Calculate eggs shown on current page
  const eggsShown = useMemo(() => {
    return paginatedRecords.reduce((sum, r) => sum + r.eggUnits, 0);
  }, [paginatedRecords]);

  // Counts for filter pills
  const paidCount = useMemo(() => records.filter((r) => r.status === "PAID").length, [records]);
  const pendingCount = useMemo(() => records.filter((r) => r.status === "PENDING").length, [records]);
  const otherCount = useMemo(() => records.filter((r) => r.status === "OTHER").length, [records]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="w-[min(calc(100%-20px),1500px)] sm:w-[min(calc(100%-32px),1500px)] md:w-[min(calc(100%-48px),1500px)] mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Context Navigation Row */}
      <header className="flex items-center justify-between gap-4 border-b border-[#D8793F]/15 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2.5 rounded-full bg-[#10B981] ring-4 ring-[#10B981]/20" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#17372F]">
            FARM ACCOUNT
          </span>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] px-4 py-2.5 text-xs font-bold text-[#17372F] hover:bg-[#FFFDF4] hover:border-[#D8793F]/40 transition active:scale-[0.98] cursor-pointer min-h-[44px]"
        >
          Dashboard <ArrowRight size={14} className="text-[#8C3A14]" />
        </Link>
      </header>

      {/* 2. Premium Profit Hero (No competing buttons, wide layout) */}
      <section
        aria-label="Profit History Overview"
        className="relative overflow-hidden rounded-3xl border border-[#D8793F]/25 bg-gradient-to-br from-[#10222D] via-[#132A38] to-[#0D382A] p-6 sm:p-10 lg:p-12 shadow-[0_16px_36px_rgba(16,34,45,0.14)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-[#F5C451]/40 to-transparent pointer-events-none" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center">
          {/* Left Text (Approx 65%) */}
          <div className="lg:col-span-8 space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F5C451]/30 bg-[#F5C451]/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#F5C451]">
              <Receipt size={13} className="text-[#F5C451]" /> FARM ACCOUNT
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Your profit <span className="font-serif italic font-normal text-[#F5C451]">history</span>.
            </h1>

            <p className="text-sm sm:text-base font-semibold text-[#D3DFE8] max-w-2xl leading-relaxed">
              Track daily egg earnings, referral rewards and completed sales in one clear place.
            </p>

            <div className="flex items-center gap-2.5 flex-wrap pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm border border-white/10">
                <ShieldCheck size={14} className="text-[#10B981]" /> Real account records
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm border border-white/10">
                <Clock size={14} className="text-[#F5C451]" /> Paid and pending status
              </span>
            </div>
          </div>

          {/* Right Hero Asset (Approx 35%) */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="relative flex items-center justify-center">
              <div className="absolute size-48 sm:size-56 rounded-full bg-[#10B981]/10 blur-2xl pointer-events-none" />
              <div className="size-36 sm:size-44 lg:size-48 rounded-full border border-[#10B981]/25 bg-gradient-to-b from-[#10B981]/15 to-transparent p-4 flex items-center justify-center shadow-inner">
                <Image
                  src="/assets/dashboard/shortcuts/shortcut-payments.webp"
                  alt="GrowMeta Profit History Receipt"
                  width={160}
                  height={160}
                  priority
                  className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Separate Statistics Cards */}
      <section aria-label="Profit Summary Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Records */}
        <div className="rounded-3xl border border-[#D8793F]/20 border-b-2 border-b-[#D8793F] bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_8px_20px_rgba(16,34,45,0.04)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8C3A14]">
              TOTAL RECORDS
            </span>
            <span className="grid size-9 sm:size-10 place-items-center rounded-2xl bg-[#D8793F]/15 text-[#8C3A14]">
              <Receipt size={18} />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#17372F] tracking-tight tabular-nums">
              {totalRecords}
            </div>
            <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
              All profit activity
            </p>
          </div>
        </div>

        {/* Paid */}
        <div className="rounded-3xl border border-[#D8793F]/20 border-b-2 border-b-[#10B981] bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_8px_20px_rgba(16,34,45,0.04)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0A3323]">
              PAID
            </span>
            <span className="grid size-9 sm:size-10 place-items-center rounded-2xl bg-[#10B981]/15 text-[#0A3323]">
              <CheckCircle2 size={18} className="text-[#10B981]" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#17372F] tracking-tight tabular-nums">
              {paidRecords}
            </div>
            <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
              Successfully received
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="rounded-3xl border border-[#D8793F]/20 border-b-2 border-b-amber-500 bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_8px_20px_rgba(16,34,45,0.04)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-900">
              PENDING
            </span>
            <span className="grid size-9 sm:size-10 place-items-center rounded-2xl bg-amber-100 text-amber-900">
              <Clock size={18} className="text-amber-700" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#17372F] tracking-tight tabular-nums">
              {pendingRecords}
            </div>
            <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
              Waiting for processing
            </p>
          </div>
        </div>

        {/* Eggs Shown */}
        <div className="rounded-3xl border border-[#D8793F]/20 border-b-2 border-b-[#F5C451] bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_8px_20px_rgba(16,34,45,0.04)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8C3A14]">
              EGGS SHOWN
            </span>
            <span className="grid size-9 sm:size-10 place-items-center rounded-2xl bg-[#FFF8EC] text-[#8C3A14] border border-[#D8793F]/20">
              <Egg size={18} className="text-[#D8793F]" />
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#17372F] tracking-tight tabular-nums">
              {eggsShown >= 0 ? `+${eggsShown.toLocaleString()}` : eggsShown.toLocaleString()}
            </div>
            <p className="text-xs font-semibold text-[#566D7E] mt-0.5">
              On this page
            </p>
          </div>
        </div>
      </section>

      {/* 4. Main History Panel */}
      <section
        aria-label="Recent Profit Transactions"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-8 shadow-[0_12px_28px_rgba(16,34,45,0.06)] space-y-6"
      >
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8793F]/15 pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              ACTIVITY LOG
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Recent profit transactions
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/25 bg-[#10B981]/10 px-3 py-1 text-xs font-bold text-[#0A3323]">
              <span className="size-2 rounded-full bg-[#10B981] animate-pulse" /> Live records
            </span>
          </div>
        </div>

        {/* Search Field & Status Filters */}
        <div className="space-y-4">
          {/* Full Search Field */}
          <div className="relative w-full">
            <label htmlFor="profit-search" className="sr-only">
              Search plan, source, date or details
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#566D7E]">
              <Search size={17} />
            </div>
            <input
              id="profit-search"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search plan, source, date or details"
              className="w-full rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] py-3 pl-11 pr-10 text-xs sm:text-sm font-semibold text-[#17372F] placeholder-[#566D7E]/70 focus:border-[#10B981] focus:bg-[#FFFDF4] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#566D7E] hover:text-[#17372F] transition cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Filters Exactly 4: All, Paid, Pending, Other */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleFilterChange("ALL")}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition cursor-pointer min-h-[40px] ${
                statusFilter === "ALL"
                  ? "bg-[#17372F] text-white shadow-md"
                  : "bg-[#FFF8EC] border border-[#D8793F]/20 text-[#17372F] hover:bg-[#FFFDF4]"
              }`}
            >
              All <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">{records.length}</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange("PAID")}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition cursor-pointer min-h-[40px] ${
                statusFilter === "PAID"
                  ? "bg-[#10B981] text-white shadow-md"
                  : "bg-[#FFF8EC] border border-[#D8793F]/20 text-[#17372F] hover:bg-[#FFFDF4]"
              }`}
            >
              Paid <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">{paidCount}</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange("PENDING")}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition cursor-pointer min-h-[40px] ${
                statusFilter === "PENDING"
                  ? "bg-amber-600 text-white shadow-md"
                  : "bg-[#FFF8EC] border border-[#D8793F]/20 text-[#17372F] hover:bg-[#FFFDF4]"
              }`}
            >
              Pending <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">{pendingCount}</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange("OTHER")}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition cursor-pointer min-h-[40px] ${
                statusFilter === "OTHER"
                  ? "bg-[#566D7E] text-white shadow-md"
                  : "bg-[#FFF8EC] border border-[#D8793F]/20 text-[#17372F] hover:bg-[#FFFDF4]"
              }`}
            >
              Other <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">{otherCount}</span>
            </button>
          </div>
        </div>

        {/* Transaction Records Display */}
        {filteredRecords.length === 0 ? (
          <div className="rounded-3xl border border-[#D8793F]/20 bg-[#FFF8EC] p-8 sm:p-12 text-center space-y-4">
            <div className="size-14 rounded-2xl bg-[#D8793F]/15 text-[#8C3A14] mx-auto grid place-items-center">
              <Receipt size={24} />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-black text-[#17372F]">
                {searchQuery || statusFilter !== "ALL"
                  ? "No records match this filter."
                  : "No profit history found"}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#566D7E]">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try searching for a different keyword or switch to 'All' status."
                  : "Your completed egg earnings and rewards will appear here."}
              </p>
            </div>
            {(searchQuery || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[#D8793F]/25 bg-[#FFFDF4] px-4 py-2 text-xs font-bold text-[#17372F] hover:bg-[#FFF8EC] transition cursor-pointer min-h-[40px]"
              >
                Reset Search Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D8793F]/15 text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
                    <th className="py-3 px-2.5">DATE & TIME</th>
                    <th className="py-3 px-2.5">SOURCE</th>
                    <th className="py-3 px-2.5">DESCRIPTION</th>
                    <th className="py-3 px-2.5 text-right">QUANTITY</th>
                    <th className="py-3 px-2.5 text-right">PKR</th>
                    <th className="py-3 px-2.5 text-center">STATUS</th>
                    <th className="py-3 px-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8793F]/10 text-xs font-semibold text-[#17372F]">
                  {paginatedRecords.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#FFF8EC]/60 transition-colors group"
                    >
                      <td className="py-3 px-2.5 font-mono text-[11px] text-[#566D7E] whitespace-nowrap">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="py-3 px-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8EC] border border-[#D8793F]/20 px-2 py-0.5 text-[10px] font-bold text-[#8C3A14]">
                          {r.sourceLabel}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 font-bold max-w-[200px] lg:max-w-xs truncate">
                        {r.description}
                      </td>
                      <td className="py-3 px-2.5 text-right whitespace-nowrap tabular-nums">
                        <span
                          className={`font-black ${
                            r.isCredit ? "text-[#10B981]" : "text-amber-700"
                          }`}
                        >
                          {r.isCredit ? "+" : ""}
                          {r.eggUnits.toLocaleString()} Eggs
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-right whitespace-nowrap tabular-nums text-[#566D7E]">
                        {r.pkrAmount != null ? `PKR ${r.pkrAmount.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            r.status === "PAID"
                              ? "bg-[#10B981]/15 text-[#0A3323] border border-[#10B981]/25"
                              : r.status === "PENDING"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-slate-100 text-slate-800 border border-slate-300"
                          }`}
                        >
                          {r.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#D8793F]/25 bg-[#FFF8EC] px-2.5 py-1.5 text-xs font-bold text-[#17372F] hover:bg-[#FFFDF4] hover:border-[#D8793F]/40 transition active:scale-[0.97] cursor-pointer min-h-[32px]"
                        >
                          Details <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (Visible on mobile only) */}
            <div className="md:hidden space-y-3">
              {paginatedRecords.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-[#D8793F]/20 bg-[#FFF8EC] p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#FFFDF4] border border-[#D8793F]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8C3A14]">
                      {r.sourceLabel}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        r.status === "PAID"
                          ? "bg-[#10B981]/15 text-[#0A3323] border border-[#10B981]/25"
                          : r.status === "PENDING"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-800 border border-slate-300"
                      }`}
                    >
                      {r.statusLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-[#17372F] line-clamp-1">
                      {r.description}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#566D7E] mt-0.5">
                      {formatDateTime(r.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#D8793F]/15 pt-2.5">
                    <div>
                      <div
                        className={`text-sm font-black ${
                          r.isCredit ? "text-[#10B981]" : "text-amber-700"
                        }`}
                      >
                        {r.isCredit ? "+" : ""}
                        {r.eggUnits.toLocaleString()} Eggs
                      </div>
                      {r.pkrAmount != null && (
                        <p className="text-[10px] font-semibold text-[#566D7E]">
                          PKR {r.pkrAmount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedRecord(r)}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#D8793F]/25 bg-[#FFFDF4] px-3 py-1.5 text-xs font-bold text-[#17372F] hover:bg-[#FFF8EC] transition cursor-pointer min-h-[36px]"
                    >
                      Details <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#D8793F]/15 pt-4 text-xs font-semibold text-[#566D7E]">
                <span>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(currentPage * PAGE_SIZE, filteredRecords.length)} of{" "}
                  {filteredRecords.length} records
                </span>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#D8793F]/20 bg-[#FFF8EC] px-3 py-1.5 text-xs font-bold text-[#17372F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFFDF4] transition cursor-pointer min-h-[36px]"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  <span className="px-2 font-bold text-[#17372F]">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#D8793F]/20 bg-[#FFF8EC] px-3 py-1.5 text-xs font-bold text-[#17372F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFFDF4] transition cursor-pointer min-h-[36px]"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. Transaction Details Modal */}
      <RecordModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Transaction Details"
        badge={selectedRecord?.sourceLabel}
        badgeIcon={Receipt}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFF8EC] p-4 sm:p-5 border border-[#D8793F]/15 space-y-3 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Source:</span>
                <span className="font-black text-[#17372F]">{selectedRecord.sourceLabel}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Description:</span>
                <span className="font-bold text-[#17372F] text-right max-w-[220px]">
                  {selectedRecord.description}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Status:</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    selectedRecord.status === "PAID"
                      ? "bg-[#10B981]/15 text-[#0A3323] border border-[#10B981]/25"
                      : selectedRecord.status === "PENDING"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-slate-100 text-slate-800 border border-slate-300"
                  }`}
                >
                  {selectedRecord.statusLabel}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Egg Amount:</span>
                <span
                  className={`font-black text-sm ${
                    selectedRecord.isCredit ? "text-[#10B981]" : "text-amber-700"
                  }`}
                >
                  {selectedRecord.isCredit ? "+" : ""}
                  {selectedRecord.eggUnits.toLocaleString()} Eggs
                </span>
              </div>

              {selectedRecord.pkrAmount != null && (
                <div className="flex justify-between items-center">
                  <span className="text-[#566D7E]">Financial Value:</span>
                  <span className="font-bold text-[#17372F]">
                    PKR {selectedRecord.pkrAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Timestamp:</span>
                <span className="font-bold text-[#17372F]">
                  {formatDateTime(selectedRecord.createdAt)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-[#D8793F]/10">
                <span className="text-[#566D7E]">Reference:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-[#17372F] max-w-[160px] truncate">
                    {selectedRecord.reference}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedRecord.reference)}
                    aria-label="Copy reference ID"
                    className="p-1 rounded-lg hover:bg-[#FFFDF4] text-[#566D7E] hover:text-[#17372F] transition cursor-pointer"
                  >
                    {copiedRef ? <Check size={13} className="text-[#10B981]" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] py-2.5 px-5 text-xs font-bold text-[#17372F] hover:bg-[#FFFDF4] transition cursor-pointer min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </RecordModal>
    </div>
  );
}


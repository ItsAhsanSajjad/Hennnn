"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bird,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Egg,
  ExternalLink,
  Filter,
  Info,
  Layers,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Sprout,
  TrendingUp,
  X,
} from "lucide-react";

import { formatDateTime } from "@/lib/utilities/format";

export type HenRecord = {
  id: string;
  assetTag: string;
  planName: string;
  quantity: number;
  status:
    | "ACTIVE"
    | "EXPIRED"
    | "PENDING_ACTIVATION"
    | "COMPLETED"
    | "SUSPENDED"
    | "CANCELLED"
    | "REFUNDED"
    | "PENDING_PAYMENT"
    | "UNDER_REVIEW";
  dailyEggUnitsPerHen: number;
  totalEggUnitsProduced: number;
  productionCycleDaysTotal: number;
  productionCycleDaysRemaining: number | null;
  daysCompleted: number;
  cycleProgressPercent: number;
  purchaseDate: string;
  activatedAt: string | null;
  productionStartDate: string | null;
  productionEndDate: string | null;
  completedAt: string | null;
  orderReference: string;
  orderId: string;
  purchasePriceRs: number;
  unitPriceRs: number;
  paymentStatus: string;
  isExpiringSoon: boolean;
  isPendingOrder?: boolean;
};

interface HenHistoryClientProps {
  records: HenRecord[];
  totalHensPurchased: number;
  activeHensCount: number;
  expiringSoonHensCount: number;
  expiredHensCount: number;
  pendingHensCount: number;
  totalEggsProduced: number;
  totalFlocksCount: number;
  activeFlocksCount: number;
  expiringSoonFlocksCount: number;
  expiredFlocksCount: number;
  pendingFlocksCount: number;
  activeCapacityPercent: number;
  dailyEggProduction: number;
  nearestExpiryDays: number | null;
  averageCycleProgress: number;
}

type FilterTab = "ALL" | "ACTIVE" | "EXPIRING" | "EXPIRED" | "PENDING";
type SortOption = "newest" | "oldest" | "expiring" | "flock_size" | "production";

/**
 * Downloads a client-side RFC 4180 CSV export of flock records.
 */
function downloadFlockRegistryCsv(records: HenRecord[]) {
  const headers = [
    "Asset ID",
    "Plan Name",
    "Order Reference",
    "Flock Size (Hens)",
    "Status",
    "Daily Yield (Eggs)",
    "Total Produced (Eggs)",
    "Cycle Total Days",
    "Days Completed",
    "Days Remaining",
    "Cycle Progress (%)",
    "Purchase Price (PKR)",
    "Purchase Date",
    "Activation Date",
    "Expiry Date",
  ];

  const rows = records.map((r) => [
    r.assetTag,
    `"${r.planName.replace(/"/g, '""')}"`,
    r.orderReference,
    r.quantity,
    r.status,
    r.dailyEggUnitsPerHen * r.quantity,
    r.totalEggUnitsProduced,
    r.productionCycleDaysTotal,
    r.daysCompleted,
    r.productionCycleDaysRemaining !== null ? r.productionCycleDaysRemaining : "N/A",
    `${r.cycleProgressPercent}%`,
    r.purchasePriceRs,
    r.purchaseDate ? new Date(r.purchaseDate).toISOString().slice(0, 10) : "",
    r.activatedAt ? new Date(r.activatedAt).toISOString().slice(0, 10) : "",
    r.productionEndDate ? new Date(r.productionEndDate).toISOString().slice(0, 10) : "",
  ]);

  const csvString = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `growmeta-flock-registry-${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function HenHistoryClient({
  records,
  totalHensPurchased,
  activeHensCount,
  expiringSoonHensCount,
  expiredHensCount,
  pendingHensCount,
  totalEggsProduced,
  totalFlocksCount,
  activeFlocksCount,
  expiringSoonFlocksCount,
  expiredFlocksCount,
  pendingFlocksCount,
  activeCapacityPercent,
  dailyEggProduction,
  nearestExpiryDays,
  averageCycleProgress,
}: HenHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedRecord, setSelectedRecord] = useState<HenRecord | null>(null);
  const [expandedMobileIds, setExpandedMobileIds] = useState<Set<string>>(new Set());

  // Filter & Search Logic
  const filteredRecords = useMemo(() => {
    let result = records.filter((rec) => {
      if (activeTab === "ACTIVE" && rec.status !== "ACTIVE") return false;
      if (activeTab === "EXPIRING" && (!rec.isExpiringSoon || rec.status !== "ACTIVE")) return false;
      if (
        activeTab === "EXPIRED" &&
        rec.status !== "EXPIRED" &&
        rec.status !== "COMPLETED"
      )
        return false;
      if (
        activeTab === "PENDING" &&
        rec.status !== "PENDING_ACTIVATION" &&
        rec.status !== "PENDING_PAYMENT" &&
        rec.status !== "UNDER_REVIEW"
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = rec.assetTag.toLowerCase().includes(q);
        const matchesPlan = rec.planName.toLowerCase().includes(q);
        const matchesOrder = rec.orderReference.toLowerCase().includes(q);
        const matchesStatus = rec.status.toLowerCase().includes(q);
        return matchesTag || matchesPlan || matchesOrder || matchesStatus;
      }
      return true;
    });

    // Sort Logic
    result = [...result].sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      }
      if (sortOption === "oldest") {
        return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      }
      if (sortOption === "expiring") {
        const aRem = a.productionCycleDaysRemaining ?? 9999;
        const bRem = b.productionCycleDaysRemaining ?? 9999;
        return aRem - bRem;
      }
      if (sortOption === "flock_size") {
        return b.quantity - a.quantity;
      }
      if (sortOption === "production") {
        return b.totalEggUnitsProduced - a.totalEggUnitsProduced;
      }
      return 0;
    });

    return result;
  }, [records, activeTab, searchQuery, sortOption]);

  const toggleMobileExpand = (id: string) => {
    setExpandedMobileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveTab("ALL");
    setSearchQuery("");
    setSortOption("newest");
  };

  const hasActiveFilters = activeTab !== "ALL" || searchQuery.trim().length > 0 || sortOption !== "newest";

  // Centralized Status Badge Helper
  const renderStatusBadge = (rec: HenRecord) => {
    if (rec.status === "ACTIVE") {
      if (rec.isExpiringSoon) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Expiring Soon</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Laying</span>
        </span>
      );
    }
    if (rec.status === "PENDING_ACTIVATION") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
          <Clock size={11} className="text-sky-600" />
          <span>Pending Activation</span>
        </span>
      );
    }
    if (rec.status === "UNDER_REVIEW") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
          <Clock size={11} className="text-blue-600" />
          <span>Payment Under Review</span>
        </span>
      );
    }
    if (rec.status === "PENDING_PAYMENT") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-600/30 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
          <Clock size={11} className="text-amber-600" />
          <span>Awaiting Payment</span>
        </span>
      );
    }
    if (rec.status === "EXPIRED" || rec.status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#D8793F]/30 bg-[#FFF8EC] px-2.5 py-0.5 text-[11px] font-bold text-[#8C3A14]">
          <CheckCircle2 size={12} className="text-[#D8793F]" />
          <span>Cycle Completed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700">
        {rec.status}
      </span>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300 pb-36 sm:pb-28 min-w-0">
      {/* =====================================================================
          1. PREMIUM PAGE HEADER
          ===================================================================== */}
      <section
        style={{
          boxShadow: "0 8px 24px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(216, 121, 63, 0.15)",
        }}
        className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-6 lg:p-7 relative overflow-hidden"
        aria-label="Flock Registry Header"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0 flex-1">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-1.5 text-[11px] font-bold text-[#566D7E] mb-1">
              <Link href="/dashboard" className="hover:text-[#D8793F] transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/hens" className="hover:text-[#D8793F] transition-colors">
                My Hens
              </Link>
              <span>/</span>
              <span className="text-[#8C3A14]">Flock Registry</span>
            </nav>

            {/* Eyebrow */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D8793F]/15 text-[#8C3A14] border border-[#D8793F]/25">
              <Sparkles size={11} className="text-[#D8793F]" />
              <span>VERIFIED FLOCK RECORDS</span>
            </span>

            {/* Title & Subtitle */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#17372F] tracking-tight">
              Hen History &amp; Flock Registry
            </h1>
            <p className="text-xs sm:text-sm text-[#566D7E] max-w-2xl leading-relaxed">
              Track every purchased hen, active production cycle, daily yield and completed flock record.
            </p>
          </div>

          {/* Right Header Visual Emblem & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-center">
            {/* Header Action 1: Buy New Hens */}
            <Link
              href="/dashboard/plans"
              style={{
                background: "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 6px 18px rgba(216, 121, 63, 0.3), 0 2px 0 #8C3A14",
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:scale-[0.98] transition min-h-[42px]"
            >
              <ShoppingCart size={15} />
              <span>Buy New Hens</span>
            </Link>

            {/* Header Action 2: Export Records CSV */}
            <button
              type="button"
              onClick={() => downloadFlockRegistryCsv(records)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#17372F] bg-[#FFF8EC] hover:bg-[#FFF3DF] border border-[#D8793F]/30 active:scale-[0.98] transition cursor-pointer min-h-[42px]"
              title="Download full registry records as a CSV file"
            >
              <Download size={15} className="text-[#8C3A14]" />
              <span className="hidden xs:inline">Export Records</span>
            </button>

            {/* Subtle 3D Hen Emblem */}
            <div className="hidden lg:flex size-11 rounded-xl overflow-hidden border border-[#D8793F]/35 bg-[#071E28] shrink-0 shadow-xs items-center justify-center">
              <Image
                src="/dashboard/brown-hen-3d.webp"
                alt="GrowMeta Hen Emblem"
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. SUMMARY SECTION (5 METRIC CARDS)
          ===================================================================== */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4" aria-label="Flock Metrics Summary">
        {/* Card 1: Total Hens Purchased */}
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          style={{
            boxShadow: "0 6px 18px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(216, 121, 63, 0.15)",
          }}
          className={`group rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 ${
            activeTab === "ALL"
              ? "bg-[#FFF8EC] border-[#D8793F] ring-1 ring-[#D8793F]/30"
              : "bg-[#FFFDF4] border-[#D8793F]/25 hover:bg-[#FFF8EC]/60"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
              Total Purchased
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-[#D8793F]/15 text-[#8C3A14]">
              <Sprout size={14} />
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
              {totalHensPurchased} <span className="text-xs font-bold text-[#566D7E]">Hens</span>
            </p>
          </div>
          <p className="text-[10.5px] font-semibold text-[#566D7E]">
            {totalFlocksCount} {totalFlocksCount === 1 ? "flock batch" : "flock batches"}
          </p>
        </button>

        {/* Card 2: Active Hens */}
        <button
          type="button"
          onClick={() => setActiveTab("ACTIVE")}
          style={{
            boxShadow: "0 6px 18px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(16, 185, 129, 0.2)",
          }}
          className={`group rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 ${
            activeTab === "ACTIVE"
              ? "bg-[#F0FDF4] border-emerald-500 ring-1 ring-emerald-500/30"
              : "bg-[#FFFDF4] border-[#D8793F]/25 hover:bg-[#F0FDF4]/60"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Active Hens
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700">
              <Bird size={14} />
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
              {activeHensCount} <span className="text-xs font-bold text-emerald-700">Laying</span>
            </p>
          </div>
          <p className="text-[10.5px] font-semibold text-emerald-700 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Producing eggs today</span>
          </p>
        </button>

        {/* Card 3: Expiring Soon */}
        <button
          type="button"
          onClick={() => setActiveTab("EXPIRING")}
          style={{
            boxShadow: "0 6px 18px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(245, 158, 11, 0.2)",
          }}
          className={`group rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 ${
            activeTab === "EXPIRING"
              ? "bg-[#FEFCE8] border-amber-500 ring-1 ring-amber-500/30"
              : "bg-[#FFFDF4] border-[#D8793F]/25 hover:bg-[#FEFCE8]/60"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Expiring Soon
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-amber-500/15 text-amber-700">
              <Clock size={14} />
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
              {expiringSoonHensCount} <span className="text-xs font-bold text-[#566D7E]">Hens</span>
            </p>
          </div>
          <p className="text-[10.5px] font-semibold text-amber-800">
            {expiringSoonFlocksCount > 0 ? "≤ 7 days left in cycle" : "No imminent expiry"}
          </p>
        </button>

        {/* Card 4: Expired Hens */}
        <button
          type="button"
          onClick={() => setActiveTab("EXPIRED")}
          style={{
            boxShadow: "0 6px 18px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(216, 121, 63, 0.15)",
          }}
          className={`group rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 ${
            activeTab === "EXPIRED"
              ? "bg-[#FFF8EC] border-[#D8793F] ring-1 ring-[#D8793F]/30"
              : "bg-[#FFFDF4] border-[#D8793F]/25 hover:bg-[#FFF8EC]/60"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
              Expired Hens
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-[#D8793F]/15 text-[#8C3A14]">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight">
              {expiredHensCount} <span className="text-xs font-bold text-[#566D7E]">Hens</span>
            </p>
          </div>
          <p className="text-[10.5px] font-semibold text-[#566D7E]">
            Completed 125d cycle
          </p>
        </button>

        {/* Card 5: Total Eggs Produced */}
        <div
          style={{
            boxShadow: "0 6px 18px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(216, 121, 63, 0.15)",
          }}
          className="col-span-2 sm:col-span-1 rounded-2xl border border-[#D8793F]/25 bg-[#FFFDF4] p-3.5 sm:p-4 text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
              Eggs Produced
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-[#D8793F]/15 text-[#8C3A14]">
              <Egg size={14} />
            </span>
          </div>
          <div className="my-1.5">
            <p className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
              {totalEggsProduced.toLocaleString()}
            </p>
          </div>
          <p className="text-[10.5px] font-semibold text-emerald-700">
            Harvested into ledger
          </p>
        </div>
      </section>

      {/* =====================================================================
          3. FLOCK HEALTH OVERVIEW
          ===================================================================== */}
      <section
        style={{
          boxShadow: "0 6px 18px rgba(16, 34, 45, 0.04), 0 2px 0 rgba(216, 121, 63, 0.12)",
        }}
        className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/20 bg-[#FFF8EC] p-4 sm:p-5 space-y-3"
        aria-label="Flock Production Capacity"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C3A14]">
              FLOCK CAPACITY &amp; HEALTH
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#17372F] mt-0.5">
              Current Flock Production Capacity: {activeHensCount} of {totalHensPurchased} approved hens active — {activeCapacityPercent}%
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-[#17372F]">
            <span className="inline-flex items-center gap-1 text-[#D8793F]">
              <Sparkles size={14} /> +{dailyEggProduction} Eggs/Day
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="inline-flex items-center gap-1 text-[#566D7E]">
              <Clock size={14} />
              {nearestExpiryDays !== null ? `Nearest expiry in ${nearestExpiryDays}d` : "Active production"}
            </span>
          </div>
        </div>

        {/* Horizontal Production Capacity Progress Bar */}
        <div className="h-3 w-full bg-[#E5DAC6] rounded-full overflow-hidden p-0.5 border border-[#D8793F]/20 shadow-inner">
          <div
            style={{ width: `${activeCapacityPercent}%` }}
            className="h-full bg-gradient-to-r from-[#F59B52] via-[#10B981] to-[#059669] rounded-full transition-all duration-700"
            role="progressbar"
            aria-valuenow={activeCapacityPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Flock active capacity"
          />
        </div>
      </section>

      {/* =====================================================================
          4. STICKY FILTER AND SEARCH BAR
          ===================================================================== */}
      <section
        style={{
          boxShadow: "0 8px 24px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(216, 121, 63, 0.15)",
        }}
        className="sticky top-2 sm:top-4 z-20 rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4]/95 backdrop-blur-md p-3 sm:p-4 space-y-3"
        aria-label="Filter Flock Records"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Truthful Dual-Counter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              {
                id: "ALL",
                label: "All Records",
                flocks: totalFlocksCount,
                hens: totalHensPurchased + pendingHensCount,
              },
              {
                id: "ACTIVE",
                label: "Active",
                flocks: activeFlocksCount,
                hens: activeHensCount,
              },
              {
                id: "EXPIRING",
                label: "Expiring Soon",
                flocks: expiringSoonFlocksCount,
                hens: expiringSoonHensCount,
              },
              {
                id: "EXPIRED",
                label: "Expired",
                flocks: expiredFlocksCount,
                hens: expiredHensCount,
              },
              {
                id: "PENDING",
                label: "Pending",
                flocks: pendingFlocksCount,
                hens: pendingHensCount,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FilterTab)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all shrink-0 cursor-pointer min-h-[38px] ${
                    isActive
                      ? "bg-[#D8793F] text-white shadow-xs"
                      : "bg-[#FFF8EC] text-[#566D7E] hover:bg-[#FFF3DF] hover:text-[#17372F] border border-[#D8793F]/15"
                  }`}
                >
                  <span>{tab.label}</span>
                  {/* Truthful Dual Counter Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/25 text-white" : "bg-[#D8793F]/15 text-[#8C3A14]"
                    }`}
                  >
                    <span>{tab.flocks} {tab.flocks === 1 ? "Flock" : "Flocks"}</span>
                    <span>·</span>
                    <span>{tab.hens} {tab.hens === 1 ? "Hen" : "Hens"}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#566D7E]/60 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plan, asset ID, or order..."
                className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-[#D8793F]/25 rounded-xl text-[#17372F] placeholder:text-[#566D7E]/50 focus:outline-none focus:border-[#D8793F] min-h-[38px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#566D7E] hover:text-[#17372F] p-0.5 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-bold bg-[#FFF8EC] border border-[#D8793F]/25 rounded-xl text-[#17372F] focus:outline-none focus:border-[#D8793F] min-h-[38px] cursor-pointer"
              >
                <option value="newest">Newest Purchase</option>
                <option value="oldest">Oldest Purchase</option>
                <option value="expiring">Expiring First</option>
                <option value="flock_size">Largest Flock</option>
                <option value="production">Most Eggs</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#566D7E] pointer-events-none"
              />
            </div>

            {/* Clear Filters (conditional) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-[#8C3A14] bg-[#FFF8EC] hover:bg-[#FFF3DF] border border-[#D8793F]/30 rounded-xl transition cursor-pointer min-h-[38px] shrink-0"
                title="Reset all filters and search"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-[11px] font-bold text-[#566D7E] pt-0.5 border-t border-[#D8793F]/15">
          <span>
            Showing <strong className="text-[#17372F]">{filteredRecords.length}</strong> of {records.length} registry records
          </span>
          {searchQuery && (
            <span>
              Matches for &ldquo;<span className="text-[#8C3A14]">{searchQuery}</span>&rdquo;
            </span>
          )}
        </div>
      </section>

      {/* =====================================================================
          5. DESKTOP REGISTRY TABLE & MOBILE CARDS
          ===================================================================== */}
      {filteredRecords.length === 0 ? (
        /* Empty State */
        <div
          style={{
            boxShadow: "0 8px 24px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(216, 121, 63, 0.15)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-8 sm:p-12 text-center"
        >
          <div className="size-14 mx-auto rounded-2xl bg-[#D8793F]/15 flex items-center justify-center text-[#D8793F] mb-3">
            <Bird size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#17372F]">No Hen Records Found</h3>
          <p className="mt-1 text-xs sm:text-sm text-[#566D7E] max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No flock records matched "${searchQuery}". Try clearing search or changing your tab filter.`
              : activeTab === "EXPIRING"
              ? "None of your active flocks are currently expiring within the next 7 days."
              : activeTab === "EXPIRED"
              ? "You have no completed or expired flock cycles."
              : activeTab === "PENDING"
              ? "You have no pending purchases in the review queue."
              : "Purchase your first hen plan to begin building your verified flock."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#FFF8EC] text-[#8C3A14] border border-[#D8793F]/30 hover:bg-[#FFF3DF] transition cursor-pointer"
              >
                <RotateCcw size={13} /> Clear Filters
              </button>
            ) : (
              <Link
                href="/dashboard/plans"
                style={{
                  background: "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)",
                  boxShadow: "0 6px 16px rgba(216, 121, 63, 0.3), 0 2px 0 #8C3A14",
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white hover:brightness-105 transition"
              >
                <ShoppingCart size={14} /> Buy Your First Hens
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            boxShadow: "0 8px 24px rgba(16, 34, 45, 0.05), 0 2px 0 rgba(216, 121, 63, 0.15)",
          }}
          className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] overflow-hidden"
        >
          {/* Desktop Table (hidden on mobile, visible on md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8793F]/15 bg-[#FFF8EC] text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                  <th className="py-3.5 px-4">Flock / Asset</th>
                  <th className="py-3.5 px-4">Purchase Details</th>
                  <th className="py-3.5 px-4">Flock Size</th>
                  <th className="py-3.5 px-4">Production</th>
                  <th className="py-3.5 px-4">Total Produced</th>
                  <th className="py-3.5 px-4">Cycle Progress</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8793F]/10">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#FFF8EC]/60 transition-colors">
                    {/* Column 1: Flock / Asset */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl overflow-hidden bg-[#071E28] shrink-0 border border-[#D8793F]/30 flex items-center justify-center text-white">
                          <Image
                            src="/dashboard/brown-hen-thumb.webp"
                            alt="Hen"
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-black text-[#17372F]">{rec.planName}</span>
                            <BadgeCheck size={13} className="text-emerald-600 shrink-0" />
                          </div>
                          <p className="text-[10px] font-mono font-bold text-[#566D7E] mt-0.5">
                            {rec.assetTag}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Purchase Details */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-[#17372F]">#{rec.orderReference}</p>
                      <p className="text-[10px] text-[#566D7E] mt-0.5">
                        Rs {rec.purchasePriceRs.toLocaleString()} · {new Date(rec.purchaseDate).toLocaleDateString()}
                      </p>
                    </td>

                    {/* Column 3: Flock Size */}
                    <td className="py-3.5 px-4">
                      <p className="font-black text-[#17372F] text-sm">
                        {rec.quantity} {rec.quantity === 1 ? "Hen" : "Hens"}
                      </p>
                      <p className="text-[10px] font-semibold text-[#8C3A14]">
                        {rec.status === "ACTIVE" ? `${rec.quantity} active laying` : rec.status}
                      </p>
                    </td>

                    {/* Column 4: Production */}
                    <td className="py-3.5 px-4">
                      <p className="font-black text-[#D8793F] text-sm">
                        +{rec.dailyEggUnitsPerHen * rec.quantity} <span className="text-[10px] font-bold">Eggs/day</span>
                      </p>
                      <p className="text-[10px] text-[#566D7E]">1 egg / hen / day</p>
                    </td>

                    {/* Column 5: Total Produced */}
                    <td className="py-3.5 px-4">
                      <p className="font-black text-emerald-800 text-sm">
                        {rec.totalEggUnitsProduced.toLocaleString()} Eggs
                      </p>
                      <p className="text-[10px] text-[#566D7E]">Harvested to date</p>
                    </td>

                    {/* Column 6: Cycle Progress */}
                    <td className="py-3.5 px-4 min-w-[160px]">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px] font-bold">
                          <span className="text-[#17372F]">{rec.cycleProgressPercent}%</span>
                          <span className="text-[#566D7E]">
                            {rec.productionCycleDaysRemaining !== null
                              ? `${rec.productionCycleDaysRemaining}d left`
                              : `${rec.productionCycleDaysTotal}d total`}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#E5DAC6] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${rec.cycleProgressPercent}%` }}
                            className="h-full bg-gradient-to-r from-[#F59B52] to-[#10B981] rounded-full"
                          />
                        </div>
                        <p className="text-[9.5px] text-[#566D7E]">
                          {rec.daysCompleted} of {rec.productionCycleDaysTotal} days completed
                        </p>
                      </div>
                    </td>

                    {/* Column 7: Status */}
                    <td className="py-3.5 px-4">{renderStatusBadge(rec)}</td>

                    {/* Column 8: Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(rec)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#D8793F]/30 bg-[#FFF8EC] px-3 py-1.5 text-xs font-bold text-[#8C3A14] hover:bg-[#FFF3DF] hover:border-[#D8793F] transition cursor-pointer min-h-[32px]"
                      >
                        <span>View Details</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Responsive Mobile Cards (< 768px) */}
          <div className="md:hidden divide-y divide-[#D8793F]/15">
            {filteredRecords.map((rec) => {
              const isExpanded = expandedMobileIds.has(rec.id);
              return (
                <div key={rec.id} className="p-4 space-y-3">
                  {/* Top Bar: Plan Name + Asset ID + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-10 rounded-xl overflow-hidden bg-[#071E28] shrink-0 border border-[#D8793F]/30 flex items-center justify-center text-white">
                        <Image
                          src="/dashboard/brown-hen-thumb.webp"
                          alt="Hen"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-black text-[#17372F] text-sm leading-tight">
                          {rec.planName}
                        </h4>
                        <p className="text-[10px] font-mono font-bold text-[#566D7E] mt-0.5">
                          {rec.assetTag}
                        </p>
                      </div>
                    </div>
                    {renderStatusBadge(rec)}
                  </div>

                  {/* 3 Metric Chips Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-[#FFF8EC] rounded-xl p-2.5 text-center border border-[#D8793F]/15">
                    <div>
                      <span className="text-[9px] font-bold text-[#566D7E] uppercase block">Flock</span>
                      <span className="text-xs font-black text-[#17372F]">{rec.quantity} Hens</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#566D7E] uppercase block">Yield/Day</span>
                      <span className="text-xs font-black text-[#D8793F]">
                        +{rec.dailyEggUnitsPerHen * rec.quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#566D7E] uppercase block">Harvested</span>
                      <span className="text-xs font-black text-emerald-800">
                        {rec.totalEggUnitsProduced.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Cycle Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] font-bold">
                      <span className="text-[#17372F]">125-Day Cycle: {rec.cycleProgressPercent}%</span>
                      <span className="text-[#8C3A14]">
                        {rec.productionCycleDaysRemaining !== null
                          ? `${rec.productionCycleDaysRemaining}d remaining`
                          : "Cycle complete"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E5DAC6] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${rec.cycleProgressPercent}%` }}
                        className="h-full bg-gradient-to-r from-[#F59B52] to-[#10B981] rounded-full"
                      />
                    </div>
                  </div>

                  {/* Collapsible Secondary Details */}
                  {isExpanded && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#D8793F]/15 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#566D7E]">Order Reference:</span>
                        <span className="font-mono font-bold text-[#17372F]">#{rec.orderReference}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#566D7E]">Purchase Price:</span>
                        <span className="font-bold text-[#17372F]">Rs {rec.purchasePriceRs.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#566D7E]">Purchase Date:</span>
                        <span className="font-medium text-[#17372F]">
                          {new Date(rec.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#566D7E]">Cycle Expiry Date:</span>
                        <span className="font-medium text-[#17372F]">
                          {rec.productionEndDate
                            ? new Date(rec.productionEndDate).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => toggleMobileExpand(rec.id)}
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#566D7E] hover:text-[#17372F] p-2 rounded-xl border border-[#D8793F]/20 bg-[#FFF8EC] min-h-[44px] cursor-pointer"
                    >
                      <span>{isExpanded ? "Less" : "Specs"}</span>
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRecord(rec)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D8793F] text-white py-2.5 px-4 text-xs font-black uppercase tracking-wider hover:brightness-105 active:scale-[0.98] transition min-h-[44px] cursor-pointer"
                    >
                      <span>View Details</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          6. 125-DAY LIFECYCLE DETAIL MODAL / DRAWER
          ===================================================================== */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="flock-modal-title"
        >
          <div className="relative w-full max-w-xl rounded-3xl bg-[#FFFDF4] border-2 border-[#D8793F]/30 p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#D8793F]/15 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-[#071E28] border border-[#D8793F]/40 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Image
                    src="/dashboard/brown-hen-thumb.webp"
                    alt="Hen"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8C3A14] uppercase tracking-wider">
                    VERIFIED FLOCK RECORD
                  </span>
                  <h3 id="flock-modal-title" className="text-lg sm:text-xl font-black text-[#17372F] leading-tight">
                    {selectedRecord.planName}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#566D7E]">
                    Asset Tag: {selectedRecord.assetTag}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="size-8 rounded-full border border-[#D8793F]/25 bg-[#FFF8EC] text-[#8C3A14] hover:bg-[#FFF3DF] flex items-center justify-center cursor-pointer transition shrink-0"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Flock Status & Daily Yield Strip */}
            <div className="flex items-center justify-between bg-[#FFF8EC] border border-[#D8793F]/20 rounded-2xl p-3.5">
              <div>
                <span className="text-[10px] font-bold text-[#566D7E] uppercase block">
                  Current Status
                </span>
                <div className="mt-1">{renderStatusBadge(selectedRecord)}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#566D7E] uppercase block">
                  Daily Egg Production
                </span>
                <span className="text-base sm:text-lg font-black text-[#D8793F]">
                  +{selectedRecord.dailyEggUnitsPerHen * selectedRecord.quantity} Eggs/Day
                </span>
              </div>
            </div>

            {/* Visual 125-Day Lifecycle Timeline */}
            <div className="rounded-2xl border border-[#D8793F]/20 bg-white p-4 space-y-2.5">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-[#8C3A14] flex items-center gap-1.5">
                <Clock size={13} />
                <span>125-DAY PRODUCTION LIFECYCLE TIMELINE</span>
              </span>

              {(() => {
                const stages = [
                  { label: "Purchased", sub: "Order placed" },
                  { label: "Payment Verified", sub: "Approved" },
                  { label: "Activated", sub: "Coop assigned" },
                  { label: "Producing", sub: "Daily harvest" },
                  { label: "Expiring Soon", sub: "≤ 7 days left" },
                  { label: "Completed", sub: "Cycle finished" },
                ];

                // Determine active stage index (0 to 5)
                let currentStageIndex = 3; // Default to producing for ACTIVE
                if (selectedRecord.status === "PENDING_PAYMENT") currentStageIndex = 0;
                else if (selectedRecord.status === "UNDER_REVIEW") currentStageIndex = 1;
                else if (selectedRecord.status === "PENDING_ACTIVATION") currentStageIndex = 2;
                else if (selectedRecord.status === "ACTIVE" && selectedRecord.isExpiringSoon)
                  currentStageIndex = 4;
                else if (
                  selectedRecord.status === "EXPIRED" ||
                  selectedRecord.status === "COMPLETED"
                )
                  currentStageIndex = 5;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                    {stages.map((stage, idx) => {
                      const isPast = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      return (
                        <div
                          key={stage.label}
                          className={`p-2 rounded-xl text-center border transition-all ${
                            isCurrent
                              ? "bg-[#FFF8EC] border-[#D8793F] ring-1 ring-[#D8793F]/30"
                              : isPast
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                              : "bg-gray-50 border-gray-200 text-gray-400"
                          }`}
                        >
                          <div className="flex justify-center mb-1">
                            {isPast ? (
                              <CheckCircle2 size={15} className="text-emerald-600" />
                            ) : isCurrent ? (
                              <span className="relative flex size-3">
                                <span className="harvest-pulse-dot absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex size-3 rounded-full bg-[#D8793F]" />
                              </span>
                            ) : (
                              <span className="size-2.5 rounded-full border border-gray-300 mt-0.5" />
                            )}
                          </div>
                          <p
                            className={`text-[10px] font-black leading-tight ${
                              isCurrent ? "text-[#17372F]" : isPast ? "text-emerald-900" : "text-gray-500"
                            }`}
                          >
                            {stage.label}
                          </p>
                          <p className="text-[8.5px] text-gray-500 mt-0.5">{stage.sub}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Detailed Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Flock Quantity</span>
                <span className="text-sm font-black text-[#17372F]">
                  {selectedRecord.quantity} {selectedRecord.quantity === 1 ? "Hen" : "Hens"}
                </span>
              </div>

              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Total Harvested</span>
                <span className="text-sm font-black text-emerald-800">
                  {selectedRecord.totalEggUnitsProduced.toLocaleString()} Eggs
                </span>
              </div>

              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Purchase Price</span>
                <span className="text-sm font-black text-[#17372F]">
                  Rs {selectedRecord.purchasePriceRs.toLocaleString()}
                </span>
              </div>

              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Days Completed</span>
                <span className="text-sm font-black text-[#17372F]">
                  {selectedRecord.daysCompleted} / {selectedRecord.productionCycleDaysTotal} Days
                </span>
              </div>

              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Days Remaining</span>
                <span className="text-sm font-black text-[#D8793F]">
                  {selectedRecord.productionCycleDaysRemaining !== null
                    ? `${selectedRecord.productionCycleDaysRemaining} Days`
                    : "Completed"}
                </span>
              </div>

              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Cycle Progress</span>
                <span className="text-sm font-black text-[#17372F]">
                  {selectedRecord.cycleProgressPercent}%
                </span>
              </div>
            </div>

            {/* Linked Purchase Order Strip */}
            <div className="flex items-center justify-between rounded-xl border border-[#D8793F]/20 bg-[#FFF8EC] p-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#566D7E] block">Associated Purchase Order</span>
                <span className="font-mono font-bold text-[#17372F]">#{selectedRecord.orderReference}</span>
              </div>
              <Link
                href={`/dashboard/orders/${selectedRecord.orderId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D8793F] text-white hover:brightness-105 transition min-h-[34px]"
              >
                <span>View Order</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => downloadFlockRegistryCsv([selectedRecord])}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#17372F] bg-[#FFF8EC] hover:bg-[#FFF3DF] border border-[#D8793F]/30 transition cursor-pointer min-h-[40px]"
              >
                <Download size={14} className="text-[#8C3A14]" />
                <span>Export Record CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#17372F] text-white hover:bg-[#071E28] active:scale-[0.98] transition cursor-pointer min-h-[40px]"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

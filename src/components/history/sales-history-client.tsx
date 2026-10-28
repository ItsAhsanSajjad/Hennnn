"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock,
  Egg,
  ExternalLink,
  Search,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { SubpageHeader } from "@/components/dashboard/shared/subpage-header";
import { StatisticsStrip, StatItem } from "@/components/dashboard/shared/stat-card";
import { formatDateTime } from "@/lib/utilities/format";

export type SaleRecord = {
  id: string;
  publicReference: string;
  marketName: string;
  eggQuantity: number;
  ratePerEggRs: number;
  totalAmountRs: number;
  payoutMethod: "JAZZCASH" | "EASYPAISA";
  accountNumberMasked: string;
  accountHolderNameProtected?: string | null;
  status: "PENDING_PAYMENT" | "PROCESSING" | "PAID" | "REJECTED" | "CANCELLED" | "AWAITING_REVIEW";
  submittedAt: string;
  paidAt: string | null;
  processingAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  adminTransactionId?: string | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
};

interface SalesHistoryClientProps {
  records: SaleRecord[];
  totalSoldEggs: number;
  totalPaidRs: number;
  pendingPayoutRs: number;
  completedSalesCount: number;
}

export function SalesHistoryClient({
  records,
  totalSoldEggs,
  totalPaidRs,
  pendingPayoutRs,
  completedSalesCount,
}: SalesHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "PENDING" | "PROCESSING" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SaleRecord | null>(null);

  const stats: StatItem[] = [
    {
      label: "Total Sold Eggs",
      value: `${totalSoldEggs.toLocaleString()} Eggs`,
      subtext: `Across ${completedSalesCount} trades`,
      subtextColor: "emerald",
      icon: Egg,
      iconBg: "copper",
    },
    {
      label: "Disbursed / Paid",
      value: `Rs ${totalPaidRs.toLocaleString()}`,
      subtext: "Settled to JazzCash/Easypaisa",
      subtextColor: "emerald",
      icon: Banknote,
      iconBg: "emerald",
    },
    {
      label: "In Queue / Pending",
      value: `Rs ${pendingPayoutRs.toLocaleString()}`,
      subtext: "24-48h SLA verification",
      subtextColor: pendingPayoutRs > 0 ? "amber" : "neutral",
      icon: Clock,
      iconBg: "amber",
    },
    {
      label: "Completed Trades",
      value: `${completedSalesCount} Trades`,
      subtext: "Finalized marketplace sales",
      subtextColor: "neutral",
      icon: CheckCircle2,
      iconBg: "copper",
    },
  ];

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Tab filter
      if (activeTab === "PAID" && rec.status !== "PAID") return false;
      if (
        activeTab === "PENDING" &&
        rec.status !== "PENDING_PAYMENT" &&
        rec.status !== "AWAITING_REVIEW"
      )
        return false;
      if (activeTab === "PROCESSING" && rec.status !== "PROCESSING") return false;
      if (activeTab === "REJECTED" && rec.status !== "REJECTED" && rec.status !== "CANCELLED") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = rec.publicReference.toLowerCase().includes(q);
        const matchesMarket = rec.marketName.toLowerCase().includes(q);
        const matchesAccount = rec.accountNumberMasked.toLowerCase().includes(q);
        return matchesRef || matchesMarket || matchesAccount;
      }

      return true;
    });
  }, [records, activeTab, searchQuery]);

  const getStatusBadge = (status: SaleRecord["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
            <CheckCircle2 size={12} className="text-emerald-600" /> Paid / Disbursed
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-600/30 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
            <Clock size={12} className="text-blue-600 animate-spin" /> Processing
          </span>
        );
      case "PENDING_PAYMENT":
      case "AWAITING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-600/30 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
            <Clock size={12} className="text-amber-600" /> Pending Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-600/30 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
            <XCircle size={12} className="text-red-600" /> Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getProviderPill = (method: "JAZZCASH" | "EASYPAISA", masked: string) => {
    const isJazz = method === "JAZZCASH";
    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center justify-center size-5 rounded-full text-[9px] font-black text-white shrink-0 ${
            isJazz ? "bg-[#EB1C24]" : "bg-[#00A859]"
          }`}
        >
          {isJazz ? "JC" : "EP"}
        </span>
        <span className="font-mono text-xs font-bold text-[#17372F]">{masked}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-36 sm:pb-28">
      <SubpageHeader
        badge="Sold Egg History & Marketplace Trades"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard/sell-eggs"
        actionLabel="Sell More Eggs"
        actionIcon="egg"
      />

      <StatisticsStrip stats={stats} />

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFDF4] border border-[#D8793F]/25 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_8px_20px_rgba(16,34,45,0.05)]">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "All Sales", count: records.length },
            { id: "PAID", label: "Paid", count: records.filter((r) => r.status === "PAID").length },
            {
              id: "PENDING",
              label: "Pending",
              count: records.filter((r) => r.status === "PENDING_PAYMENT" || r.status === "AWAITING_REVIEW").length,
            },
            {
              id: "PROCESSING",
              label: "Processing",
              count: records.filter((r) => r.status === "PROCESSING").length,
            },
            {
              id: "REJECTED",
              label: "Rejected / Cancelled",
              count: records.filter((r) => r.status === "REJECTED" || r.status === "CANCELLED").length,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all shrink-0 cursor-pointer min-h-[36px] ${
                  isActive
                    ? "bg-[#D8793F] text-white shadow-xs"
                    : "bg-[#FFF8EC] text-[#566D7E] hover:bg-[#FFF3DF] hover:text-[#17372F]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-[#D8793F]/15 text-[#8C3A14]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[200px] sm:max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#566D7E]/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference or market..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D8793F]/25 rounded-xl text-[#17372F] placeholder:text-[#566D7E]/50 focus:outline-none focus:border-[#D8793F] min-h-[36px]"
          />
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-8 sm:p-12 text-center shadow-[0_8px_24px_rgba(16,34,45,0.06)]">
          <div className="size-16 mx-auto rounded-2xl bg-[#D8793F]/15 flex items-center justify-center text-[#D8793F] mb-3">
            <Banknote size={32} />
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#17372F]">No Sold Egg Records Found</h3>
          <p className="mt-1 text-xs sm:text-sm text-[#566D7E] max-w-sm mx-auto">
            {searchQuery
              ? "No trade records matched your search query. Try clearing the filter."
              : "You have not submitted any egg sales in this category."}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/sell-eggs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#D8793F] text-white hover:brightness-105 transition"
            >
              <Egg size={14} /> Sell Eggs in Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] overflow-hidden shadow-[0_8px_24px_rgba(16,34,45,0.06)]">
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D8793F]/15 bg-[#FFF8EC] text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                  <th className="py-3 px-4">Sale Ref &amp; Market</th>
                  <th className="py-3 px-4">Eggs Sold</th>
                  <th className="py-3 px-4">Rate / Egg</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payout Account</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8793F]/10">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#FFF8EC]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-[#17372F]">{rec.publicReference}</p>
                      <p className="text-[11px] text-[#566D7E] font-semibold mt-0.5">{rec.marketName}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-sm text-[#17372F]">{rec.eggQuantity}</span>{" "}
                      <span className="text-[10px] font-bold text-[#566D7E]">Eggs</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#D8793F]">Rs {rec.ratePerEggRs.toFixed(2)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-sm text-emerald-800">
                        Rs {rec.totalAmountRs.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getProviderPill(rec.payoutMethod, rec.accountNumberMasked)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(rec.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#D8793F]/30 bg-[#FFF8EC] px-3 py-1.5 text-xs font-bold text-[#8C3A14] hover:bg-[#FFF3DF] transition cursor-pointer min-h-[32px]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-[#D8793F]/15">
            {filteredRecords.map((rec) => (
              <div key={rec.id} className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#17372F] block">{rec.publicReference}</span>
                    <span className="text-[11px] font-semibold text-[#566D7E]">{rec.marketName}</span>
                  </div>
                  {getStatusBadge(rec.status)}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#FFF8EC] rounded-xl p-2.5 text-center border border-[#D8793F]/15">
                  <div>
                    <span className="text-[9px] font-bold text-[#566D7E] uppercase block">Sold</span>
                    <span className="text-xs font-black text-[#17372F]">{rec.eggQuantity} Eggs</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#566D7E] uppercase block">Rate</span>
                    <span className="text-xs font-bold text-[#D8793F]">Rs {rec.ratePerEggRs.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#566D7E] uppercase block">Total PKR</span>
                    <span className="text-xs font-black text-emerald-800">Rs {rec.totalAmountRs.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#566D7E]">
                  <div>{getProviderPill(rec.payoutMethod, rec.accountNumberMasked)}</div>
                  <button
                    onClick={() => setSelectedRecord(rec)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8C3A14] hover:underline cursor-pointer"
                  >
                    View Details <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                  <Banknote size={24} className="text-[#FFD0A5]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8C3A14] uppercase">Trade Reference</span>
                  <h3 className="text-lg font-black text-[#17372F] leading-tight font-mono">
                    {selectedRecord.publicReference}
                  </h3>
                  <p className="text-xs text-[#566D7E]">{selectedRecord.marketName}</p>
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
                <span className="text-[10px] font-bold text-[#566D7E] uppercase block">Trade Status</span>
                <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#566D7E] uppercase block">Total Disbursed</span>
                <span className="text-lg font-black text-emerald-800">
                  Rs {selectedRecord.totalAmountRs.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Eggs Sold</span>
                <span className="text-sm font-black text-[#17372F]">{selectedRecord.eggQuantity} Eggs</span>
              </div>
              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Execution Rate</span>
                <span className="text-sm font-black text-[#D8793F]">
                  Rs {selectedRecord.ratePerEggRs.toFixed(2)} / egg
                </span>
              </div>
              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Payout Channel</span>
                <span className="text-xs font-bold text-[#17372F]">{selectedRecord.payoutMethod}</span>
              </div>
              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Account Number</span>
                <span className="text-xs font-mono font-bold text-[#17372F]">
                  {selectedRecord.accountNumberMasked}
                </span>
              </div>
              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Submitted Date</span>
                <span className="text-xs font-bold text-[#17372F]">{formatDateTime(selectedRecord.submittedAt)}</span>
              </div>
              <div className="rounded-xl border border-[#D8793F]/15 bg-white p-2.5">
                <span className="text-[10px] font-bold text-[#566D7E] block">Settlement Date</span>
                <span className="text-xs font-bold text-[#17372F]">
                  {selectedRecord.paidAt ? formatDateTime(selectedRecord.paidAt) : "Pending Disbursal"}
                </span>
              </div>
            </div>

            {selectedRecord.adminTransactionId && (
              <div className="rounded-xl border border-emerald-600/30 bg-emerald-50 p-3 text-xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Bank Transaction ID</span>
                <span className="font-mono font-bold text-emerald-900">{selectedRecord.adminTransactionId}</span>
              </div>
            )}

            {selectedRecord.rejectionReason && (
              <div className="rounded-xl border border-red-600/30 bg-red-50 p-3 text-xs">
                <span className="text-[10px] font-bold text-red-800 uppercase block">Rejection Reason</span>
                <p className="font-bold text-red-900 mt-0.5">{selectedRecord.rejectionReason}</p>
              </div>
            )}

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

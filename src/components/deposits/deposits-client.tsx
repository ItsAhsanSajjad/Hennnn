"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  ShoppingCart,
  CreditCard,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ChevronRight,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { SubpageHeader } from "@/components/dashboard/shared/subpage-header";
import { PremiumHero } from "@/components/dashboard/shared/premium-hero";
import { StatisticsStrip } from "@/components/dashboard/shared/stat-card";
import { FilterBar, FilterOption } from "@/components/dashboard/shared/filter-bar";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { RecordModal } from "@/components/dashboard/shared/record-modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/utilities/format";

export interface DepositRecordData {
  id: string;
  orderReference: string;
  planName: string;
  quantity: number;
  totalAmountRs: number;
  paymentMethod: "MANUAL" | "PAYBOST";
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  rawStatus: string;
  createdAt: string;
  paymentProviderName: string | null;
  transactionReference: string | null;
  proofImageUrl: string | null;
  adminReviewNotes: string | null;
}

interface DepositsClientProps {
  totalApprovedRs: number;
  totalPendingRs: number;
  totalRejectedRs: number;
  totalRecordsCount: number;
  records: DepositRecordData[];
}

type DepositFilter = "ALL" | "APPROVED" | "PENDING" | "REJECTED";

export function DepositsClient({
  totalApprovedRs,
  totalPendingRs,
  totalRejectedRs,
  totalRecordsCount,
  records,
}: DepositsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DepositFilter>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<DepositRecordData | null>(null);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.transactionReference && r.transactionReference.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "APPROVED"
        ? r.status === "APPROVED"
        : statusFilter === "PENDING"
        ? r.status === "PENDING"
        : r.status === "REJECTED" || r.status === "CANCELLED";
    return matchesSearch && matchesStatus;
  });

  const filterOptions: FilterOption<DepositFilter>[] = [
    { id: "ALL", label: "All Deposits", count: records.length },
    { id: "APPROVED", label: "Approved", count: records.filter((r) => r.status === "APPROVED").length },
    { id: "PENDING", label: "Pending", count: records.filter((r) => r.status === "PENDING").length },
    {
      id: "REJECTED",
      label: "Rejected",
      count: records.filter((r) => r.status === "REJECTED" || r.status === "CANCELLED").length,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Subpage Navigation Strip */}
      <SubpageHeader
        badge="Purchase Deposits"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard/plans"
        actionLabel="New Deposit"
        actionIcon="cart"
      />

      {/* 2. Premium Deposit Hero */}
      <PremiumHero
        badge="Flock Purchases"
        badgeIcon={Landmark}
        title="Purchase Deposits & Top-ups"
        description="Track your hen plan deposit transactions, review manual bank verification receipts, and inspect automated PayBost digital checkouts."
        imageSrc="/assets/dashboard/shortcuts/shortcut-deposits.webp"
        imageAlt="Deposits and Top-ups"
        chips={[
          { label: "Secure Payment Verification", icon: ShieldCheck },
          { label: "Manual Bank & PayBost Gateway", icon: CreditCard },
        ]}
        primaryAction={{
          label: "New Deposit / Buy Hens",
          href: "/dashboard/plans",
          icon: ShoppingCart,
        }}
      />

      {/* 3. Statistics Strip */}
      <StatisticsStrip
        stats={[
          {
            label: "Approved Deposits",
            value: `PKR ${totalApprovedRs.toLocaleString()}`,
            icon: CheckCircle2,
            iconBg: "emerald",
            subtext: "Verified Hen Plans",
            subtextColor: "emerald",
          },
          {
            label: "Pending Verification",
            value: `PKR ${totalPendingRs.toLocaleString()}`,
            icon: Clock3,
            iconBg: "amber",
            subtext: "In Review Queue",
            subtextColor: "amber",
          },
          {
            label: "Rejected / Cancelled",
            value: `PKR ${totalRejectedRs.toLocaleString()}`,
            icon: AlertCircle,
            iconBg: "copper",
            subtext: "Failed Top-ups",
            subtextColor: "copper",
          },
          {
            label: "Total Submissions",
            value: `${totalRecordsCount} Records`,
            icon: Receipt,
            iconBg: "navy",
          },
        ]}
        ctaHref="/dashboard/plans"
        ctaLabel="New Deposit"
      />

      {/* 4. Deposits Ledger Section */}
      <section aria-label="Deposit Records" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8793F]/15 pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              TRANSACTION HISTORY
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Recent Deposits
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#566D7E]">
            Real-time status updates from payment desk
          </span>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search order reference, plan, or TRX ID..."
          filterOptions={filterOptions}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
          totalResultsText={`${filteredRecords.length} records`}
        />

        {/* Records Display */}
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title={searchQuery ? "No matching deposit records" : "No deposits submitted yet"}
            description={
              searchQuery
                ? "Try adjusting your search terms or switch your status filter to 'All Deposits'."
                : "Choose a hen plan and submit your first purchase deposit to begin daily biological egg harvests."
            }
            actionLabel="Start New Purchase"
            actionHref="/dashboard/plans"
          />
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-5 shadow-[0_8px_20px_rgba(16,34,45,0.05)] hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`size-11 rounded-2xl grid place-items-center font-black shrink-0 ${
                      record.status === "APPROVED"
                        ? "bg-[#10B981]/15 text-[#0A3323]"
                        : record.status === "PENDING"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    <Landmark size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-[#17372F] truncate">
                        Order #{record.orderReference}
                      </h3>
                      <span className="rounded-full bg-[#FFF8EC] border border-[#D8793F]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8C3A14]">
                        {record.planName} ({record.quantity} Hens)
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#566D7E] flex items-center gap-1.5 mt-0.5">
                      <span>Method: {record.paymentMethod === "PAYBOST" ? "PayBost Online" : "Manual Bank"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDateTime(record.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#D8793F]/15 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-black text-[#17372F]">
                      PKR {record.totalAmountRs.toLocaleString()}
                    </div>
                    <div className="mt-0.5">
                      <StatusBadge status={record.status} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRecord(record)}
                    className="inline-flex items-center gap-1 rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] px-3.5 py-2 text-xs font-bold text-[#17372F] hover:bg-[#FFFDF4] transition cursor-pointer min-h-[44px]"
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Deposit Details Modal */}
      <RecordModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Deposit Order #${selectedRecord?.orderReference}`}
        badge={selectedRecord ? `Plan: ${selectedRecord.planName}` : undefined}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Deposit Status:</span>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Amount Recorded:</span>
                <span className="font-black text-[#17372F] text-sm">
                  PKR {selectedRecord.totalAmountRs.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Plan & Units:</span>
                <span className="font-bold text-[#17372F]">
                  {selectedRecord.planName} ({selectedRecord.quantity} Hens)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Payment Channel:</span>
                <span className="font-bold text-[#17372F]">
                  {selectedRecord.paymentMethod === "PAYBOST" ? "PayBost Gateway" : "Manual Bank Transfer"}
                </span>
              </div>
              {selectedRecord.paymentProviderName && (
                <div className="flex justify-between items-center">
                  <span className="text-[#566D7E]">Account Provider:</span>
                  <span className="font-bold text-[#17372F]">{selectedRecord.paymentProviderName}</span>
                </div>
              )}
              {selectedRecord.transactionReference && (
                <div className="flex justify-between items-center">
                  <span className="text-[#566D7E]">Transaction ID / TRX:</span>
                  <span className="font-mono font-bold text-[#17372F]">
                    {selectedRecord.transactionReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Submitted Date:</span>
                <span className="font-bold text-[#17372F]">
                  {formatDateTime(selectedRecord.createdAt)}
                </span>
              </div>
              {selectedRecord.adminReviewNotes && (
                <div className="border-t border-[#D8793F]/15 pt-2 text-xs">
                  <span className="text-[#8C3A14] font-black uppercase tracking-wider block">
                    Review Notes:
                  </span>
                  <p className="text-[#566D7E] mt-0.5">{selectedRecord.adminReviewNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/dashboard/plans"
                className="inline-flex items-center gap-1.5 rounded-2xl py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white bg-[#17372F] hover:bg-[#122A24] transition cursor-pointer min-h-[44px]"
              >
                Buy More Hens <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </RecordModal>
    </div>
  );
}

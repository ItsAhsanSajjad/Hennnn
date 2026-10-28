"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CreditCard,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Egg,
  Search,
  ChevronRight,
  Clock3,
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

export interface WithdrawalRecordData {
  id: string;
  publicReference: string;
  eggQuantity: number;
  totalAmountRs: number;
  ratePaisaPerEgg: number;
  payoutProvider: string | null;
  payoutAccountTitle: string | null;
  payoutIdentifierMasked: string | null;
  status: "CONFIRMED" | "PENDING" | "REJECTED" | "CANCELLED";
  rawStatus: string;
  submittedAt: string;
  settlementReference: string | null;
  adminNotes: string | null;
}

interface WithdrawalsClientProps {
  totalPaidRs: number;
  totalPendingRs: number;
  totalRejectedRs: number;
  totalRequestsCount: number;
  eggBalance: number;
  records: WithdrawalRecordData[];
}

type WithdrawalFilter = "ALL" | "PAID" | "PENDING" | "REJECTED";

export function WithdrawalsClient({
  totalPaidRs,
  totalPendingRs,
  totalRejectedRs,
  totalRequestsCount,
  eggBalance,
  records,
}: WithdrawalsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WithdrawalFilter>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<WithdrawalRecordData | null>(null);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.publicReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.payoutProvider && r.payoutProvider.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.payoutAccountTitle && r.payoutAccountTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "PAID"
        ? r.status === "CONFIRMED"
        : statusFilter === "PENDING"
        ? r.status === "PENDING"
        : r.status === "REJECTED" || r.status === "CANCELLED";
    return matchesSearch && matchesStatus;
  });

  const filterOptions: FilterOption<WithdrawalFilter>[] = [
    { id: "ALL", label: "All Requests", count: records.length },
    { id: "PAID", label: "Paid / Confirmed", count: records.filter((r) => r.status === "CONFIRMED").length },
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
        badge="Egg Cashouts"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard/sell-eggs"
        actionLabel="Sell Eggs Now"
        actionIcon="egg"
      />

      {/* 2. Premium Withdrawal Hero */}
      <PremiumHero
        badge="Egg Sales & Disbursements"
        badgeIcon={Banknote}
        title="Withdrawals & Egg Cashouts"
        description="Liquidate your harvested egg inventory, track automated settlements to Easypaisa, JazzCash, or bank accounts, and inspect transfer receipts."
        imageSrc="/assets/dashboard/shortcuts/shortcut-withdrawals.webp"
        imageAlt="Withdrawals and Egg Sales"
        chips={[
          { label: `Available Balance: ${eggBalance.toLocaleString()} Eggs`, icon: Egg },
          { label: "Easypaisa, JazzCash & Bank Settlements", icon: ShieldCheck },
        ]}
        primaryAction={{
          label: "Sell Eggs Now",
          href: "/dashboard/sell-eggs",
          icon: Egg,
        }}
      />

      {/* 3. Statistics Strip */}
      <StatisticsStrip
        stats={[
          {
            label: "Total Paid Out",
            value: `PKR ${totalPaidRs.toLocaleString()}`,
            icon: CheckCircle2,
            iconBg: "emerald",
            subtext: "Settled Disbursements",
            subtextColor: "emerald",
          },
          {
            label: "Pending Verification",
            value: `PKR ${totalPendingRs.toLocaleString()}`,
            icon: Clock3,
            iconBg: "amber",
            subtext: "In Processing Queue",
            subtextColor: "amber",
          },
          {
            label: "Rejected / Cancelled",
            value: `PKR ${totalRejectedRs.toLocaleString()}`,
            icon: AlertCircle,
            iconBg: "copper",
            subtext: "Returned to Balance",
            subtextColor: "copper",
          },
          {
            label: "Total Requests",
            value: `${totalRequestsCount} Records`,
            icon: Receipt,
            iconBg: "navy",
          },
        ]}
        ctaHref="/dashboard/sell-eggs"
        ctaLabel="Sell Eggs"
      />

      {/* 4. Withdrawals Ledger Section */}
      <section aria-label="Withdrawal Records" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8793F]/15 pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              DISBURSEMENT LEDGER
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Recent Payout Requests
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#566D7E]">
            Direct transfers to verified payment accounts
          </span>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search reference, provider, or account title..."
          filterOptions={filterOptions}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
          totalResultsText={`${filteredRecords.length} records`}
        />

        {/* Records Display */}
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title={searchQuery ? "No matching cashout requests" : "No withdrawals submitted yet"}
            description={
              searchQuery
                ? "Try adjusting your search criteria or switch your status filter to 'All Requests'."
                : "Harvest daily eggs from your active flock and convert them into PKR cash anytime."
            }
            actionLabel="Sell Eggs to Start"
            actionHref="/dashboard/sell-eggs"
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
                      record.status === "CONFIRMED"
                        ? "bg-[#10B981]/15 text-[#0A3323]"
                        : record.status === "PENDING"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    <Banknote size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-[#17372F] truncate">
                        Cashout #{record.publicReference}
                      </h3>
                      <span className="rounded-full bg-[#FFF8EC] border border-[#D8793F]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8C3A14]">
                        {record.eggQuantity.toLocaleString()} Eggs
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#566D7E] flex items-center gap-1.5 mt-0.5">
                      <span>To: {record.payoutProvider || "Digital Account"}</span>
                      {record.payoutIdentifierMasked && <span>({record.payoutIdentifierMasked})</span>}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDateTime(record.submittedAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#D8793F]/15 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-black text-[#10B981]">
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

      {/* 5. Withdrawal Details Modal */}
      <RecordModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Payout Request #${selectedRecord?.publicReference}`}
        badge={selectedRecord ? `${selectedRecord.eggQuantity.toLocaleString()} Eggs Sold` : undefined}
        badgeIcon={Egg}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Disbursement Status:</span>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Net Settlement Amount:</span>
                <span className="font-black text-[#10B981] text-sm">
                  PKR {selectedRecord.totalAmountRs.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Liquidated Egg Units:</span>
                <span className="font-bold text-[#17372F]">
                  {selectedRecord.eggQuantity.toLocaleString()} Eggs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Effective Rate:</span>
                <span className="font-bold text-[#17372F]">
                  PKR {(selectedRecord.ratePaisaPerEgg / 100).toFixed(2)} per Egg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Payout Provider:</span>
                <span className="font-bold text-[#17372F]">
                  {selectedRecord.payoutProvider || "Digital Wallet"}
                </span>
              </div>
              {selectedRecord.payoutAccountTitle && (
                <div className="flex justify-between items-center">
                  <span className="text-[#566D7E]">Account Title:</span>
                  <span className="font-bold text-[#17372F]">
                    {selectedRecord.payoutAccountTitle}
                  </span>
                </div>
              )}
              {selectedRecord.payoutIdentifierMasked && (
                <div className="flex justify-between items-center">
                  <span className="text-[#566D7E]">Account Identifier:</span>
                  <span className="font-mono font-bold text-[#17372F]">
                    {selectedRecord.payoutIdentifierMasked}
                  </span>
                </div>
              )}
              {selectedRecord.settlementReference && (
                <div className="flex justify-between items-center">
                  <span className="text-[#566D7E]">Settlement Reference:</span>
                  <span className="font-mono font-bold text-[#10B981]">
                    {selectedRecord.settlementReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Submitted Date:</span>
                <span className="font-bold text-[#17372F]">
                  {formatDateTime(selectedRecord.submittedAt)}
                </span>
              </div>
              {selectedRecord.adminNotes && (
                <div className="border-t border-[#D8793F]/15 pt-2 text-xs">
                  <span className="text-[#8C3A14] font-black uppercase tracking-wider block">
                    Review Notes:
                  </span>
                  <p className="text-[#566D7E] mt-0.5">{selectedRecord.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/dashboard/sell-eggs"
                className="inline-flex items-center gap-1.5 rounded-2xl py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white bg-[#17372F] hover:bg-[#122A24] transition cursor-pointer min-h-[44px]"
              >
                Sell More Eggs <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </RecordModal>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Gift,
  Share2,
  Copy,
  Check,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Award,
  ChevronRight,
  Info,
} from "lucide-react";
import { SubpageHeader } from "@/components/dashboard/shared/subpage-header";
import { PremiumHero } from "@/components/dashboard/shared/premium-hero";
import { StatisticsStrip } from "@/components/dashboard/shared/stat-card";
import { FilterBar, FilterOption } from "@/components/dashboard/shared/filter-bar";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { RecordModal } from "@/components/dashboard/shared/record-modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/utilities/format";

export interface CommissionRecordData {
  id: string;
  inviteeUsername: string;
  orderReference: string;
  planName: string;
  orderAmountRs: number;
  rewardEggUnits: number;
  status: "CREDITED" | "PENDING" | "VOIDED";
  createdAt: string;
  creditedAt: string | null;
}

interface CommissionsClientProps {
  totalBonusEggs: number;
  activeReferralsCount: number;
  qualifyingOrdersCount: number;
  referralCode: string;
  referralLink: string;
  records: CommissionRecordData[];
}

type CommissionStatusFilter = "ALL" | "CREDITED" | "PENDING";

export function CommissionsClient({
  totalBonusEggs,
  activeReferralsCount,
  qualifyingOrdersCount,
  referralCode,
  referralLink,
  records,
}: CommissionsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CommissionStatusFilter>("ALL");
  const [copied, setCopied] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecordData | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.inviteeUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.planName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "CREDITED"
        ? r.status === "CREDITED"
        : r.status === "PENDING";
    return matchesSearch && matchesStatus;
  });

  const filterOptions: FilterOption<CommissionStatusFilter>[] = [
    { id: "ALL", label: "All Commissions", count: records.length },
    { id: "CREDITED", label: "Credited", count: records.filter((r) => r.status === "CREDITED").length },
    { id: "PENDING", label: "Pending", count: records.filter((r) => r.status === "PENDING").length },
  ];

  const estimatedCashValueRs = (totalBonusEggs * 7.5).toLocaleString();

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Subpage Navigation Strip */}
      <SubpageHeader
        badge="Referral Bonuses"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard/team"
        actionLabel="My Team"
        actionIcon="team"
      />

      {/* 2. Premium Commissions Hero */}
      <PremiumHero
        badge="Referral Rewards"
        badgeIcon={Award}
        title="Referral Commissions & Bonuses"
        description="Review immutable ledger records for bonus egg allocations earned from your invited team's confirmed poultry plan purchases."
        imageSrc="/assets/dashboard/shortcuts/shortcut-refer-bonus.webp"
        imageAlt="Commission Rewards"
        chips={[
          { label: "Automatic Ledger Crediting", icon: ShieldCheck },
          { label: `Code: ${referralCode}`, icon: Sparkles },
        ]}
        primaryAction={{
          label: copied ? "Link Copied!" : "Invite Farmer",
          onClick: handleCopy,
          icon: copied ? Check : Copy,
        }}
        secondaryAction={{
          label: "View Farming Team",
          href: "/dashboard/team",
          icon: Users,
        }}
      />

      {/* 3. Statistics Strip */}
      <StatisticsStrip
        stats={[
          {
            label: "Total Bonus Eggs",
            value: `+${totalBonusEggs.toLocaleString()}`,
            icon: Gift,
            iconBg: "emerald",
            subtext: `≈ PKR ${estimatedCashValueRs} Value`,
            subtextColor: "emerald",
          },
          {
            label: "Active Referrals",
            value: `${activeReferralsCount} Farmers`,
            icon: Users,
            iconBg: "copper",
          },
          {
            label: "Qualifying Orders",
            value: `${qualifyingOrdersCount} Orders`,
            icon: PackageCheck,
            iconBg: "navy",
          },
        ]}
        ctaHref="/dashboard/team"
        ctaLabel="Grow Team"
      />

      {/* 4. Commission Ledger History Section */}
      <section aria-label="Commission Transactions" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8793F]/15 pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              LEDGER TRANSACTIONS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Commission History
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#566D7E]">
            Earned from Level 1 member plan activations
          </span>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by member, order reference, or plan..."
          filterOptions={filterOptions}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
          totalResultsText={`${filteredRecords.length} records`}
        />

        {/* Records Display */}
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={Gift}
            title={searchQuery ? "No matching commissions found" : "No referral bonuses credited yet"}
            description={
              searchQuery
                ? "Try adjusting your search keywords or clear your status filters."
                : "Invite friends and fellow farmers to GrowMeta Egg. When they activate their first flock, you will automatically earn bonus egg allocations."
            }
            actionLabel="Invite Farmers to Team"
            actionHref="/dashboard/team"
          />
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-5 shadow-[0_8px_20px_rgba(16,34,45,0.05)] hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="size-11 rounded-2xl bg-[#10B981]/15 text-[#0A3323] grid place-items-center font-black shrink-0">
                    <Gift size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-[#17372F] truncate">
                        {record.inviteeUsername}
                      </h3>
                      <span className="rounded-full bg-[#FFF8EC] border border-[#D8793F]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8C3A14]">
                        {record.planName}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#566D7E] flex items-center gap-1.5 mt-0.5">
                      <span>Order #{record.orderReference}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDateTime(record.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#D8793F]/15 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-black text-[#10B981]">
                      +{record.rewardEggUnits.toLocaleString()} Eggs
                    </div>
                    <p className="text-[11px] font-semibold text-[#566D7E]">
                      Order: PKR {record.orderAmountRs.toLocaleString()}
                    </p>
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

      {/* 5. Commission Policy Guide */}
      <section
        aria-label="Commission Policy"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_12px_28px_rgba(16,34,45,0.06)] space-y-4"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#10B981]/15 text-[#0A3323]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#17372F]">Referral Commission Guidelines</h2>
            <p className="text-xs font-semibold text-[#566D7E]">
              How bonus egg allocations are calculated, verified, and settled.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-1.5">
            <h3 className="text-xs font-black text-[#8C3A14] uppercase tracking-wider">
              Instant Egg Allocation
            </h3>
            <p className="text-xs font-semibold text-[#566D7E] leading-relaxed">
              When an invited farmer completes payment for an egg-laying hen plan, the corresponding bonus eggs are immediately added to your production inventory.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-1.5">
            <h3 className="text-xs font-black text-[#8C3A14] uppercase tracking-wider">
              Cashout & Egg Sales
            </h3>
            <p className="text-xs font-semibold text-[#566D7E] leading-relaxed">
              Bonus eggs carry identical value to daily harvest eggs and can be liquidated via the Sell Eggs portal at the current market rate anytime.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Commission Details Modal */}
      <RecordModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Commission Details"
        badge={selectedRecord ? `Order #${selectedRecord.orderReference}` : undefined}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Invited Farmer:</span>
                <span className="font-bold text-[#17372F]">{selectedRecord.inviteeUsername}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Purchased Plan:</span>
                <span className="font-bold text-[#17372F]">{selectedRecord.planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Order Amount:</span>
                <span className="font-bold text-[#17372F]">
                  PKR {selectedRecord.orderAmountRs.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Bonus Eggs Credited:</span>
                <span className="font-black text-[#10B981] text-sm">
                  +{selectedRecord.rewardEggUnits.toLocaleString()} Eggs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Status:</span>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Record Date:</span>
                <span className="font-bold text-[#17372F]">
                  {formatDateTime(selectedRecord.createdAt)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/dashboard/sell-eggs"
                className="inline-flex items-center gap-1.5 rounded-2xl py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white bg-[#10B981] hover:bg-[#059669] transition cursor-pointer min-h-[44px]"
              >
                Cash Out Eggs <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </RecordModal>
    </div>
  );
}

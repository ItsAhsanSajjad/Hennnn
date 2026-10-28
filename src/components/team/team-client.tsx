"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Share2,
  Copy,
  Check,
  Search,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Award,
  Layers,
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

export interface TeamMemberData {
  id: string;
  username: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "DISABLED";
  createdAt: string;
  activeHens: number;
  verifiedInvestmentRs: number;
  commissionEarnedEggs: number;
  level: 1 | 2;
}

interface TeamClientProps {
  userReferralCode: string;
  referralLink: string;
  totalMembers: number;
  activeMembers: number;
  totalTeamHens: number;
  totalEarnedEggs: number;
  sponsorUsername: string | null;
  level1Members: TeamMemberData[];
  level2Members: TeamMemberData[];
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export function TeamClient({
  userReferralCode,
  referralLink,
  totalMembers,
  activeMembers,
  totalTeamHens,
  totalEarnedEggs,
  sponsorUsername,
  level1Members,
  level2Members,
}: TeamClientProps) {
  const [activeTab, setActiveTab] = useState<"LEVEL_1" | "LEVEL_2">("LEVEL_1");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Join my agricultural poultry farming team on GrowMeta Egg! Acquire egg-laying hens and earn daily harvests. Sign up here: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const currentList = activeTab === "LEVEL_1" ? level1Members : level2Members;

  const filteredMembers = currentList.filter((m) => {
    const matchesSearch = m.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? m.status === "ACTIVE"
        : m.status !== "ACTIVE";
    return matchesSearch && matchesStatus;
  });

  const filterOptions: FilterOption<StatusFilter>[] = [
    { id: "ALL", label: "All Members", count: currentList.length },
    { id: "ACTIVE", label: "Active Farmers", count: currentList.filter((m) => m.status === "ACTIVE").length },
    { id: "INACTIVE", label: "Inactive / Pending", count: currentList.filter((m) => m.status !== "ACTIVE").length },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-36 sm:pb-28">
      {/* 1. Subpage Navigation Strip */}
      <SubpageHeader
        badge="Farming Team"
        backHref="/dashboard"
        backLabel="Dashboard"
        actionHref="/dashboard/refer-bonus"
        actionLabel="Commissions"
        actionIcon="arrow"
      />

      {/* 2. Premium Team Hero */}
      <PremiumHero
        badge="Community Network"
        badgeIcon={Users}
        title="Farm Together. Multiply Yield."
        description="Grow your verified poultry farming team. Every hen activated by your direct and indirect downline unlocks bonus egg harvests and milestone rewards."
        imageSrc="/assets/dashboard/shortcuts/shortcut-team.webp"
        imageAlt="Team Network"
        chips={[
          { label: sponsorUsername ? `Invited by: ${sponsorUsername}` : "Master Farmer Network", icon: ShieldCheck },
          { label: `Referral Code: ${userReferralCode}`, icon: Sparkles },
        ]}
        primaryAction={{
          label: copied ? "Link Copied!" : "Copy Invite Link",
          onClick: handleCopy,
          icon: copied ? Check : Copy,
        }}
        secondaryAction={{
          label: "Share via WhatsApp",
          onClick: handleWhatsAppShare,
          icon: Share2,
        }}
      />

      {/* 3. Statistics Strip */}
      <StatisticsStrip
        stats={[
          {
            label: "Total Team",
            value: `${totalMembers} Members`,
            icon: Users,
            iconBg: "copper",
          },
          {
            label: "Active Farmers",
            value: `${activeMembers} Active`,
            icon: UserCheck,
            iconBg: "emerald",
            subtext: `${Math.round((activeMembers / Math.max(1, totalMembers)) * 100)}% Active Ratio`,
            subtextColor: "emerald",
          },
          {
            label: "Team Flock",
            value: `${totalTeamHens} Hens`,
            icon: Layers,
            iconBg: "copper",
          },
          {
            label: "Commissions Earned",
            value: `+${totalEarnedEggs.toLocaleString()} Eggs`,
            icon: Award,
            iconBg: "emerald",
            subtext: `≈ PKR ${(totalEarnedEggs * 7.5).toLocaleString()}`,
            subtextColor: "emerald",
          },
        ]}
        ctaHref="/dashboard/refer-bonus"
        ctaLabel="View Commissions"
      />

      {/* 4. Referral Link Card */}
      <section
        aria-label="Personal Referral Link"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-6 shadow-[0_12px_28px_rgba(16,34,45,0.06)] space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#17372F] flex items-center gap-2">
              <UserPlus size={18} className="text-[#D8793F]" /> Your Personal Referral Link
            </h2>
            <p className="text-xs font-semibold text-[#566D7E]">
              Share this unique invitation URL with prospective poultry investors to automatically bind them to your downline.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#10B981] bg-[#10B981]/15 px-3 py-1 rounded-full self-start sm:self-auto">
            Instant Lifetime Binding
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="w-full flex-1 rounded-2xl border border-[#D8793F]/25 bg-[#FFF8EC] px-4 py-3 text-xs font-mono font-bold text-[#17372F] truncate select-all">
            {referralLink}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied
                ? "linear-gradient(180deg, #10B981 0%, #059669 100%)"
                : "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
              boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.25)",
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl py-3 px-5 text-xs font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition cursor-pointer min-h-[44px]"
          >
            {copied ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Link
              </>
            )}
          </button>
        </div>
      </section>

      {/* 5. Team Downline Tabs & Roster Section */}
      <section aria-label="Team Members Roster" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8793F]/15 pb-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              NETWORK STRUCTURE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight mt-0.5">
              Team Member Roster
            </h2>
          </div>

          {/* Level Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20">
            <button
              type="button"
              onClick={() => setActiveTab("LEVEL_1")}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer min-h-[38px] flex items-center gap-2 ${
                activeTab === "LEVEL_1"
                  ? "bg-[#17372F] text-[#FFFDF4] shadow-sm"
                  : "text-[#566D7E] hover:text-[#17372F] hover:bg-[#FFFDF4]/80"
              }`}
            >
              <span>Level 1 (Direct)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
                {level1Members.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("LEVEL_2")}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer min-h-[38px] flex items-center gap-2 ${
                activeTab === "LEVEL_2"
                  ? "bg-[#17372F] text-[#FFFDF4] shadow-sm"
                  : "text-[#566D7E] hover:text-[#17372F] hover:bg-[#FFFDF4]/80"
              }`}
            >
              <span>Level 2 (Indirect)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#D8793F]/15 text-[#8C3A14] font-bold">
                {level2Members.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search member by username..."
          filterOptions={filterOptions}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
          totalResultsText={`${filteredMembers.length} of ${currentList.length} members`}
        />

        {/* Member Grid / List */}
        {filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "No matching team members" : "No team members in this tier yet"}
            description={
              searchQuery
                ? "Try searching for a different username or reset your status filters."
                : "Share your referral link with new farmers to start building your Level 1 and Level 2 agricultural network."
            }
            actionLabel="Copy Referral Link"
            actionOnClick={handleCopy}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 shadow-[0_10px_24px_rgba(16,34,45,0.06)] hover:shadow-md transition-shadow space-y-4"
              >
                {/* Member Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 rounded-2xl bg-[#FFD0A5]/30 text-[#8C3A14] flex items-center justify-center font-black text-base shrink-0 border border-[#D8793F]/20">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-black text-[#17372F] truncate">
                        {member.username}
                      </h3>
                      <p className="text-[11px] font-semibold text-[#566D7E] flex items-center gap-1">
                        <Clock size={11} /> {formatDateTime(member.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={member.status} />
                </div>

                {/* Member Metrics */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#FFF8EC] p-3 border border-[#D8793F]/15 text-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#8C3A14] block">
                      Active Flock
                    </span>
                    <span className="text-sm font-black text-[#17372F]">
                      {member.activeHens} <span className="text-[10px] text-[#566D7E]">Hens</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#8C3A14] block">
                      Bonus Generated
                    </span>
                    <span className="text-sm font-black text-[#10B981]">
                      +{member.commissionEarnedEggs} <span className="text-[10px] text-[#566D7E]">Eggs</span>
                    </span>
                  </div>
                </div>

                {/* Details Button */}
                <button
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-2xl border border-[#D8793F]/25 bg-[#FFFDF4] py-2.5 text-xs font-bold text-[#17372F] hover:bg-[#FFF8EC] transition cursor-pointer min-h-[44px]"
                >
                  View Details <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Team Bonus Rules Guide */}
      <section
        aria-label="Team Bonus Rules"
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_12px_28px_rgba(16,34,45,0.06)] space-y-4"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
            <Info size={20} />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#17372F]">How Team Bonuses & Downlines Work</h2>
            <p className="text-xs font-semibold text-[#566D7E]">
              Clear, transparent rules governing your agricultural community commissions.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-1.5">
            <span className="text-xs font-black text-[#8C3A14] uppercase tracking-wider block">
              1. Direct Invitations (Level 1)
            </span>
            <p className="text-xs font-semibold text-[#566D7E] leading-relaxed">
              When members register via your link and acquire hen plans, you receive immediate referral bonus eggs credited straight to your egg inventory.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-1.5">
            <span className="text-xs font-black text-[#8C3A14] uppercase tracking-wider block">
              2. Indirect Growth (Level 2)
            </span>
            <p className="text-xs font-semibold text-[#566D7E] leading-relaxed">
              Members invited by your Level 1 downline form your Level 2 network, qualifying your account for milestone reward achievements.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-1.5">
            <span className="text-xs font-black text-[#8C3A14] uppercase tracking-wider block">
              3. Permanent Account Binding
            </span>
            <p className="text-xs font-semibold text-[#566D7E] leading-relaxed">
              Referral relationships are immutable and tamper-proof in the database ledger. Every subsequent hen purchase automatically credits the inviter.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Member Details Modal */}
      <RecordModal
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? selectedMember.username : ""}
        badge={selectedMember ? `Tier: Level ${selectedMember.level} Farmer` : undefined}
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#FFF8EC] p-4 border border-[#D8793F]/15 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Account Status:</span>
                <StatusBadge status={selectedMember.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Registration Date:</span>
                <span className="font-bold text-[#17372F]">
                  {formatDateTime(selectedMember.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Active Laying Hens:</span>
                <span className="font-bold text-[#17372F]">{selectedMember.activeHens} Hens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Verified Investment:</span>
                <span className="font-bold text-[#17372F]">
                  PKR {selectedMember.verifiedInvestmentRs.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#566D7E]">Total Commission Credited:</span>
                <span className="font-bold text-[#10B981]">
                  +{selectedMember.commissionEarnedEggs} Eggs
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/dashboard/refer-bonus"
                className="inline-flex items-center gap-1.5 rounded-2xl py-2.5 px-4 text-xs font-black uppercase tracking-wider text-white bg-[#17372F] hover:bg-[#122A24] transition cursor-pointer min-h-[44px]"
              >
                View Commission Breakdown <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </RecordModal>
    </div>
  );
}

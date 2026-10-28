import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Egg,
  History,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { getUserEggCenterSummary } from "@/server/services/egg-ledger";

export const dynamic = "force-dynamic";

export default async function DashboardEggLedgerPage() {
  const user = await requireUser();
  const summary = await getUserEggCenterSummary(user.id);
  const hasAvailableEggs = summary.availableEggs > 0 && summary.ratePaisaPerEgg !== null;
  const rateLabel =
    summary.ratePaisaPerEgg === null
      ? "Temporarily unavailable"
      : formatPaisa(summary.ratePaisaPerEgg);

  const metrics = [
    {
      label: "Produced today",
      value: summary.eggsProducedToday,
      detail: "Today’s credited farm production",
      color: "from-amber-400 to-amber-600",
      iconBg: "bg-amber-100 text-amber-800",
    },
    {
      label: "Total generated",
      value: summary.totalEggsGenerated,
      detail: "Lifetime production credits to date",
      color: "from-emerald-400 to-emerald-600",
      iconBg: "bg-emerald-100 text-emerald-800",
    },
    {
      label: "Available eggs",
      value: summary.availableEggs,
      detail: "Ready to request for instant trade",
      color: "from-[#F59B52] to-[#D8793F]",
      iconBg: "bg-[#FFD0A5]/40 text-[#8C3A14]",
      highlight: true,
    },
    {
      label: "Reserved for sale",
      value: summary.eggsReservedForSale,
      detail: "Held in active review requests",
      color: "from-sky-400 to-sky-600",
      iconBg: "bg-sky-100 text-sky-800",
    },
    {
      label: "Eggs already sold",
      value: summary.eggsAlreadySold,
      detail: "Completed egg-sale batches",
      color: "from-teal-400 to-teal-600",
      iconBg: "bg-teal-100 text-teal-800",
    },
    {
      label: "Eggs settled",
      value: summary.eggsSettled,
      detail: "Finalized by GrowMeta finance",
      color: "from-purple-400 to-purple-600",
      iconBg: "bg-purple-100 text-purple-800",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Egg Production Ledger"
        subtitle="Track your daily production, reservations, sales, and total yields."
        actionLabel="Sell Eggs"
        actionHref="/dashboard/sell-eggs"
        actionIcon="egg"
      />

      {/* 2. Large Dark Feature Hero Card (EGG HARVEST CENTER) */}
      <section
        style={{
          background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
          boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
        }}
        className="relative overflow-hidden rounded-3xl border-2 border-[#D8793F]/40 p-6 sm:p-8 text-white group"
        aria-label="Egg Center Hero"
      >
        {/* Background Ambient Rings */}
        <div className="absolute -right-8 -top-8 size-64 rounded-full border-2 border-[#D8793F]/15 pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 size-80 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#D8793F]/25 text-[#FFD0A5] border border-[#D8793F]/40">
              <Sparkles size={13} /> EGG HARVEST CENTER
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black text-[#FFFDF4] tracking-tight">
              Your Egg Position & Yield
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#DCE8E8] leading-relaxed max-w-lg">
              See what has been credited from active flocks, what is reserved in processing, and what can be submitted for an instant egg-sale review.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/sell-eggs"
                style={{
                  background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                  boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.35)",
                }}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-black text-white hover:brightness-105 active:translate-y-0.5 transition"
              >
                <WalletCards size={15} /> Sell Available Eggs
              </Link>
              <Link
                href="/dashboard/hens"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#FFD0A5] hover:bg-white/15 transition"
              >
                <TrendingUp size={15} /> View Hen Production
              </Link>
            </div>
          </div>

          {/* Rate & Estimated Value Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px] shrink-0">
            <div className="rounded-2xl border border-[#D8793F]/30 bg-white/5 backdrop-blur-md p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#FFD0A5]">
                Current Buyback Rate
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-[#FFFDF4]">
                {rateLabel}
                {summary.ratePaisaPerEgg !== null ? (
                  <span className="ml-1 text-xs font-semibold text-[#DCE8E8]">/ egg</span>
                ) : null}
              </p>
              <p className="mt-1 text-[11px] text-[#DCE8E8]/70 flex items-center gap-1">
                <Zap size={11} className="text-[#F59B52]" /> Guaranteed minimum price
              </p>
            </div>

            <div className="rounded-2xl border border-[#D8793F]/30 bg-white/5 backdrop-blur-md p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#FFD0A5]">
                Estimated Value
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-[#FFFDF4]">
                {summary.estimatedAvailableValuePaisa === null
                  ? "PKR 0"
                  : formatPaisa(summary.estimatedAvailableValuePaisa)}
              </p>
              <p className="mt-1 text-[11px] text-[#DCE8E8]/70 flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-400" /> Available for cashout
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Six Porcelain Metric Cards */}
      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Egg account summary metrics"
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`rounded-3xl border ${
              metric.highlight
                ? "border-[#D8793F] bg-[#FFF8EC] shadow-[0_16px_36px_rgba(216,121,63,0.15)]"
                : "border-[#D8793F]/25 bg-[#FFFDF4] shadow-[0_14px_32px_rgba(16,34,45,0.08)]"
            } p-5 sm:p-6 transition hover:translate-y-[-2px]`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#8C3A14]">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl sm:text-4xl font-black tabular-nums text-[#17372F]">
                  {metric.value.toLocaleString()}
                  <span className="ml-1.5 text-xs font-bold text-[#566D7E]">eggs</span>
                </p>
                <p className="mt-2 text-xs font-semibold text-[#566D7E] leading-relaxed">
                  {metric.detail}
                </p>
              </div>
              <span className={`grid size-11 place-items-center rounded-2xl ${metric.iconBg} shadow-sm shrink-0`}>
                <Egg aria-hidden="true" size={22} />
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* 4. Action Banner */}
      <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#FFD0A5]/40 text-[#8C3A14]">
              <WalletCards aria-hidden="true" size={20} />
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#17372F]">
              Sell Available Harvest
            </h3>
          </div>
          {hasAvailableEggs ? (
            <p className="mt-2 max-w-xl text-xs sm:text-sm font-semibold leading-relaxed text-[#566D7E]">
              You have {summary.availableEggs.toLocaleString()} eggs ready for instant trade. Select your saved payout method and receive payment quickly.
            </p>
          ) : (
            <p className="mt-2 max-w-xl text-xs sm:text-sm font-semibold leading-relaxed text-[#566D7E]">
              There are no eggs available to sell yet. Eggs become available every 24 hours after daily production is credited from your active flocks.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {hasAvailableEggs ? (
            <Link
              href="/dashboard/sell-eggs"
              style={{
                background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.3)",
              }}
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs sm:text-sm font-black text-white hover:brightness-105 active:translate-y-0.5 transition"
            >
              Sell Eggs Now
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          ) : (
            <span className="inline-flex items-center rounded-2xl border border-[#D8793F]/20 bg-[#FFF8EC] px-5 py-3 text-xs sm:text-sm font-black text-[#566D7E]/60">
              No Eggs to Sell Yet
            </span>
          )}
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#D8793F]/30 bg-white px-5 py-3 text-xs sm:text-sm font-black text-[#17372F] hover:bg-[#FFF8EC] transition"
          >
            <ShoppingCart aria-hidden="true" size={15} />
            Add More Hens
          </Link>
        </div>
      </section>

      {/* 5. Recent Egg Activity Card */}
      <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
              <History aria-hidden="true" size={20} />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#17372F]">
                Recent Egg Activity
              </h3>
              <p className="mt-0.5 text-xs font-semibold text-[#566D7E]">
                Every production credit, sale reservation, and settlement is logged.
              </p>
            </div>
          </div>
        </div>

        {summary.recentActivity.length ? (
          <div className="mt-6 space-y-3">
            {summary.recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#D8793F]/20 bg-[#FFF8EC] p-4 transition hover:border-[#D8793F]/40"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-7 place-items-center rounded-lg text-xs font-black ${
                      entry.eggUnits >= 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {entry.eggUnits >= 0 ? "+" : "-"}
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-[#17372F]">
                      {entry.description}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8C3A14]">
                      {entry.entryType.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 pl-10 sm:pl-0">
                  <span
                    className={`text-sm sm:text-base font-black tabular-nums ${
                      entry.eggUnits >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {entry.eggUnits > 0 ? "+" : ""}
                    {entry.eggUnits} eggs
                  </span>
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-[#566D7E]">
                    <Clock3 aria-hidden="true" size={12} />
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#D8793F]/30 bg-[#FFF8EC] p-8 text-center">
            <Egg className="mx-auto text-[#D8793F]/50" size={36} />
            <p className="mt-3 text-xs sm:text-sm font-bold text-[#17372F]">No egg activity recorded yet</p>
            <p className="mt-1 text-xs text-[#566D7E]">
              Activity will appear here when your hens lay eggs or you submit an egg-sale request.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  Bird,
  CheckCircle2,
  Clock,
  Egg,
  HelpCircle,
  PackagePlus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  TrendingUp,
} from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { getEggBalance } from "@/server/services/egg-ledger";
import { ensureEggAccrualsCurrent } from "@/server/services/egg-accrual";

export const dynamic = "force-dynamic";

export default async function DashboardHensPage() {
  const user = await requireUser();
  await ensureEggAccrualsCurrent();

  const [hens, eggBalance] = await Promise.all([
    prisma.henAsset.findMany({
      where: { userId: user.id },
      include: { purchaseOrder: true },
      orderBy: { createdAt: "desc" },
    }),
    getEggBalance(user.id),
  ]);

  const activeHensList = hens.filter((h) => h.status === "ACTIVE");
  const activePlansCount = activeHensList.length;
  const totalActiveHens = activeHensList.reduce((acc, h) => acc + h.quantity, 0);
  // Estimate daily eggs: each hen produces ~1 egg per day as per standard plan
  const estimatedDailyEggs = totalActiveHens * 1;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="My Hen Farm"
        subtitle="Manage your active flocks, daily yield and upcoming collections."
        actionLabel="Buy New Plan"
        actionHref="/dashboard/plans"
        actionIcon="cart"
      />

      {/* 2. Large Dark Feature Hero Card (MY ACTIVE FARM) */}
      <section
        style={{
          background: "linear-gradient(135deg, #09263A 0%, #061A2B 100%)",
          boxShadow: "0 16px 36px rgba(6, 26, 43, 0.45), 0 3px 0 #04121A",
        }}
        className="relative overflow-hidden rounded-3xl border-2 border-[#D8793F]/40 p-6 sm:p-8 text-white group"
        aria-label="Active Farm Hero"
      >
        {/* Background Ambient Rings */}
        <div className="absolute -right-8 -top-8 size-64 rounded-full border-2 border-[#D8793F]/15 pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 size-80 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#D8793F]/25 text-[#FFD0A5] border border-[#D8793F]/40">
              <Sparkles size={13} /> MY ACTIVE FARM
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black text-[#FFFDF4] tracking-tight">
              Your plans are growing.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#DCE8E8] leading-relaxed max-w-lg">
              Track your hens, daily eggs and upcoming collections. Every active plan produces fresh
              eggs credited directly to your balance.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/plans"
                style={{
                  background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                  boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.35)",
                }}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-black text-white hover:brightness-105 active:translate-y-0.5 transition"
              >
                <ShoppingCart size={15} /> Buy More Hens
              </Link>
              <Link
                href="/dashboard/egg-ledger"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#FFD0A5] hover:bg-white/15 transition"
              >
                <Egg size={15} /> View Egg Ledger
              </Link>
            </div>
          </div>

          {/* Right: Large 3D Hen Artwork with Ambient Glow */}
          <div className="relative size-32 sm:size-44 shrink-0 self-center md:self-auto drop-shadow-2xl">
            <div className="absolute inset-0 rounded-full bg-[#D8793F]/20 blur-xl scale-90" />
            <Image
              src="/dashboard/qa_my_hens.jpg"
              alt="My Active Flock"
              width={180}
              height={180}
              className="relative z-10 w-full h-full object-cover rounded-3xl border-2 border-[#D8793F]/40 transition-transform group-hover:scale-105 duration-300"
            />
          </div>
        </div>
      </section>

      {/* 3. Four Summary Cards (Active Plans, Total Hens, Daily Eggs, Ready to Collect) */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
        aria-label="Farm Overview Metrics"
      >
        {/* Card 1: Active Plans */}
        <div
          style={{
            boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-5 relative overflow-hidden group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-12 sm:size-14 rounded-2xl overflow-hidden shadow-md border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
              <Image
                src="/dashboard/qa_plans.jpg"
                alt="Active Plans"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#566D7E]">Active Plans</p>
              <p className="text-2xl sm:text-3xl font-black text-[#17372F] leading-tight">
                {activePlansCount}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">In production</p>
            </div>
          </div>
        </div>

        {/* Card 2: Total Hens */}
        <div
          style={{
            boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-5 relative overflow-hidden group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-12 sm:size-14 rounded-2xl overflow-hidden shadow-md border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
              <Image
                src="/dashboard/brown-hen-3d.jpg"
                alt="Total Hens"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#566D7E]">Total Hens</p>
              <p className="text-2xl sm:text-3xl font-black text-[#17372F] leading-tight">
                {totalActiveHens}
              </p>
              <p className="text-[11px] font-semibold text-[#D8793F]">Active flock</p>
            </div>
          </div>
        </div>

        {/* Card 3: Daily Eggs */}
        <div
          style={{
            boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-5 relative overflow-hidden group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-12 sm:size-14 rounded-2xl overflow-hidden shadow-md border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
              <Image
                src="/dashboard/golden-egg-3d.jpg"
                alt="Daily Eggs"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#566D7E]">Daily Eggs</p>
              <p className="text-2xl sm:text-3xl font-black text-[#D8793F] leading-tight">
                {estimatedDailyEggs}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700">Yield per day</p>
            </div>
          </div>
        </div>

        {/* Card 4: Ready to Collect */}
        <div
          style={{
            boxShadow: "0 8px 24px rgba(16, 34, 45, 0.07), 0 3px 0 rgba(216, 121, 63, 0.22)",
          }}
          className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-5 relative overflow-hidden group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-12 sm:size-14 rounded-2xl overflow-hidden shadow-md border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
              <Image
                src="/dashboard/harvest_nest_egg.jpg"
                alt="Ready to Collect"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[#566D7E]">Ready to Collect</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800 leading-tight">
                {eggBalance}
              </p>
              <p className="text-[11px] font-semibold text-[#566D7E]">In balance</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Running Flocks Section */}
      <section aria-label="Running Flocks" className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
              ACTIVE PRODUCTION
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#17372F]">Your running flocks</h3>
          </div>
          <Link
            href="/dashboard/plans"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#D8793F] hover:text-[#8C3A14] transition"
          >
            <Plus size={15} /> Add more hens
          </Link>
        </div>

        {hens.length === 0 ? (
          /* Empty State Card */
          <div
            style={{
              boxShadow: "0 12px 28px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.18)",
            }}
            className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-8 sm:p-12 text-center flex flex-col items-center justify-center"
          >
            <div className="size-24 sm:size-28 rounded-3xl overflow-hidden shadow-lg border-2 border-[#D8793F]/30 bg-[#061A2B] mb-4">
              <Image
                src="/dashboard/brown-hen-3d.jpg"
                alt="No Active Hen Plan"
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-[#17372F]">No active hen plan</h4>
            <p className="mt-1.5 text-xs sm:text-sm text-[#566D7E] max-w-md">
              Buy your first hen plan to start collecting daily eggs and watching your farm grow.
            </p>
            <Link
              href="/dashboard/plans"
              style={{
                background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.3)",
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:translate-y-0.5 transition"
            >
              <ShoppingCart size={15} /> Choose a Plan
            </Link>
          </div>
        ) : (
          /* Populated Running Flock Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hens.map((hen) => {
              const produced = hen.totalEggUnitsProduced;
              const max = hen.totalMaximumEggUnits;
              const percent = max > 0 ? Math.min(100, Math.round((produced / max) * 100)) : 0;
              const isActive = hen.status === "ACTIVE";

              return (
                <div
                  key={hen.id}
                  style={{
                    boxShadow:
                      "0 12px 28px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.2)",
                  }}
                  className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-6 flex flex-col justify-between group transition-transform hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 sm:size-14 rounded-2xl overflow-hidden shadow-sm border border-[#D8793F]/30 bg-[#061A2B] shrink-0">
                          <Image
                            src="/dashboard/brown-hen-3d.jpg"
                            alt="Flock"
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                            Order #{hen.purchaseOrder.orderReference}
                          </p>
                          <h4 className="text-lg font-black text-[#17372F] mt-0.5">
                            {hen.quantity} {hen.quantity === 1 ? "Hen Flock" : "Hens Flock"}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isActive
                            ? "bg-emerald-50 border border-emerald-600/30 text-emerald-800"
                            : "bg-amber-50 border border-amber-600/30 text-amber-800"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                        />
                        {hen.status}
                      </span>
                    </div>

                    {/* Production Progress & Stats */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#566D7E]">Harvest Progress</span>
                        <span className="text-[#D8793F]">
                          {produced} / {max} Eggs ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#E5D5B5] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-gradient-to-r from-[#F59B52] to-[#D8793F] rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#566D7E]">
                      <div>
                        <span className="font-semibold block text-[10px] uppercase text-[#8C3A14]">
                          Start Date
                        </span>
                        <span className="font-bold text-[#17372F]">
                          {formatDateTime(hen.productionStartDate)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[10px] uppercase text-[#8C3A14]">
                          End Date
                        </span>
                        <span className="font-bold text-[#17372F]">
                          {formatDateTime(hen.productionEndDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#17372F]/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#566D7E] flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Daily egg yield active
                    </span>
                    <Link
                      href="/dashboard/egg-ledger"
                      className="text-xs font-black text-[#D8793F] hover:text-[#8C3A14] transition"
                    >
                      View Ledger →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Collection Schedule (3 Simple Steps) */}
      <section
        style={{
          boxShadow: "0 12px 28px rgba(16, 34, 45, 0.08), 0 3px 0 rgba(216, 121, 63, 0.18)",
        }}
        className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-5 sm:p-7"
        aria-label="Collection Schedule"
      >
        <div className="mb-5">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
            HOW IT WORKS
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#17372F] mt-0.5">
            How daily collection works
          </h3>
          <p className="text-xs sm:text-sm text-[#566D7E] mt-0.5">
            Three simple steps to grow and collect your egg harvest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20 relative overflow-hidden flex items-start gap-3.5">
            <span className="size-9 rounded-xl bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white font-black text-sm grid place-items-center shrink-0 shadow-sm">
              1
            </span>
            <div>
              <h4 className="text-sm font-black text-[#17372F]">Plan starts</h4>
              <p className="text-xs text-[#566D7E] mt-1 leading-relaxed">
                Your hens are activated as soon as your purchase order is approved.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20 relative overflow-hidden flex items-start gap-3.5">
            <span className="size-9 rounded-xl bg-gradient-to-br from-[#F59B52] to-[#D8793F] text-white font-black text-sm grid place-items-center shrink-0 shadow-sm">
              2
            </span>
            <div>
              <h4 className="text-sm font-black text-[#17372F]">Collection becomes available</h4>
              <p className="text-xs text-[#566D7E] mt-1 leading-relaxed">
                Hens produce eggs every 24 hours based on your active plan capacity.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#D8793F]/20 relative overflow-hidden flex items-start gap-3.5">
            <span className="size-9 rounded-xl bg-gradient-to-br from-[#2D9B78] to-[#1C7358] text-white font-black text-sm grid place-items-center shrink-0 shadow-sm">
              3
            </span>
            <div>
              <h4 className="text-sm font-black text-[#17372F]">Eggs reach your balance</h4>
              <p className="text-xs text-[#566D7E] mt-1 leading-relaxed">
                Eggs appear in your available balance, ready to sell for cash payouts anytime.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

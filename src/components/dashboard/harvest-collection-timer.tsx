"use client";

import { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Clock,
  Egg,
  Info,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Sprout,
} from "lucide-react";

import { HarvestCountdownClock } from "./harvest-countdown-clock";
import { HarvestProgressBar } from "./harvest-progress-bar";

export interface HarvestCollectionTimerProps {
  activeHens: number;
  eggBalance: number;
  cycleStartIso?: string;
  cycleEndIso?: string;
  serverNowIso?: string;
  hasError?: boolean;
  onRetry?: () => void;
}

function getDefaultPktBounds() {
  const now = new Date();
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const pktMs = now.getTime() + PKT_OFFSET_MS;
  const pktDate = new Date(pktMs);

  const startPkt = new Date(
    Date.UTC(pktDate.getUTCFullYear(), pktDate.getUTCMonth(), pktDate.getUTCDate(), 0, 0, 0)
  );
  const endPkt = new Date(
    Date.UTC(pktDate.getUTCFullYear(), pktDate.getUTCMonth(), pktDate.getUTCDate() + 1, 0, 0, 0)
  );

  const startUtc = new Date(startPkt.getTime() - PKT_OFFSET_MS);
  const endUtc = new Date(endPkt.getTime() - PKT_OFFSET_MS);

  return {
    startIso: startUtc.toISOString(),
    endIso: endUtc.toISOString(),
  };
}

export function HarvestCollectionTimer({
  activeHens,
  eggBalance,
  cycleStartIso,
  cycleEndIso,
  hasError = false,
  onRetry,
}: HarvestCollectionTimerProps) {
  const headingId = useId();
  const defaults = getDefaultPktBounds();
  const startIso = cycleStartIso || defaults.startIso;
  const endIso = cycleEndIso || defaults.endIso;

  const hasActiveHens = activeHens > 0;
  const hasSellableEggs = eggBalance > 0;

  // --- Inline Error State ---
  if (hasError) {
    return (
      <section
        style={{
          boxShadow: "0 12px 32px rgba(16, 34, 45, 0.07), 0 2px 0 rgba(216, 121, 63, 0.18)",
        }}
        className="rounded-[24px] bg-[#FFFDF4] border border-rose-300 p-6 text-center"
        aria-label="Harvest Status Error"
      >
        <div className="max-w-md mx-auto space-y-3">
          <span className="inline-flex size-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 items-center justify-center">
            <Info size={24} />
          </span>
          <h3 className="text-lg font-black text-[#17372F]">Unable to load harvest cycle</h3>
          <p className="text-xs sm:text-sm text-[#566D7E]">
            We could not synchronize with the live harvest ledger. Please refresh or try again.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D8793F] text-white text-xs font-black uppercase tracking-wider hover:brightness-105 active:scale-95 transition"
            >
              <RefreshCw size={14} /> Retry Sync
            </button>
          )}
        </div>
      </section>
    );
  }

  // --- Reusable Sub-parts for Clean Desktop / Mobile Split ---

  // Sub-part 1: Status badges and heading
  const StatusBadgesAndHeading = (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D8793F]/15 text-[#8C3A14] border border-[#D8793F]/25">
          <Sparkles size={11} className="text-[#D8793F]" />
          <span>DAILY EGG HARVEST</span>
        </span>

        {hasActiveHens ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
            <span className="relative flex size-2">
              <span className="harvest-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
            </span>
            <span>HARVEST ACTIVE</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-900 border border-amber-500/30">
            <Clock size={10} />
            <span>NO ACTIVE HARVEST</span>
          </span>
        )}
      </div>

      <h2
        id={headingId}
        className="text-xl sm:text-2xl font-black text-[#17372F] tracking-tight leading-snug mt-1"
      >
        {hasActiveHens ? "Your Daily Harvest Is Growing" : "Start Your First Harvest"}
      </h2>
    </div>
  );

  // Sub-part 2: Supporting description
  const SupportingDescription = (
    <p className="text-xs sm:text-[13px] text-[#566D7E] leading-relaxed">
      {hasActiveHens ? (
        <>
          <strong className="text-[#17372F] font-black">{activeHens}</strong>{" "}
          {activeHens === 1 ? "active hen is" : "active hens are"} producing your next verified egg
          batch.
        </>
      ) : (
        "Buy your first hen plan to begin daily egg production and start collecting profits."
      )}
    </p>
  );

  // Sub-part 3: Egg visual display frame
  const EggVisual = (
    <div className="w-full max-w-[220px] rounded-2xl bg-[#071E28] border border-[#D8793F]/30 p-3 sm:p-3.5 flex flex-col items-center justify-between shadow-sm">
      {/* Top row: Status Badge only (No duplicate quantity) */}
      <div className="w-full flex items-center justify-end">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>Active Yield</span>
        </span>
      </div>

      {/* Golden Egg Image (Seamless navy blend with zero square boundary) */}
      <div className="relative size-32 sm:size-36 flex items-center justify-center my-1">
        <Image
          src="/dashboard/daily-harvest-egg-navy.webp"
          alt="GrowMeta Golden Egg"
          width={150}
          height={150}
          className="object-contain w-full h-full drop-shadow-sm"
          priority
        />
      </div>

      {/* Bottom text: Available Egg Balance */}
      <div className="w-full text-center pt-2 border-t border-white/10">
        <p className="text-[9.5px] font-black uppercase tracking-wider text-[#A7C2BD]">
          Available Egg Balance
        </p>
        <p className="text-lg sm:text-xl font-black text-[#F7FBF8] leading-tight mt-0.5">
          {eggBalance.toLocaleString()} Eggs
        </p>
      </div>
    </div>
  );

  // Sub-part 4: 3 Compact metric chips
  const MetricChips = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
      {/* Chip 1: Active Hens */}
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/25 text-xs font-black text-[#17372F] shadow-2xs">
        <span className="grid size-5.5 place-items-center rounded-lg bg-[#D8793F]/20 text-[#8C3A14] shrink-0">
          <Sprout size={13} />
        </span>
        <span className="truncate">{activeHens} Active {activeHens === 1 ? "Hen" : "Hens"}</span>
      </div>

      {/* Chip 2: Daily Rate */}
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/25 text-xs font-black text-[#17372F] shadow-2xs">
        <span className="grid size-5.5 place-items-center rounded-lg bg-emerald-500/20 text-emerald-800 shrink-0">
          <Sparkles size={13} />
        </span>
        <span className="truncate">1 Egg Per Hen / Day</span>
      </div>

      {/* Chip 3: Eggs Available */}
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF8EC] border border-[#D8793F]/25 text-xs font-black text-[#17372F] shadow-2xs">
        <span className="grid size-5.5 place-items-center rounded-lg bg-[#D8793F]/20 text-[#8C3A14] shrink-0">
          <Egg size={13} />
        </span>
        <span className="truncate">{eggBalance.toLocaleString()} Eggs Available</span>
      </div>
    </div>
  );

  // Sub-part 5: Action buttons
  const ActionButtons = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
      {hasActiveHens ? (
        <>
          {/* Primary Button: Sell Available Eggs */}
          {hasSellableEggs ? (
            <Link
              href="/dashboard/sell-eggs"
              style={{
                background: "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 6px 18px rgba(216, 121, 63, 0.3), 0 2px 0 #8C3A14",
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:scale-[0.98] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8793F] min-h-[44px]"
              title={`Sell ${eggBalance.toLocaleString()} available eggs`}
            >
              <Banknote size={16} className="shrink-0" />
              <span>Sell Available Eggs</span>
              <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              style={{
                background: "#E2D9C8",
                boxShadow: "0 2px 0 #B8AC96",
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#7E7465] cursor-not-allowed opacity-75 min-h-[44px]"
              title="Your next batch is still in production."
            >
              <Banknote size={16} className="shrink-0" />
              <span>Sell Available Eggs (0)</span>
            </button>
          )}

          {/* Secondary Button: View My Hens */}
          <Link
            href="/dashboard/hens"
            className="group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-[#071E28] hover:bg-[#0A2B3A] border border-[#24D6B0]/30 active:scale-[0.98] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24D6B0] min-h-[44px]"
            title="View your running hen flocks"
          >
            <Sprout size={16} className="shrink-0 text-[#24D6B0]" />
            <span>View My Hens</span>
            <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-1 text-[#24D6B0]" />
          </Link>
        </>
      ) : (
        <Link
          href="/dashboard/plans"
          style={{
            background: "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)",
            boxShadow: "0 6px 18px rgba(216, 121, 63, 0.3), 0 2px 0 #8C3A14",
          }}
          className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white hover:brightness-105 active:scale-[0.98] transition min-h-[44px]"
        >
          <ShoppingCart size={16} className="shrink-0" />
          <span>Buy a Hen (PKR 500)</span>
          <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );

  return (
    <section
      aria-labelledby={headingId}
      style={{
        boxShadow: "0 12px 32px rgba(16, 34, 45, 0.07), 0 2px 0 rgba(216, 121, 63, 0.18)",
      }}
      className="relative rounded-[24px] border border-[#D8793F]/25 bg-[#FFFDF4] p-4 sm:p-6 lg:p-7 box-border min-w-0"
    >
      {/* =====================================================================
          DESKTOP & TABLET LAYOUT (>= 768px)
          Grid: 220px minmax(0, 1fr) 300px on desktop (lg), 2-col on tablet (md)
          ===================================================================== */}
      <div className="hidden md:grid md:grid-cols-[200px_1fr] lg:grid-cols-[220px_minmax(0,1fr)_300px] gap-6 lg:gap-7 xl:gap-8 items-start">
        {/* Left Column (220px): Egg Visual */}
        <div className="w-[200px] lg:w-[220px] shrink-0">
          {EggVisual}
        </div>

        {/* Center Column: Harvest Info, Metrics, Progress, and Action Buttons */}
        <div className="flex flex-col justify-between space-y-3.5 min-w-0">
          {StatusBadgesAndHeading}
          {SupportingDescription}
          {MetricChips}
          <div className="pt-0.5">
            <HarvestProgressBar
              startIso={startIso}
              endIso={endIso}
              hasActiveHens={hasActiveHens}
            />
          </div>
          {ActionButtons}
        </div>

        {/* Right Column (300px): Production Clock (on tablet, wraps below; on desktop, stays right) */}
        <div className="col-span-2 lg:col-span-1 w-full lg:w-[300px] shrink-0 mt-2 lg:mt-0">
          <HarvestCountdownClock
            targetIso={endIso}
            hasActiveHens={hasActiveHens}
          />
        </div>
      </div>

      {/* =====================================================================
          MOBILE LAYOUT (< 768px)
          Strict 8-step vertical order requested:
          1. Status badges and heading
          2. Supporting description
          3. Egg visual
          4. Metric chips in a two-column or scroll-free grid
          5. Production progress
          6. Countdown timer
          7. Sell Available Eggs button
          8. View My Hens button
          ===================================================================== */}
      <div className="flex flex-col space-y-4 md:hidden">
        {/* 1. Status badges and heading */}
        <div>{StatusBadgesAndHeading}</div>

        {/* 2. Supporting description */}
        <div>{SupportingDescription}</div>

        {/* 3. Egg visual */}
        <div className="flex justify-center py-1">
          {EggVisual}
        </div>

        {/* 4. Metric chips */}
        <div>{MetricChips}</div>

        {/* 5. Production progress */}
        <div>
          <HarvestProgressBar
            startIso={startIso}
            endIso={endIso}
            hasActiveHens={hasActiveHens}
          />
        </div>

        {/* 6. Countdown timer */}
        <div>
          <HarvestCountdownClock
            targetIso={endIso}
            hasActiveHens={hasActiveHens}
          />
        </div>

        {/* 7 & 8. Action Buttons (Full width on mobile) */}
        <div className="space-y-2 pt-1">
          {hasActiveHens ? (
            <>
              {hasSellableEggs ? (
                <Link
                  href="/dashboard/sell-eggs"
                  style={{
                    background: "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)",
                    boxShadow: "0 6px 18px rgba(216, 121, 63, 0.3), 0 2px 0 #8C3A14",
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white active:scale-[0.98] transition min-h-[44px]"
                >
                  <Banknote size={16} />
                  <span>Sell Available Eggs</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    background: "#E2D9C8",
                    boxShadow: "0 2px 0 #B8AC96",
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-[#7E7465] cursor-not-allowed opacity-75 min-h-[44px]"
                >
                  <Banknote size={16} />
                  <span>Sell Available Eggs (0)</span>
                </button>
              )}

              <Link
                href="/dashboard/hens"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#071E28] border border-[#24D6B0]/30 active:scale-[0.98] transition min-h-[44px]"
              >
                <Sprout size={16} className="text-[#24D6B0]" />
                <span>View My Hens</span>
                <ArrowRight size={14} className="text-[#24D6B0]" />
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard/plans"
              style={{
                background: "linear-gradient(135deg, #F59B52 0%, #D8793F 100%)",
                boxShadow: "0 6px 18px rgba(216, 121, 63, 0.3), 0 2px 0 #8C3A14",
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white active:scale-[0.98] transition min-h-[44px]"
            >
              <ShoppingCart size={16} />
              <span>Buy a Hen (PKR 500)</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

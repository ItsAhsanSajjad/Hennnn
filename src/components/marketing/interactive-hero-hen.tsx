"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ShieldCheck, Sprout, Egg, RefreshCw, CheckCircle2, Radio, Activity } from "lucide-react";

const EGG_RATE_PKR = 18;

export function InteractiveHeroHen() {
  const [eggCount, setEggCount] = useState<number>(14820);
  const [isHarvesting, setIsHarvesting] = useState<boolean>(false);
  const [recentHarvest, setRecentHarvest] = useState<boolean>(false);
  const [cycleProgress, setCycleProgress] = useState<number>(0);
  const [counterFlash, setCounterFlash] = useState<boolean>(false);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger professional harvest sequence
  const harvestEgg = useCallback(() => {
    if (isHarvesting) return;
    setIsHarvesting(true);

    // 1. Telemetry scan and yield credit
    setTimeout(() => {
      setEggCount((prev) => prev + 1);
      setRecentHarvest(true);
      setCounterFlash(true);
      setCycleProgress(0);

      setTimeout(() => {
        setCounterFlash(false);
      }, 600);

      setTimeout(() => {
        setIsHarvesting(false);
      }, 900);

      setTimeout(() => {
        setRecentHarvest(false);
      }, 3500);
    }, 450);
  }, [isHarvesting]);

  // Automated 8-second production cycle
  useEffect(() => {
    const cycleDuration = 8000;
    const intervalTime = 100;
    const step = (intervalTime / cycleDuration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setCycleProgress((prev) => {
        if (prev >= 100) {
          harvestEgg();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [harvestEgg]);

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Ambient Backdrop Glow - Soft & Cinematic */}
      <div className="pointer-events-none absolute -left-8 -top-8 size-56 rounded-full bg-[#10B981]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -right-8 size-60 rounded-full bg-[#F59B52]/12 blur-3xl" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative overflow-hidden rounded-2xl border border-[#10B981]/25 bg-gradient-to-b from-[#09262B]/95 via-[#061A1E]/98 to-[#031013] p-3.5 shadow-[0_24px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)] sm:rounded-[2rem] sm:p-5">
        
        {/* 1. Header Bar: Telemetry Status & Action Pill */}
        <div className="mb-3.5 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[#10B981]" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight text-white">Smart Coop #04</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#A7F3D0]">
                <Radio size={10} className="text-[#10B981]" /> Live Stream
              </span>
            </div>
          </div>

          {/* Interactive Trigger Button */}
          <button
            type="button"
            onClick={harvestEgg}
            disabled={isHarvesting}
            style={{
              background: isHarvesting
                ? "linear-gradient(180deg, #134E4A 0%, #062326 100%)"
                : "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
              boxShadow: isHarvesting
                ? "none"
                : "0 2px 0 #8C3A14, 0 6px 16px rgba(216, 121, 63, 0.35)",
            }}
            className="group relative flex items-center gap-1.5 overflow-hidden rounded-xl border border-white/20 px-3.5 py-1.5 text-xs font-black text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-80 cursor-pointer min-h-[34px]"
            title="Click to harvest current egg"
          >
            {isHarvesting ? (
              <>
                <RefreshCw size={12} className="animate-spin text-[#A7F3D0]" />
                <span className="text-[#A7F3D0]">Logging...</span>
              </>
            ) : (
              <>
                <Egg size={13} className="text-yellow-100" />
                <span>Harvest Egg</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Visual Stage Frame (High-Resolution Hen Viewport) */}
        <div
          role="button"
          tabIndex={0}
          onClick={harvestEgg}
          onKeyDown={(e) => e.key === "Enter" && harvestEgg()}
          className="group/stage relative aspect-[16/11] w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#041619] shadow-inner sm:rounded-2xl"
        >
          {/* Hen Photo with Subtle Lifelike Breathing */}
          <div
            className={`relative size-full transition-transform duration-700 ${
              isHarvesting ? "scale-[0.99] translate-y-0.5" : "hover:scale-[1.01]"
            }`}
            style={{
              animation: "hen-subtle-breath 5s ease-in-out infinite",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/hero-hen.jpg"
              alt="GrowMeta Verified Farm Hen"
              className="size-full object-cover object-center brightness-[1.03] contrast-[1.03]"
            />
            {/* Cinematic Gradient Vignettes */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#041619]/90 via-transparent to-[#041619]/30" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.12),transparent_70%)]" />
          </div>

          {/* Luxury Ambient Shimmer on Harvest */}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
              isHarvesting
                ? "bg-gradient-to-t from-[#10B981]/20 via-[#F5C451]/10 to-transparent opacity-100"
                : "opacity-0"
            }`}
          />

          {/* Sleek Sweep Scan Light on Harvest */}
          {isHarvesting && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#10B981]/30 to-transparent"
              style={{
                animation: "telemetry-scan 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            />
          )}

          {/* Top HUD Telemetry Pill */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur-md">
            <Activity size={11} className="text-[#10B981]" />
            <span>Vitality 99.8% • Pasture Range</span>
          </div>

          {/* Professional Event Toast Notification */}
          <div
            className={`pointer-events-none absolute inset-x-3 top-3 z-30 flex justify-end transition-all duration-300 ${
              recentHarvest
                ? "translate-y-0 opacity-100 scale-100"
                : "-translate-y-2 opacity-0 scale-95"
            }`}
          >
            <div className="flex items-center gap-2 rounded-xl border border-[#10B981]/50 bg-[#062520]/95 px-3 py-1.5 text-xs font-black text-[#A7F3D0] shadow-[0_8px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <CheckCircle2 size={13} className="text-[#10B981]" />
              <span>+1 Egg Logged • PKR {EGG_RATE_PKR}.00</span>
            </div>
          </div>

          {/* Tap Prompt Hint */}
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-20 flex justify-center opacity-0 transition-opacity duration-300 group-hover/stage:opacity-100">
            <span className="rounded-full border border-white/20 bg-black/75 px-3 py-1 text-[10px] font-bold text-[#A7F3D0] backdrop-blur-md shadow-lg">
              Click coop to harvest egg
            </span>
          </div>
        </div>

        {/* 3. Bottom Telemetry Grid & Production Bar */}
        <div className="mt-3.5 rounded-xl border border-white/10 bg-[#06181B]/90 p-3 shadow-inner sm:rounded-2xl sm:p-3.5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Total Eggs */}
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-[#10B981]/15 text-[#10B981] sm:size-9">
                <Egg size={16} />
              </span>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#A9C2BC]">Total Yield</span>
                <span
                  className={`text-sm font-black tracking-tight text-white sm:text-base transition-colors duration-300 ${
                    counterFlash ? "text-[#10B981]" : "text-white"
                  }`}
                >
                  {eggCount.toLocaleString()} <span className="text-[11px] font-bold text-[#10B981]">Eggs</span>
                </span>
              </div>
            </div>

            {/* Total Market Value (PKR 18 / egg baseline) */}
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-[#F59B52]/15 text-[#F59B52] sm:size-9">
                <Activity size={16} />
              </span>
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#A9C2BC]">Market Value</span>
                <span
                  className={`text-sm font-black tracking-tight sm:text-base transition-colors duration-300 ${
                    counterFlash ? "text-[#F5C451]" : "text-[#F5C451]"
                  }`}
                >
                  PKR {(eggCount * EGG_RATE_PKR).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Next Production Cycle */}
            <div className="col-span-2 flex items-center justify-between border-t border-white/5 pt-2 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
              <div>
                <span className="block text-[10px] uppercase font-bold text-[#A9C2BC]">Next Production</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#A7F3D0] sm:justify-end">
                  <RefreshCw size={11} className="animate-spin text-[#10B981]" />
                  <span>{Math.max(1, Math.round((100 - cycleProgress) / 12.5))}s remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Production Cycle Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/50 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#F59B52] transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${cycleProgress}%` }}
            />
          </div>
        </div>

        {/* 4. Sleek Trust Strip */}
        <div className="mt-3 flex items-center justify-between gap-2 px-1 text-[11px] text-[#A9C2BC]">
          <div className="flex items-center gap-1.5">
            <Sprout size={13} className="text-[#10B981]" />
            <span className="font-semibold">Veterinary Certified</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#F5C451]" />
            <span className="font-semibold">Audited Smart Ledger</span>
          </div>
        </div>
      </div>

      {/* Subtle Lifelike Breath & Telemetry Keyframes */}
      <style jsx global>{`
        @keyframes hen-subtle-breath {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-2px) scale(1.004);
          }
        }

        @keyframes telemetry-scan {
          0% {
            opacity: 0;
            transform: scaleY(0.4);
          }
          50% {
            opacity: 1;
            transform: scaleY(1);
          }
          100% {
            opacity: 0;
            transform: scaleY(1.4);
          }
        }
      `}</style>
    </div>
  );
}

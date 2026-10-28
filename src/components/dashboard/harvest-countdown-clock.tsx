"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

interface HarvestCountdownClockProps {
  targetIso: string;
  hasActiveHens: boolean;
  onExpire?: () => void;
}

interface TimeParts {
  hours: string;
  minutes: string;
  seconds: string;
  totalSeconds: number;
}

function calculateTimeParts(targetMs: number): TimeParts {
  const now = Date.now();
  const diffMs = Math.max(0, targetMs - now);
  const totalSeconds = Math.floor(diffMs / 1000);

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return { hours, minutes, seconds, totalSeconds };
}

export function HarvestCountdownClock({
  targetIso,
  hasActiveHens,
  onExpire,
}: HarvestCountdownClockProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const targetMs = useRef(new Date(targetIso).getTime());
  const hasTriggeredExpire = useRef(false);

  useEffect(() => {
    targetMs.current = new Date(targetIso).getTime();
    hasTriggeredExpire.current = false;
  }, [targetIso]);

  const [mounted, setMounted] = useState(false);
  const [timeParts, setTimeParts] = useState<TimeParts>(() => calculateTimeParts(targetMs.current));

  useEffect(() => {
    setMounted(true);
    setTimeParts(calculateTimeParts(targetMs.current));

    const interval = setInterval(() => {
      const parts = calculateTimeParts(targetMs.current);
      setTimeParts(parts);

      if (parts.totalSeconds <= 0 && !hasTriggeredExpire.current) {
        hasTriggeredExpire.current = true;
        if (onExpire) {
          onExpire();
        } else {
          startTransition(() => {
            router.refresh();
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [router, onExpire]);

  if (!hasActiveHens) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#071E28] border border-[#24D6B0]/20 text-center"
        aria-label="No active production cycle"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#FFD0A5]">
            NO ACTIVE HARVEST
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 my-1 font-mono text-2xl font-black text-[#566D7E] tabular-nums select-none">
          <div className="w-[60px] sm:w-[64px] h-[54px] rounded-xl bg-[#04131A] border border-white/5 flex items-center justify-center">
            --
          </div>
          <span className="text-white/30 font-sans text-xl">:</span>
          <div className="w-[60px] sm:w-[64px] h-[54px] rounded-xl bg-[#04131A] border border-white/5 flex items-center justify-center">
            --
          </div>
          <span className="text-white/30 font-sans text-xl">:</span>
          <div className="w-[60px] sm:w-[64px] h-[54px] rounded-xl bg-[#04131A] border border-white/5 flex items-center justify-center">
            --
          </div>
        </div>
        <p className="text-[11px] text-[#A7C2BD] mt-2 font-medium">
          Buy a hen to start daily production.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#071E28] border border-[#24D6B0]/25 shadow-sm"
      role="timer"
      aria-label={`Next harvest batch ready in ${timeParts.hours} hours, ${timeParts.minutes} minutes, and ${timeParts.seconds} seconds`}
    >
      {/* Top Header: NEXT HARVEST + Live Dot */}
      <div className="flex items-center justify-between w-full mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="harvest-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#8CF2D2]">
            NEXT HARVEST
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#A7C2BD]/80 uppercase tracking-wider">
          Pakistan Standard Time
        </span>
      </div>

      {/* 3 Timer Cells: HR : MIN : SEC (approx 60-64px wide each) */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-1.5 w-full">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="w-[60px] sm:w-[64px] h-[56px] sm:h-[60px] rounded-xl bg-[#04131A] border border-[#24D6B0]/25 shadow-inner flex items-center justify-center">
            <span className="font-mono text-2xl sm:text-[28px] font-black text-[#F7FBF8] tabular-nums tracking-tight">
              {mounted ? timeParts.hours : "23"}
            </span>
          </div>
          <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#A7C2BD] mt-1">
            HR
          </span>
        </div>

        <span className="text-[#8CF2D2]/50 font-sans text-xl font-bold -mt-4">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="w-[60px] sm:w-[64px] h-[56px] sm:h-[60px] rounded-xl bg-[#04131A] border border-[#24D6B0]/25 shadow-inner flex items-center justify-center">
            <span className="font-mono text-2xl sm:text-[28px] font-black text-[#F7FBF8] tabular-nums tracking-tight">
              {mounted ? timeParts.minutes : "59"}
            </span>
          </div>
          <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#A7C2BD] mt-1">
            MIN
          </span>
        </div>

        <span className="text-[#8CF2D2]/50 font-sans text-xl font-bold -mt-4">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="w-[60px] sm:w-[64px] h-[56px] sm:h-[60px] rounded-xl bg-[#04131A] border border-[#24D6B0]/35 shadow-inner flex items-center justify-center ring-1 ring-[#24D6B0]/15">
            <span className="font-mono text-2xl sm:text-[28px] font-black text-[#24D6B0] tabular-nums tracking-tight">
              {mounted ? timeParts.seconds : "59"}
            </span>
          </div>
          <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#24D6B0] mt-1">
            SEC
          </span>
        </div>
      </div>

      {/* Bottom Subtitle / Helper Text */}
      <p className="text-[11px] text-[#A7C2BD] text-center mt-2 font-medium">
        Your next egg batch is being prepared.
      </p>
    </div>
  );
}

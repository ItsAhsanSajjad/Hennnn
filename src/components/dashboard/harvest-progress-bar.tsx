"use client";

import { useEffect, useState, useMemo } from "react";

interface HarvestProgressBarProps {
  startIso: string;
  endIso: string;
  hasActiveHens: boolean;
}

export function HarvestProgressBar({
  startIso,
  endIso,
  hasActiveHens,
}: HarvestProgressBarProps) {
  const [mounted, setMounted] = useState(false);

  const startMs = useMemo(() => new Date(startIso).getTime(), [startIso]);
  const endMs = useMemo(() => new Date(endIso).getTime(), [endIso]);
  const totalDuration = Math.max(1, endMs - startMs);

  const calculateProgress = () => {
    if (!hasActiveHens) return { percent: 0, hoursRemaining: 0, minsRemaining: 0 };
    const now = Date.now();
    const elapsed = Math.max(0, Math.min(totalDuration, now - startMs));
    const percent = Math.min(100, Math.max(1, Math.round((elapsed / totalDuration) * 100)));
    const remainingMs = Math.max(0, endMs - now);
    const hoursRemaining = Math.floor(remainingMs / (1000 * 60 * 60));
    const minsRemaining = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return { percent, hoursRemaining, minsRemaining };
  };

  const [progressState, setProgressState] = useState(calculateProgress);

  useEffect(() => {
    setMounted(true);
    setProgressState(calculateProgress());

    const interval = setInterval(() => {
      setProgressState(calculateProgress());
    }, 30_000);

    return () => clearInterval(interval);
  }, [startMs, endMs, hasActiveHens]);

  const { percent, hoursRemaining, minsRemaining } = progressState;

  return (
    <div className="w-full space-y-1.5 pt-1">
      {/* Label and Percentage */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-extrabold text-[#17372F] flex items-center gap-2">
          <span>Current Production Cycle</span>
          {hasActiveHens && (
            <span className="px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#065F46] font-black text-[11px]">
              {mounted ? `${percent}%` : "Calculating..."}
            </span>
          )}
        </span>
        <span className="text-[11px] font-semibold text-[#566D7E]">
          {hasActiveHens && mounted
            ? `${hoursRemaining}h ${minsRemaining}m remaining`
            : "Cycle paused"}
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-2.5 w-full bg-[#E5DAC6] rounded-full overflow-hidden p-0.5 border border-[#D8793F]/20 relative shadow-inner">
        <div
          style={{ width: hasActiveHens && mounted ? `${percent}%` : "0%" }}
          className="h-full bg-gradient-to-r from-[#F59B52] via-[#10B981] to-[#059669] rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily egg harvest cycle progress"
        >
          {hasActiveHens && percent > 5 && (
            <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent progress-gleam-effect" />
          )}
        </div>
      </div>

      {/* Footer Details */}
      <div className="flex items-center justify-between text-[10.5px] font-bold text-[#8C3A14]">
        <span>Remaining: {hasActiveHens && mounted ? `${hoursRemaining}h ${minsRemaining}m` : "--"}</span>
        <span>Next batch at 12:00 AM PKT</span>
      </div>
    </div>
  );
}

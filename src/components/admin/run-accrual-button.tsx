"use client";

import { useState, useTransition } from "react";
import { Loader2, Play, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { triggerDailyEggAccrualAction } from "@/app/admin/egg-production/actions";

export function RunAccrualButton() {
  const [isPending, startTransition] = useTransition();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRun = () => {
    setResultMessage(null);
    startTransition(async () => {
      try {
        const res = await triggerDailyEggAccrualAction();
        if (res.datesRun.length > 0) {
          setResultMessage(
            `Successfully processed ${res.datesRun.length} date(s): ${res.creditedAssets} hen asset(s) credited with ${res.totalEggUnits} total egg units.`
          );
        } else {
          setResultMessage("All active hen assets are already up-to-date for today.");
        }
        router.refresh();
      } catch (err) {
        setResultMessage(err instanceof Error ? err.message : "Failed to run accrual.");
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        onClick={handleRun}
        disabled={isPending}
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Processing Accruals...</span>
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            <span>Run Daily Accrual Now</span>
          </>
        )}
      </button>

      {resultMessage && (
        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          {resultMessage}
        </span>
      )}
    </div>
  );
}

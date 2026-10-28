import Link from "next/link";
import { ArrowRight, ClipboardList, WalletCards } from "lucide-react";

import { InnerPageHeader } from "@/components/layout/inner-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";

export const dynamic = "force-dynamic";

function saleTone(status: string) {
  if (["PAYMENT_PROCESSING", "PAID"].includes(status)) return "success";
  if (["REJECTED", "CANCELLED"].includes(status)) return "danger";
  if (["AWAITING_REVIEW", "UNDER_REVIEW"].includes(status)) return "pending";
  return "neutral";
}

export default async function EggSalesPage() {
  const user = await requireUser();
  const sales = await prisma.eggSaleRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { payouts: true },
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Egg Sales History"
        subtitle="Review your submitted trade requests, payout accounts, and completed settlements."
        actionLabel="Sell Eggs"
        actionHref="/dashboard/sell-eggs"
        actionIcon="egg"
      />

      {/* 2. Sales Content Table */}
      <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#FFD0A5]/40 text-[#8C3A14]">
            <ClipboardList aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#17372F]">Submitted Trade Requests</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#566D7E]">
              Track the progress from review through payment processing and confirmation.
            </p>
          </div>
        </div>

        {sales.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[#D8793F]/20">
            <table className="min-w-full divide-y divide-[#D8793F]/15 text-xs sm:text-sm">
              <thead className="bg-[#FFF8EC] text-left text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                <tr>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Rate</th>
                  <th className="px-5 py-4">Total Amount</th>
                  <th className="px-5 py-4">Payment Method</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8793F]/15 bg-[#FFFDF4]">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#FFF8EC]/60 transition">
                    <td className="px-5 py-4 font-black text-[#17372F]">
                      <Link
                        className="font-mono text-xs hover:text-[#D8793F] transition underline"
                        href={`/dashboard/egg-sales/${sale.publicReference}`}
                      >
                        {sale.publicReference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-black text-[#17372F]">{sale.eggQuantity} eggs</td>
                    <td className="px-5 py-4 font-bold text-[#566D7E]">
                      {formatPaisa(sale.ratePaisaPerEggSnapshot)}
                    </td>
                    <td className="px-5 py-4 font-black tabular-nums text-[#17372F]">
                      {formatPaisa(sale.totalAmountPaisa)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#566D7E]">
                      {sale.payoutIdentifierMaskedSnapshot
                        ? `${sale.payoutProviderSnapshot ?? "Payout"} (${sale.payoutIdentifierMaskedSnapshot})`
                        : "Not recorded"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={saleTone(sale.status)}>
                        {sale.status.replaceAll("_", " ")}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#566D7E]">
                      {formatDateTime(sale.submittedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/egg-sales/${sale.publicReference}`}
                        className="inline-flex items-center gap-1 font-black text-[#D8793F] hover:text-[#8C3A14] transition"
                      >
                        View
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8793F]/30 bg-[#FFF8EC] p-10 text-center">
            <WalletCards className="mx-auto text-[#D8793F]/50" size={40} />
            <h3 className="mt-3 text-sm sm:text-base font-black text-[#17372F]">No Egg Sales Yet</h3>
            <p className="mt-1 text-xs text-[#566D7E] max-w-sm mx-auto">
              You haven’t submitted any egg-sale requests yet. Harvest eggs from your hens and sell them anytime.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/sell-eggs"
                style={{
                  background: "linear-gradient(180deg, #F59B52 0%, #D8793F 100%)",
                  boxShadow: "0 2px 0 #8C3A14, 0 4px 12px rgba(216, 121, 63, 0.3)",
                }}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black text-white hover:brightness-105 transition"
              >
                <WalletCards size={14} /> Sell Available Eggs
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

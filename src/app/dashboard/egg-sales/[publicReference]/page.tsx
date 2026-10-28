import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileCheck, ShieldAlert, Sparkles, XCircle } from "lucide-react";

import { CancelEggSaleForm } from "@/components/phase3/cancel-egg-sale-form";
import { EggSaleSubmissionSuccess } from "@/components/phase3/egg-sale-submission-success";
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

export default async function EggSaleDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicReference: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUser();
  const [{ publicReference }, query] = await Promise.all([params, searchParams]);
  const sale = await prisma.eggSaleRequest.findUnique({
    where: { publicReference },
    include: { payouts: { orderBy: { createdAt: "desc" } } },
  });
  if (!sale || sale.userId !== user.id) notFound();

  const paymentAccount = sale.payoutIdentifierMaskedSnapshot
    ? `${sale.payoutProviderSnapshot ?? "Payout"} (${sale.payoutIdentifierMaskedSnapshot})`
    : "Payment account not recorded";

  const timeline = [
    { label: "Request submitted", date: sale.submittedAt },
    { label: "Under review", date: sale.underReviewAt },
    { label: "Payment processing", date: sale.paymentProcessingAt },
    { label: "Paid & Settled", date: sale.paidAt },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Shared Inner Top Bar */}
      <InnerPageHeader
        title="Egg Sale Request"
        subtitle={`Reference: ${sale.publicReference}`}
        actionLabel="All Sales"
        actionHref="/dashboard/egg-sales"
        actionIcon="arrow"
      />

      {query.submitted === "1" ? (
        <div className="w-full">
          <EggSaleSubmissionSuccess
            publicReference={sale.publicReference}
            eggQuantity={sale.eggQuantity}
            totalAmountPaisa={sale.totalAmountPaisa}
            payoutAccount={paymentAccount}
            submittedAt={sale.submittedAt}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Details & Timeline */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 sm:p-8 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                  Trade Request Record
                </span>
                <h2 className="mt-1 break-words font-mono text-xl sm:text-2xl font-black text-[#17372F]">
                  {sale.publicReference}
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#566D7E]">
                  Submitted on {formatDateTime(sale.submittedAt)}
                </p>
              </div>
              <StatusBadge tone={saleTone(sale.status)}>
                {sale.status.replaceAll("_", " ")}
              </StatusBadge>
            </div>

            {/* Metric Tiles */}
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Egg Quantity", value: `${sale.eggQuantity.toLocaleString()} eggs` },
                { label: "Buyback Rate", value: `${formatPaisa(sale.ratePaisaPerEggSnapshot)} / egg` },
                { label: "Total Amount", value: formatPaisa(sale.totalAmountPaisa), highlight: true },
                { label: "Payout Destination", value: paymentAccount },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-4 ${
                    item.highlight
                      ? "border-[#D8793F] bg-[#FFF8EC]"
                      : "border-[#D8793F]/20 bg-[#FFF8EC]"
                  }`}
                >
                  <dt className="text-[11px] font-black uppercase tracking-wider text-[#8C3A14]">
                    {item.label}
                  </dt>
                  <dd className="mt-2 break-words text-base sm:text-lg font-black text-[#17372F]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Rejection / Note Banner */}
            {sale.userVisibleReason ? (
              <div className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-xs sm:text-sm font-semibold leading-relaxed text-rose-800">
                <div className="flex items-center gap-2 font-black text-rose-900">
                  <ShieldAlert size={16} /> Request Status Update
                </div>
                <p className="mt-1">{sale.userVisibleReason}</p>
                <p className="mt-2 text-rose-700">
                  Your reserved eggs have been returned to your available farm balance.
                </p>
              </div>
            ) : null}

            {/* Timeline */}
            <div className="mt-8 border-t border-[#D8793F]/20 pt-6">
              <div className="flex items-center gap-2">
                <Clock aria-hidden="true" className="text-[#D8793F]" size={18} />
                <h3 className="text-base sm:text-lg font-black text-[#17372F]">Status Timeline</h3>
              </div>
              <div className="mt-4 space-y-3">
                {timeline.map((step) => {
                  const isDone = !!step.date;
                  return (
                    <div
                      key={step.label}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#D8793F]/15 bg-[#FFF8EC] p-3 sm:p-4 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Clock size={16} className="text-[#566D7E]/50 shrink-0" />
                        )}
                        <span className={`font-bold ${isDone ? "text-[#17372F]" : "text-[#566D7E]/70"}`}>
                          {step.label}
                        </span>
                      </div>
                      <span className="text-right text-xs font-semibold text-[#566D7E]">
                        {step.date ? formatDateTime(step.date) : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Payment Status & Cancellation */}
        <aside className="space-y-6">
          <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-[#FFD0A5]/40 text-[#8C3A14]">
                <FileCheck aria-hidden="true" size={18} />
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#17372F]">Payment Settlement</h3>
            </div>

            {sale.payouts.length ? (
              <div className="mt-4 space-y-3">
                {sale.payouts.map((payout) => (
                  <div key={payout.id} className="rounded-2xl border border-[#D8793F]/20 bg-[#FFF8EC] p-4 text-xs sm:text-sm">
                    <p className="text-base font-black text-[#17372F]">{formatPaisa(payout.amountPaisa)}</p>
                    <p className="mt-1 font-bold text-[#8C3A14]">{payout.status.replaceAll("_", " ")}</p>
                    {payout.status === "CONFIRMED" ? (
                      <div className="mt-3 space-y-1 text-xs text-[#566D7E] border-t border-[#D8793F]/15 pt-2">
                        <p>Date: {formatDateTime(payout.confirmedAt)}</p>
                        <p className="break-all">Ref: {payout.settlementReference}</p>
                        <p>Channel: {payout.payoutProviderSnapshot}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-[#D8793F]/20 bg-[#FFF8EC] p-4 text-center">
                <p className="text-xs font-semibold leading-relaxed text-[#566D7E]">
                  Finance operations will send payout funds once the request is reviewed and confirmed.
                </p>
              </div>
            )}
          </section>

          {sale.status === "AWAITING_REVIEW" ? (
            <section className="rounded-3xl border border-[#D8793F]/25 bg-[#FFFDF4] p-6 shadow-[0_14px_32px_rgba(16,34,45,0.08)]">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-rose-100 text-rose-800">
                  <XCircle aria-hidden="true" size={18} />
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#17372F]">Cancel Request</h3>
              </div>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-[#566D7E]">
                You can cancel this request before operations begins processing. Your held eggs will immediately return to your balance.
              </p>
              <div className="mt-4">
                <CancelEggSaleForm publicReference={sale.publicReference} />
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

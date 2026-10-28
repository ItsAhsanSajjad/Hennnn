import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  ClipboardCheck,
  Clock,
  FileCheck,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ClaimEggSaleForm } from "@/components/phase3/claim-egg-sale-form";
import { EggSaleReviewForm } from "@/components/phase3/egg-sale-review-form";
import { SettlementRecordForm, SettlementStatusForms } from "@/components/phase3/settlement-forms";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import {
  ADMIN_PERMISSIONS,
  canRecordSettlements,
  canReviewEggSales,
} from "@/server/policies/authorization";
import { decryptPayoutIdentifier } from "@/server/services/payout-identifier-crypto";

export const dynamic = "force-dynamic";

function saleTone(status: string) {
  if (["PAYMENT_PROCESSING", "PAID"].includes(status)) return "success";
  if (["REJECTED", "CANCELLED"].includes(status)) return "danger";
  if (["AWAITING_REVIEW", "UNDER_REVIEW"].includes(status)) return "pending";
  return "neutral";
}

export default async function AdminEggSaleDetailsPage({
  params,
}: {
  params: Promise<{ publicReference: string }>;
}) {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_VIEW);
  const { publicReference } = await params;
  const sale = await prisma.eggSaleRequest.findUnique({
    where: { publicReference },
    include: {
      user: true,
      reviewedBy: true,
      payouts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!sale) notFound();

  const reservation = await prisma.eggLedgerEntry.findFirst({
    where: { sourceType: "EGG_SALE", sourceId: sale.id, entryType: "SALE_RESERVATION" },
    orderBy: { createdAt: "asc" },
  });
  const [
    activeHens,
    previousRequests,
    previousPaid,
    activeRequests,
    auditEvents,
    balanceBeforeRequest,
  ] = await Promise.all([
    prisma.henAsset.count({ where: { userId: sale.userId, status: "ACTIVE" } }),
    prisma.eggSaleRequest.count({
      where: { userId: sale.userId, createdAt: { lt: sale.createdAt } },
    }),
    prisma.eggSaleRequest.count({
      where: { userId: sale.userId, status: "PAID", createdAt: { lt: sale.createdAt } },
    }),
    prisma.eggSaleRequest.count({
      where: {
        userId: sale.userId,
        id: { not: sale.id },
        status: { in: ["AWAITING_REVIEW", "UNDER_REVIEW", "PAYMENT_PROCESSING"] },
      },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "EggSaleRequest", entityId: sale.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    reservation
      ? prisma.eggLedgerEntry.aggregate({
          where: { userId: sale.userId, createdAt: { lt: reservation.createdAt } },
          _sum: { eggUnits: true },
        })
      : Promise.resolve({ _sum: { eggUnits: null } }),
  ]);
  const canReview = canReviewEggSales(actor.role);
  const canSettle = canRecordSettlements(actor.role);
  const latestPayout = sale.payouts[0];
  const authorizedPaymentIdentifier = canSettle
    ? decryptPayoutIdentifier(sale.payoutIdentifierProtectedSnapshot)
    : null;
  const timeline = [
    ["Request submitted", sale.submittedAt],
    ["Review started", sale.underReviewAt],
    ["Payment processing started", sale.paymentProcessingAt],
    ["Transaction reference added", latestPayout?.recordedAt ?? null],
    ["Payment marked paid", sale.paidAt],
  ] as const;
  const accountSummary = sale.payoutIdentifierMaskedSnapshot
    ? `${sale.payoutProviderSnapshot ?? "Payout"} ${sale.payoutIdentifierMaskedSnapshot}`
    : "Snapshot not available";
  const riskIndicators = [
    sale.user.status !== "ACTIVE" ? "Customer account is not active" : null,
    activeRequests > 0
      ? `${activeRequests} other open egg-sale request${activeRequests === 1 ? "" : "s"}`
      : null,
    !sale.payoutIdentifierMaskedSnapshot ? "Payment snapshot missing" : null,
    canSettle && sale.payoutIdentifierProtectedSnapshot && !authorizedPaymentIdentifier
      ? "Payment identifier needs a secure customer update"
      : null,
    !reservation ? "Reservation ledger entry missing" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Banknote}
        eyebrow="Egg-sale operations"
        title={sale.publicReference}
        description="Review the reservation, approved rate snapshot, payout snapshot, and operational history before recording any external payment."
        actions={
          <Link
            href="/admin/egg-sales"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-mist bg-surface px-4 text-sm font-bold text-forest hover:bg-ivory"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Back to queue
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="pak-data-card rounded-lg p-5">
          <p className="text-sm font-semibold text-charcoal/65">Payable amount</p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-forest">
            {formatPaisa(sale.totalAmountPaisa)}
          </p>
          <p className="mt-2 text-xs text-charcoal/55">Trusted rate snapshot</p>
        </article>
        <article className="pak-data-card rounded-lg p-5">
          <p className="text-sm font-semibold text-charcoal/65">Egg quantity</p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-forest">
            {sale.eggQuantity}
          </p>
          <p className="mt-2 text-xs text-charcoal/55">
            {formatPaisa(sale.ratePaisaPerEggSnapshot)} per egg
          </p>
        </article>
        <article className="pak-data-card rounded-lg p-5">
          <p className="text-sm font-semibold text-charcoal/65">Request status</p>
          <div className="mt-4">
            <StatusBadge tone={saleTone(sale.status)}>
              {sale.status.replaceAll("_", " ")}
            </StatusBadge>
          </div>
          <p className="mt-3 text-xs text-charcoal/55">
            Submitted {formatDateTime(sale.submittedAt)}
          </p>
        </article>
        <article className="pak-data-card rounded-lg p-5">
          <p className="text-sm font-semibold text-charcoal/65">Reservation ledger</p>
          <p className="mt-3 break-all text-sm font-extrabold text-forest">
            {reservation?.id ?? "Missing"}
          </p>
          <p className="mt-2 text-xs text-charcoal/55">
            {reservation ? `${reservation.eggUnits} egg units held` : "Requires investigation"}
          </p>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid gap-6">
          <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserRound aria-hidden="true" className="text-leaf" size={21} />
              <div>
                <h2 className="font-extrabold text-forest">Customer review</h2>
                <p className="mt-1 text-xs text-charcoal/60">
                  Account facts relevant to this request.
                </p>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Full name", sale.user.name ?? "Not provided"],
                ["Username", sale.user.username],
                ["Email", sale.user.email ?? "Not provided"],
                ["Phone", sale.user.phoneE164 ?? "Not provided"],
                ["Account status", sale.user.status],
                ["Registered", formatDateTime(sale.user.createdAt)],
                ["Active hens", String(activeHens)],
                ["Available eggs before request", String(balanceBeforeRequest._sum.eggUnits ?? 0)],
                ["Previous sale requests", String(previousRequests)],
                ["Previous paid settlements", String(previousPaid)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-mist bg-ivory p-3">
                  <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-bold text-charcoal">{value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock aria-hidden="true" className="text-leaf" size={21} />
              <div>
                <h2 className="font-extrabold text-forest">Request timeline</h2>
                <p className="mt-1 text-xs text-charcoal/60">
                  Status transitions and payment documentation.
                </p>
              </div>
            </div>
            <ul className="mt-5 divide-y divide-mist">
              {timeline.map(([label, date]) => (
                <li key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="font-semibold text-charcoal">{label}</span>
                  <span className="text-right text-charcoal/65">{formatDateTime(date)}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ClipboardCheck aria-hidden="true" className="text-leaf" size={21} />
              <div>
                <h2 className="font-extrabold text-forest">Audit history</h2>
                <p className="mt-1 text-xs text-charcoal/60">
                  Append-only events for this egg-sale request.
                </p>
              </div>
            </div>
            {auditEvents.length ? (
              <ul className="mt-5 divide-y divide-mist">
                {auditEvents.map((event) => (
                  <li key={event.id} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="font-semibold text-charcoal">
                      {event.action.replaceAll("_", " ")}
                    </span>
                    <span className="shrink-0 text-charcoal/60">
                      {formatDateTime(event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-charcoal/65">
                No audit event is available for this request.
              </p>
            )}
          </article>
        </section>

        <aside className="grid h-fit gap-6">
          <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <WalletCards aria-hidden="true" className="text-leaf" size={21} />
              <div>
                <h2 className="font-extrabold text-forest">Payment account snapshot</h2>
                <p className="mt-1 text-xs text-charcoal/60">
                  Captured when the request was submitted.
                </p>
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                  Account holder
                </dt>
                <dd className="mt-1 font-bold text-charcoal">
                  {sale.payoutAccountTitleSnapshot ?? "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                  Payment channel
                </dt>
                <dd className="mt-1 font-bold text-charcoal">
                  {sale.payoutProviderSnapshot ?? "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                  Masked identifier
                </dt>
                <dd className="mt-1 break-words font-bold text-charcoal">{accountSummary}</dd>
              </div>
            </dl>
            {canSettle ? (
              <details className="mt-4 rounded-md border border-mist bg-ivory p-3 text-xs leading-5 text-charcoal/65">
                <summary className="cursor-pointer font-bold text-forest">
                  Show payment identifier for external transfer
                </summary>
                <p className="mt-3 break-all font-mono text-sm font-bold text-charcoal">
                  {authorizedPaymentIdentifier ??
                    "This legacy payment method needs the customer to re-enter its identifier."}
                </p>
              </details>
            ) : (
              <p className="mt-4 rounded-md border border-mist bg-ivory p-3 text-xs leading-5 text-charcoal/65">
                Full payment identifiers are available only to authorized settlement roles. Lists,
                exports, and ordinary review screens stay masked.
              </p>
            )}
          </section>

          {riskIndicators.length ? (
            <section className="rounded-lg border border-amber/35 bg-amber/10 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle aria-hidden="true" className="text-amber" size={19} />
                <h2 className="font-extrabold text-forest">Review attention</h2>
              </div>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-charcoal/75">
                {riskIndicators.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="rounded-lg border border-leaf/25 bg-emerald-50 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="text-leaf" size={19} />
                <h2 className="font-extrabold text-forest">Basic checks clear</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-charcoal/70">
                The request has a reservation, active customer status, and a payout snapshot.
                Continue normal review.
              </p>
            </section>
          )}

          {canReview && sale.status === "AWAITING_REVIEW" ? (
            <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
              <h2 className="font-extrabold text-forest">Start review</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal/65">
                Assign yourself and record the review start time before taking a decision.
              </p>
              <div className="mt-4">
                <ClaimEggSaleForm publicReference={sale.publicReference} />
              </div>
            </section>
          ) : null}
          {canReview && sale.status === "UNDER_REVIEW" ? (
            <EggSaleReviewForm publicReference={sale.publicReference} />
          ) : null}
          {canSettle && sale.status === "PAYMENT_PROCESSING" && !latestPayout ? (
            <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
              <h2 className="font-extrabold text-forest">Record payment reference</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal/65">
                Send the payment outside GrowMeta Egg first. Record its transaction reference here before
                it can be confirmed paid.
              </p>
              <div className="mt-4">
                <SettlementRecordForm publicReference={sale.publicReference} />
              </div>
            </section>
          ) : null}
          {canSettle && latestPayout?.status === "RECORDED" ? (
            <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
              <h2 className="font-extrabold text-forest">Confirm completed payment</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal/65">
                Reference: {latestPayout.settlementReference}. Confirm only after the external
                payment has actually been sent.
              </p>
              <div className="mt-4">
                <SettlementStatusForms payoutId={latestPayout.id} />
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileCheck aria-hidden="true" className="text-leaf" size={21} />
              <h2 className="font-extrabold text-forest">Settlement record</h2>
            </div>
            {sale.payouts.length ? (
              <ul className="mt-4 divide-y divide-mist">
                {sale.payouts.map((payout) => (
                  <li key={payout.id} className="py-3 text-sm">
                    <p className="font-bold text-charcoal">{payout.settlementReference}</p>
                    <p className="mt-1 text-charcoal/65">
                      {payout.status} · {formatPaisa(payout.amountPaisa)}
                    </p>
                    {payout.confirmedAt ? (
                      <p className="mt-1 text-xs text-charcoal/55">
                        Paid {formatDateTime(payout.confirmedAt)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-charcoal/65">
                No external payment reference has been recorded.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

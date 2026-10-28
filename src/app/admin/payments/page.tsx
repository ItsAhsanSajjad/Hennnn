import Link from "next/link";
import { CreditCard, FileImage, Search } from "lucide-react";
import type { PaymentSubmissionStatus, Prisma } from "@prisma/client";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProofThumbnail } from "@/components/admin/proof-thumbnail";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { displayPaymentReference } from "@/lib/utilities/phase2";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

const statuses: PaymentSubmissionStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];
// The default queue shows only submissions still awaiting a decision, so the list
// matches the sidebar badge and empties out as each one is reviewed.
const reviewPendingStatuses: PaymentSubmissionStatus[] = ["SUBMITTED", "UNDER_REVIEW"];

function paymentTone(status: PaymentSubmissionStatus) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "danger";
  if (status === "SUBMITTED" || status === "UNDER_REVIEW") return "pending";
  return "neutral";
}

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPermission(ADMIN_PERMISSIONS.PAYMENTS_VIEW);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const showAll = params.status === "ALL";
  const specificStatus = statuses.includes(params.status as PaymentSubmissionStatus)
    ? (params.status as PaymentSubmissionStatus)
    : undefined;
  const statusWhere: Prisma.PaymentSubmissionWhereInput = showAll
    ? {}
    : specificStatus
      ? { status: specificStatus }
      : { status: { in: reviewPendingStatuses } };

  const where: Prisma.PaymentSubmissionWhereInput = {
    ...statusWhere,
    ...(query
      ? {
          OR: [
            { transactionReference: { contains: query, mode: "insensitive" } },
            { purchaseOrder: { orderReference: { contains: query, mode: "insensitive" } } },
            { purchaseOrder: { user: { username: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [submissions, pendingCount, pendingAmount, approvedCount] = await Promise.all([
    prisma.paymentSubmission.findMany({
      where,
      include: {
        purchaseOrder: { include: { user: true } },
        paymentAccount: true,
        proofs: {
          where: { deletedAt: null },
          select: { id: true, mimeType: true, safeFileName: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 100,
    }),
    prisma.paymentSubmission.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.paymentSubmission.aggregate({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      _sum: { amountPaisaSnapshot: true },
    }),
    prisma.paymentSubmission.count({ where: { status: "APPROVED" } }),
  ]);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={CreditCard}
        eyebrow="Finance review"
        title="Payment approvals"
        description="Review customer-submitted payment references and proof files against the related GrowMeta Egg order. Approval activates the existing order workflow; it does not initiate an external transfer."
      />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Payment review summary">
        <AdminMetricCard
          icon={CreditCard}
          label="Awaiting review"
          value={pendingCount}
          detail="Submitted or claimed payment records"
          tone="amber"
        />
        <AdminMetricCard
          icon={FileImage}
          label="Amount awaiting review"
          value={formatPaisa(pendingAmount._sum.amountPaisaSnapshot ?? 0n)}
          detail="Snapshot amount across open review records"
          tone="blue"
        />
        <AdminMetricCard
          icon={Search}
          label="Approved records"
          value={approvedCount}
          detail="Approved payment submissions in the current database"
        />
      </section>

      <form className="grid gap-3 rounded-lg border border-mist bg-surface p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_190px_auto_auto]">
        <label className="sr-only" htmlFor="payment-search">
          Search payments
        </label>
        <input
          id="payment-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search reference, order, or customer"
          className="min-h-11 rounded-md border border-mist bg-surface px-3 text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-leaf"
        />
        <label className="sr-only" htmlFor="payment-status">
          Filter by status
        </label>
        <select
          id="payment-status"
          name="status"
          defaultValue={showAll ? "ALL" : (specificStatus ?? "")}
          className="min-h-11 cursor-pointer rounded-md border border-mist bg-surface px-3 text-sm text-charcoal outline-none focus:border-leaf"
        >
          <option value="">Awaiting review</option>
          <option value="ALL">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <Button type="submit">Apply filters</Button>
        <ButtonLink href="/admin/payments" variant="secondary">
          Clear
        </ButtonLink>
      </form>

      <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
        <div className="flex flex-col gap-1 border-b border-mist px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold text-forest">
              {showAll || specificStatus ? "Payment records" : "Awaiting your review"}
            </h2>
            <p className="mt-1 text-xs text-charcoal/60">
              {submissions.length} {showAll || specificStatus ? "matching" : "awaiting"} record
              {submissions.length === 1 ? "" : "s"}
            </p>
          </div>
          <p className="text-xs text-charcoal/55">Most recently submitted first</p>
        </div>

        {submissions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Proof</th>
                  <th className="px-4 py-3">Order and customer</th>
                  <th className="px-4 py-3">Payment reference</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3" aria-label="Open review" />
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {submissions.map((submission) => {
                  const proof = submission.proofs[0];
                  const proofIsImage = proof?.mimeType.startsWith("image/");

                  return (
                    <tr
                      key={submission.id}
                      className="align-middle transition-colors hover:bg-surface-2"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/payments/${submission.id}`}
                          aria-label={`View proof for ${submission.purchaseOrder.orderReference}`}
                          className="flex size-12 items-center justify-center overflow-hidden rounded-md border border-mist bg-ivory text-leaf"
                        >
                          {proof && proofIsImage ? (
                            <ProofThumbnail
                              src={`/api/payment-proofs/${proof.id}`}
                              alt={`Payment proof for ${submission.purchaseOrder.orderReference}`}
                            />
                          ) : (
                            <FileImage aria-hidden="true" size={20} />
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-forest">
                          {submission.purchaseOrder.orderReference}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-charcoal/60">
                          {submission.purchaseOrder.user.username}
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-normal ${
                              submission.method === "PAYBOST"
                                ? "bg-leaf/15 text-leaf"
                                : "bg-mist text-charcoal/70"
                            }`}
                          >
                            {submission.method === "PAYBOST" ? "Online" : "Manual"}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-charcoal">
                          {displayPaymentReference(submission.transactionReference)}
                        </p>
                        <p className="mt-1 text-xs text-charcoal/55">
                          {submission.method === "PAYBOST"
                            ? "Paybost gateway"
                            : (submission.paymentAccount?.provider ?? "—")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-charcoal/70">
                        {submission.paymentAccount?.accountTitle ??
                          (submission.method === "PAYBOST" ? "Online payment" : "—")}
                      </td>
                      <td className="px-4 py-3 font-bold text-charcoal">
                        {formatPaisa(submission.amountPaisaSnapshot)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={paymentTone(submission.status)}>
                          {submission.status}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-charcoal/65">
                        {formatDateTime(submission.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/payments/${submission.id}`}
                          className="inline-flex min-h-10 items-center rounded-md border border-mist px-3 text-xs font-bold text-forest transition-colors hover:bg-ivory"
                        >
                          Open review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileImage aria-hidden="true" className="mx-auto text-leaf" size={28} />
            <h2 className="mt-3 text-lg font-extrabold text-forest">No payment records match</h2>
            <p className="mt-2 text-sm text-charcoal/65">
              Change or clear the filters to review another set of submissions.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

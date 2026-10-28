import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";
type Params = Promise<{ id: string }>;

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  await requireAdminPermission(ADMIN_PERMISSIONS.ORDERS_VIEW);
  const { id } = await params;
  const order = await prisma.purchaseOrder.findUnique({
    where: { orderReference: id },
    include: {
      user: true,
      henPlan: true,
      henAssets: true,
      paymentSubmissions: {
        include: { paymentAccount: true, reviewedBy: true, proofs: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!order) notFound();
  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={ClipboardList}
        eyebrow="Purchase record"
        title={order.orderReference}
        description="Server-side order snapshots below are the authoritative record used during payment review and hen activation."
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-mist px-4 text-sm font-bold text-forest hover:bg-ivory"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            All orders
          </Link>
        }
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-mist bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-normal text-charcoal/55">Customer</p>
          <p className="mt-2 font-extrabold text-forest">{order.user.username}</p>
        </article>
        <article className="rounded-lg border border-mist bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
            Order total
          </p>
          <p className="mt-2 font-extrabold text-forest">{formatPaisa(order.totalAmountPaisa)}</p>
        </article>
        <article className="rounded-lg border border-mist bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-normal text-charcoal/55">Status</p>
          <div className="mt-2">
            <StatusBadge
              tone={
                order.status === "APPROVED"
                  ? "success"
                  : order.status === "REJECTED"
                    ? "danger"
                    : "pending"
              }
            >
              {order.status}
            </StatusBadge>
          </div>
        </article>
        <article className="rounded-lg border border-mist bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-normal text-charcoal/55">Created</p>
          <p className="mt-2 font-semibold text-charcoal">{formatDateTime(order.createdAt)}</p>
        </article>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-mist bg-surface p-5">
          <h2 className="font-extrabold text-forest">Plan snapshot</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-charcoal/55">Plan</dt>
              <dd className="font-bold text-charcoal">{order.planNameSnapshot}</dd>
            </div>
            <div>
              <dt className="text-charcoal/55">Quantity</dt>
              <dd className="font-bold text-charcoal">{order.quantity} hens</dd>
            </div>
            <div>
              <dt className="text-charcoal/55">Production</dt>
              <dd className="font-bold text-charcoal">
                {order.dailyEggUnitsSnapshot} egg/day for {order.validityDaysSnapshot} days, up to{" "}
                {order.maximumEggUnitsSnapshot} per hen
              </dd>
            </div>
            <div>
              <dt className="text-charcoal/55">Terms version</dt>
              <dd className="font-bold text-charcoal">{order.termsVersionSnapshot}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-lg border border-mist bg-surface p-5">
          <h2 className="font-extrabold text-forest">Activation</h2>
          {order.henAssets.length ? (
            order.henAssets.map((asset) => (
              <div key={asset.id} className="mt-4 text-sm">
                <StatusBadge tone={asset.status === "ACTIVE" ? "success" : "pending"}>
                  {asset.status}
                </StatusBadge>
                <p className="mt-2 text-charcoal/70">
                  Activated {formatDateTime(asset.activatedAt)}. Recorded output:{" "}
                  {asset.totalEggUnitsProduced} of {asset.totalMaximumEggUnits} eggs.
                </p>
              </div>
            ))
          ) : (
            <p className="mt-4 text-sm text-charcoal/65">
              No hen asset has been activated for this order.
            </p>
          )}
        </article>
      </section>
      <section className="rounded-lg border border-mist bg-surface p-5">
        <h2 className="font-extrabold text-forest">Payment submission history</h2>
        {order.paymentSubmissions.length ? (
          <div className="mt-4 grid gap-4">
            {order.paymentSubmissions.map((submission) => (
              <article key={submission.id} className="rounded-md border border-mist p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-charcoal">
                      {formatPaisa(submission.amountPaisaSnapshot)} via{" "}
                      {submission.method === "PAYBOST"
                        ? "Paybost (online)"
                        : (submission.paymentAccount?.provider.replaceAll("_", " ") ?? "manual")}
                    </p>
                    <p className="mt-1 text-xs text-charcoal/60">
                      Submitted {formatDateTime(submission.submittedAt)} | reviewer{" "}
                      {submission.reviewedBy?.username ?? "Not assigned"}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      submission.status === "APPROVED"
                        ? "success"
                        : submission.status === "REJECTED"
                          ? "danger"
                          : "pending"
                    }
                  >
                    {submission.status}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-sm text-charcoal/70">
                  Customer reference:{" "}
                  {submission.transactionReference.startsWith("PAYMENT-PROOF-")
                    ? "Not supplied"
                    : submission.transactionReference}
                </p>
                <p className="mt-1 text-sm text-charcoal/70">
                  Proof records:{" "}
                  {submission.proofs
                    .map((proof) => `${proof.safeFileName} (${proof.sizeBytes} bytes)`)
                    .join(", ") || "None"}
                </p>
                {submission.rejectionReason ? (
                  <p className="mt-2 text-sm font-semibold text-danger">
                    Rejection: {submission.rejectionReason}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-charcoal/65">
            No payment submissions are recorded for this order.
          </p>
        )}
      </section>
    </div>
  );
}

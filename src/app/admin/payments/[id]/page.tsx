import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, FileImage } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProofThumbnail } from "@/components/admin/proof-thumbnail";
import { PaymentReviewForm } from "@/components/phase2/payment-review-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import { displayPaymentReference } from "@/lib/utilities/phase2";
import { ADMIN_PERMISSIONS, canReviewPayments } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

function paymentTone(status: string) {
  if (status === "APPROVED") return "success";
  if (["REJECTED", "CANCELLED"].includes(status)) return "danger";
  if (["SUBMITTED", "UNDER_REVIEW"].includes(status)) return "pending";
  return "neutral";
}

function DetailRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-start justify-between gap-4 border-b border-mist/60 pb-3 last:border-0 last:pb-0"
        >
          <dt className="shrink-0 text-sm text-charcoal/55">{label}</dt>
          <dd className="break-words text-right text-sm font-bold text-charcoal">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function AdminPaymentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.PAYMENTS_VIEW);
  const { id } = await params;
  const submission = await prisma.paymentSubmission.findUnique({
    where: { id },
    include: {
      submittedBy: true,
      reviewedBy: true,
      paymentAccount: true,
      proofs: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      purchaseOrder: { include: { henAssets: true, user: true } },
    },
  });
  if (!submission) notFound();

  const canReview = canReviewPayments(actor.role);
  const order = submission.purchaseOrder;
  const isPaybost = submission.method === "PAYBOST";
  const isOpen = ["SUBMITTED", "UNDER_REVIEW"].includes(submission.status);

  const paymentRows: Array<[string, string]> = isPaybost
    ? [
        ["Method", "Online (Paybost)"],
        ["Gateway txn", submission.gatewayTxnId ?? "Not yet confirmed"],
        ["Reference", displayPaymentReference(submission.transactionReference)],
        ["Submitted", formatDateTime(submission.submittedAt)],
      ]
    : [
        ["Method", "Manual transfer"],
        ["Paid to", submission.paymentAccount?.accountTitle ?? "—"],
        ["Provider", submission.paymentAccount?.provider ?? "—"],
        ["Reference", displayPaymentReference(submission.transactionReference)],
        ["Submitted", formatDateTime(submission.submittedAt)],
      ];

  const orderRows: Array<[string, string]> = [
    ["Order", order.orderReference],
    ["Plan", order.planNameSnapshot],
    ["Quantity", `${order.quantity} ${order.quantity === 1 ? "hen" : "hens"}`],
    ["Order total", formatPaisa(order.totalAmountPaisa)],
    ["Order state", order.status.replaceAll("_", " ").toLowerCase()],
    ["Assets activated", String(order.henAssets.length)],
  ];

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={CreditCard}
        eyebrow="Payment review"
        title={order.orderReference}
        description="Check the proof and reference against the order, then approve or reject."
        actions={
          <Link
            href="/admin/payments"
            className="inline-flex min-h-11 items-center rounded-md border border-mist bg-surface px-4 text-sm font-bold text-forest hover:bg-ivory"
          >
            Back to payments
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="grid gap-6">
          {/* At-a-glance summary */}
          <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="pak-kicker">{isPaybost ? "Online payment" : "Manual submission"}</p>
                <p className="mt-2 text-4xl font-extrabold tracking-tight text-forest">
                  {formatPaisa(submission.amountPaisaSnapshot)}
                </p>
                <p className="mt-2 text-sm text-charcoal/60">
                  {order.user.username} · submitted {formatDateTime(submission.submittedAt)}
                </p>
              </div>
              <StatusBadge tone={paymentTone(submission.status)}>{submission.status}</StatusBadge>
            </div>
          </article>

          {/* Payment proof — the primary artifact to review */}
          <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileImage aria-hidden="true" className="text-leaf" size={21} />
              <div>
                <h2 className="font-extrabold text-forest">Payment proof</h2>
                <p className="mt-1 text-xs text-charcoal/60">
                  Visible only to the record owner and authorized reviewers.
                </p>
              </div>
            </div>
            {submission.proofs.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {submission.proofs.map((proof) => {
                  const proofIsImage = proof.mimeType.startsWith("image/");

                  return (
                    <Link
                      key={proof.id}
                      href={`/api/payment-proofs/${proof.id}`}
                      className="group overflow-hidden rounded-md border border-mist bg-ivory transition-colors hover:border-leaf/35"
                    >
                      <div className="grid aspect-[16/9] place-items-center bg-surface">
                        {proofIsImage ? (
                          <ProofThumbnail
                            src={`/api/payment-proofs/${proof.id}`}
                            alt={`Payment proof ${proof.safeFileName}`}
                            size={30}
                            className="h-full w-full object-contain"
                            withCaption
                          />
                        ) : (
                          <FileImage aria-hidden="true" className="text-leaf" size={28} />
                        )}
                      </div>
                      <div className="border-t border-mist px-4 py-3">
                        <p className="truncate text-sm font-bold text-forest group-hover:text-leaf">
                          {proof.safeFileName}
                        </p>
                        <p className="mt-1 text-xs text-charcoal/55">
                          {proof.mimeType} · {proof.sizeBytes.toLocaleString()} bytes
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-md border border-dashed border-mist bg-ivory px-4 py-6 text-center text-sm text-charcoal/60">
                No proof file is attached to this submission.
              </p>
            )}
          </article>

          {/* Details — payment + order side by side */}
          <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <h2 className="font-extrabold text-forest">Details</h2>
            <p className="mt-1 text-xs text-charcoal/60">
              Order values are the snapshot captured when the order was created.
            </p>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="pak-kicker mb-3">Payment</p>
                <DetailRows rows={paymentRows} />
              </div>
              <div>
                <p className="pak-kicker mb-3">Order</p>
                <DetailRows rows={orderRows} />
              </div>
            </div>
          </article>
        </section>

        <aside className="grid h-fit gap-6 xl:sticky xl:top-6">
          <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-forest">Finance decision</h2>
            {canReview && isOpen ? (
              <>
                <p className="mt-1 text-xs leading-5 text-charcoal/60">
                  Confirm the amount, account, reference, and proof match this order before deciding.
                </p>
                <div className="mt-5">
                  <PaymentReviewForm paymentSubmissionId={submission.id} />
                </div>
              </>
            ) : submission.reviewedAt ? (
              <div className="mt-4 rounded-md border border-mist bg-ivory p-4 text-sm leading-6 text-charcoal/70">
                <p className="font-bold text-charcoal">
                  Reviewed {formatDateTime(submission.reviewedAt)}
                </p>
                <p className="mt-2">
                  {submission.reviewNotes ??
                    submission.rejectionReason ??
                    "No additional review note recorded."}
                </p>
                {submission.reviewedBy ? (
                  <p className="mt-2 text-xs text-charcoal/55">
                    Reviewer: {submission.reviewedBy.username}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-charcoal/65">
                Your role can view this record but cannot make a finance decision.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

import type { PaymentSubmission, Prisma, PurchaseOrder, User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import {
  addUtcDays,
  createGeneratedPaymentReference,
  normalizeTransactionReference,
  toUtcDate,
} from "@/lib/utilities/phase2";
import { canReviewPayments } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";
import { deletePrivateFile, storePaymentProofFile } from "@/server/services/private-storage";
import { applyReferralPurchaseBenefitForApprovedOrder } from "@/server/services/referral-purchase-benefit";

/** A payment record together with its parent order. */
export type PaymentWithOrder = PaymentSubmission & { purchaseOrder: PurchaseOrder };

/** True when this is an online payment that the gateway has not yet confirmed. */
export function isUnconfirmedPaybost(
  submission: Pick<PaymentSubmission, "method" | "gatewayTxnId">,
) {
  return submission.method === "PAYBOST" && submission.gatewayTxnId === null;
}

/**
 * The single approval state machine shared by manual admin approval and the
 * Paybost IPN webhook: claim the order, mark the payment approved, activate the
 * hen asset, apply any referral benefit, notify the customer, and audit it.
 *
 * The caller is responsible for atomically claiming the payment row first (so
 * concurrent approvals no-op). `actor.id` is the reviewing admin for manual
 * approvals, or `null` for the automated gateway.
 */
export async function applyApprovedPayment(
  tx: Prisma.TransactionClient,
  submission: PaymentWithOrder,
  actor: { id: string | null },
) {
  const now = new Date();
  const order = submission.purchaseOrder;

  // Claim and approve the order in one atomic write. The `updateMany` guard means
  // only one approver (manual admin or a racing IPN) advances it — a second attempt
  // matches no row and no-ops. Accept AWAITING_PAYMENT too, so a very fast IPN that
  // beats the initiate route's status update still advances the order exactly once.
  // (The order was previously set to UNDER_REVIEW then APPROVED in two writes; since
  // that intermediate state is never visible outside this transaction, one write is
  // equivalent and saves a database round-trip.)
  const orderClaim = await tx.purchaseOrder.updateMany({
    where: { id: order.id, status: { in: ["PAYMENT_SUBMITTED", "AWAITING_PAYMENT"] } },
    data: { status: "APPROVED", approvedAt: now },
  });
  if (orderClaim.count !== 1) {
    throw new Error("Purchase order is not eligible for approval.");
  }

  const productionStart = toUtcDate(now);
  const productionEnd = addUtcDays(productionStart, order.validityDaysSnapshot - 1);
  const totalMaximumEggUnits = order.maximumEggUnitsSnapshot * order.quantity;

  const updated = await tx.paymentSubmission.update({
    where: { id: submission.id },
    data: {
      status: "APPROVED",
      reviewedAt: now,
      reviewedByUserId: actor.id,
    },
  });
  const asset = await tx.henAsset.upsert({
    where: { purchaseOrderId: order.id },
    update: {},
    create: {
      userId: order.userId,
      purchaseOrderId: order.id,
      henPlanId: order.henPlanId,
      status: "ACTIVE",
      quantity: order.quantity,
      activatedAt: now,
      productionStartDate: productionStart,
      productionEndDate: productionEnd,
      dailyEggUnitsPerHen: order.dailyEggUnitsSnapshot,
      maximumEggUnitsPerHen: order.maximumEggUnitsSnapshot,
      totalMaximumEggUnits,
    },
  });

  // Both approval audit rows in a single insert (one round-trip instead of two).
  await tx.auditLog.createMany({
    data: [
      {
        actorUserId: actor.id,
        action: "PAYMENT_APPROVED",
        entityType: "PaymentSubmission",
        entityId: submission.id,
        metadata: {
          purchaseOrderId: order.id,
          henAssetId: asset.id,
          method: submission.method,
          gatewayTxnId: submission.gatewayTxnId,
        } satisfies Prisma.InputJsonValue,
      },
      {
        actorUserId: actor.id,
        action: "HEN_ASSET_ACTIVATED",
        entityType: "HenAsset",
        entityId: asset.id,
        metadata: { purchaseOrderId: order.id } satisfies Prisma.InputJsonValue,
      },
    ],
  });

  await tx.notification.create({
    data: {
      userId: order.userId,
      type: "ACCOUNT",
      title: "Payment approved",
      message: `Your payment for order ${order.orderReference} is confirmed and your hens are now active.`,
      metadata: {
        orderReference: order.orderReference,
        henAssetId: asset.id,
        method: submission.method,
      } satisfies Prisma.InputJsonValue,
    },
  });

  await applyReferralPurchaseBenefitForApprovedOrder({ tx, purchaseOrderId: order.id });

  return updated;
}

export async function submitPaymentForOrder({
  user,
  purchaseOrderId,
  paymentAccountId,
  transactionReference,
  proofFile,
}: {
  user: Pick<User, "id">;
  purchaseOrderId: string;
  paymentAccountId: string;
  transactionReference?: string;
  proofFile: File;
}) {
  // Allow re-submitting while an abandoned online attempt still holds the order
  // (PAYMENT_SUBMITTED). The superseding of that attempt happens inside the
  // transaction below so manual payment is never blocked by online payment.
  const order = await prisma.purchaseOrder.findFirst({
    where: {
      id: purchaseOrderId,
      userId: user.id,
      status: { in: ["AWAITING_PAYMENT", "REJECTED", "PAYMENT_SUBMITTED"] },
      paymentDueAt: { gt: new Date() },
    },
  });
  if (!order) throw new Error("This order is not ready for payment submission.");

  const paymentAccount = await prisma.paymentAccount.findFirst({
    where: { id: paymentAccountId, isActive: true, archivedAt: null },
  });
  if (!paymentAccount) throw new Error("Selected payment account is not available.");

  const stored = await storePaymentProofFile(proofFile);
  const submittedReference = transactionReference?.trim() || createGeneratedPaymentReference();
  const normalizedReference = normalizeTransactionReference(submittedReference);

  try {
    return await prisma.$transaction(async (tx) => {
      const activeSubmission = await tx.paymentSubmission.findFirst({
        where: {
          purchaseOrderId: order.id,
          status: { in: ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (activeSubmission) {
        if (isUnconfirmedPaybost(activeSubmission)) {
          // Supersede the unconfirmed online attempt and continue with manual.
          await tx.paymentSubmission.updateMany({
            where: { id: activeSubmission.id, status: "PENDING", gatewayTxnId: null },
            data: {
              status: "REJECTED",
              gatewayStatus: "superseded_by_manual",
              rejectionReason: "Superseded by manual payment proof",
            },
          });
        } else {
          throw new Error("This order already has an active payment submission.");
        }
      }

      // Check if transactionReference is already used by another submission
      const existingRef = await tx.paymentSubmission.findUnique({
        where: { transactionReferenceNormalized: normalizedReference },
        select: { id: true },
      });
      if (existingRef) {
        throw new Error("This transaction ID has already been submitted for another payment.");
      }

      // Check if screenshot hash is already used
      const existingProof = await tx.paymentProof.findUnique({
        where: { sha256Hash: stored.sha256Hash },
        select: { id: true },
      });
      if (existingProof) {
        throw new Error("This payment screenshot has already been submitted.");
      }

      const submission = await tx.paymentSubmission.create({
        data: {
          purchaseOrderId: order.id,
          paymentAccountId: paymentAccount.id,
          submittedByUserId: user.id,
          transactionReference: submittedReference,
          transactionReferenceNormalized: normalizedReference,
          amountPaisaSnapshot: order.totalAmountPaisa,
          status: "SUBMITTED",
          method: "MANUAL",
        },
      });

      const proof = await tx.paymentProof.create({
        data: {
          paymentSubmissionId: submission.id,
          storageProvider: stored.storageProvider,
          storageKey: stored.storageKey,
          originalFileName: stored.safeFileName,
          safeFileName: stored.safeFileName,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          sha256Hash: stored.sha256Hash,
          imageWidth: stored.imageWidth,
          imageHeight: stored.imageHeight,
          uploadedByUserId: user.id,
        },
      });

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: "PAYMENT_SUBMITTED",
          submittedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      await createAuditLog(
        {
          actorUserId: user.id,
          action: "PAYMENT_PROOF_UPLOADED",
          entityType: "PaymentProof",
          entityId: proof.id,
          metadata: {
            paymentSubmissionId: submission.id,
            sizeBytes: proof.sizeBytes,
            mimeType: proof.mimeType,
          } satisfies Prisma.InputJsonValue,
        },
        tx,
      );

      await createAuditLog(
        {
          actorUserId: user.id,
          action: "PAYMENT_SUBMITTED",
          entityType: "PaymentSubmission",
          entityId: submission.id,
          metadata: {
            orderReference: order.orderReference,
            proofId: proof.id,
            method: "MANUAL",
          } satisfies Prisma.InputJsonValue,
        },
        tx,
      );

      return { ...submission, orderReference: order.orderReference };
    });
  } catch (error) {
    await deletePrivateFile(stored.storageKey);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const meta = (error as { meta?: { target?: string[] | string } }).meta;
      const targetStr = JSON.stringify(meta?.target || "");
      if (targetStr.includes("sha256Hash")) {
        throw new Error("This payment screenshot has already been submitted.");
      }
      throw new Error("This transaction ID has already been submitted for another payment.");
    }
    throw error;
  }
}

export async function reviewPaymentSubmission({
  actor,
  paymentSubmissionId,
  decision,
  reviewNotes,
  rejectionReason,
}: {
  actor: Pick<User, "id" | "role">;
  paymentSubmissionId: string;
  decision: "approve" | "reject";
  reviewNotes?: string;
  rejectionReason?: string;
}) {
  if (!canReviewPayments(actor.role)) {
    throw new Error("You are not allowed to review payments.");
  }

  const submission = await prisma.paymentSubmission.findUnique({
    where: { id: paymentSubmissionId },
    include: { purchaseOrder: true },
  });
  if (!submission) throw new Error("Payment submission was not found.");
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
    return submission;
  }
  if (decision === "reject" && !rejectionReason?.trim()) {
    throw new Error("A rejection reason is required.");
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const claimed = await tx.paymentSubmission.updateMany({
      where: { id: submission.id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      data: {
        status: "UNDER_REVIEW",
        reviewedByUserId: actor.id,
      },
    });
    if (claimed.count !== 1) {
      const current = await tx.paymentSubmission.findUniqueOrThrow({
        where: { id: submission.id },
      });
      return current;
    }

    if (decision === "reject") {
      const updated = await tx.paymentSubmission.update({
        where: { id: submission.id },
        data: {
          status: "REJECTED",
          reviewedAt: now,
          reviewedByUserId: actor.id,
          reviewNotes,
          rejectionReason,
        },
      });
      await tx.purchaseOrder.update({
        where: { id: submission.purchaseOrderId },
        data: {
          status: "REJECTED",
          rejectedAt: now,
          rejectionReason,
        },
      });
      await createAuditLog(
        {
          actorUserId: actor.id,
          action: "PAYMENT_REJECTED",
          entityType: "PaymentSubmission",
          entityId: submission.id,
          metadata: { purchaseOrderId: submission.purchaseOrderId } satisfies Prisma.InputJsonValue,
        },
        tx,
      );
      return updated;
    }

    // Approve: reuse the shared state machine (also used by the Paybost webhook).
    const updated = await applyApprovedPayment(
      tx,
      { ...submission, reviewNotes: reviewNotes ?? submission.reviewNotes },
      actor,
    );
    if (reviewNotes) {
      await tx.paymentSubmission.update({
        where: { id: submission.id },
        data: { reviewNotes },
      });
    }
    return updated;
  });
}

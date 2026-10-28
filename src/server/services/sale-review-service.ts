import type { Prisma, User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { canReviewEggSales } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";
import { createSaleReleaseEntry } from "@/server/services/egg-sale-service";
import { assertEggSaleTransition } from "@/server/services/egg-sale-transitions";

export async function claimEggSaleForReview({
  actor,
  publicReference,
}: {
  actor: Pick<User, "id" | "role">;
  publicReference: string;
}) {
  if (!canReviewEggSales(actor.role)) {
    throw new Error("You are not allowed to review egg-sale requests.");
  }

  return prisma.$transaction(async (tx) => {
    const initialSale = await tx.eggSaleRequest.findUnique({ where: { publicReference } });
    if (!initialSale) throw new Error("Egg-sale request was not found.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${initialSale.userId}))`;
    const sale = await tx.eggSaleRequest.findUnique({ where: { publicReference } });
    if (!sale) throw new Error("Egg-sale request was not found.");
    if (sale.status !== "AWAITING_REVIEW") return sale;

    assertEggSaleTransition({ from: sale.status, to: "UNDER_REVIEW" });

    const claimed = await tx.eggSaleRequest.update({
      where: { id: sale.id },
      data: {
        status: "UNDER_REVIEW",
        underReviewAt: new Date(),
        reviewedByUserId: actor.id,
      },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "EGG_SALE_REVIEW_CLAIMED",
        entityType: "EggSaleRequest",
        entityId: sale.id,
        metadata: { publicReference } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    await tx.notification.create({
      data: {
        userId: sale.userId,
        type: "SALE",
        title: "Egg-sale review started",
        message: `${sale.publicReference} is now being reviewed by the GrowMeta Egg operations team.`,
        metadata: { publicReference: sale.publicReference, status: "UNDER_REVIEW" },
      },
    });
    return claimed;
  });
}

export async function reviewEggSaleRequest({
  actor,
  publicReference,
  decision,
  rejectionCategory,
  userVisibleReason,
  internalReviewNotes,
}: {
  actor: Pick<User, "id" | "role">;
  publicReference: string;
  decision: "approve" | "reject";
  rejectionCategory?: string;
  userVisibleReason?: string;
  internalReviewNotes?: string;
}) {
  if (!canReviewEggSales(actor.role)) {
    throw new Error("You are not allowed to review egg-sale requests.");
  }
  const rejectionCategoryValue = rejectionCategory?.trim();
  const userVisibleReasonValue = userVisibleReason?.trim();
  if (decision === "reject" && (!rejectionCategoryValue || !userVisibleReasonValue)) {
    throw new Error("A rejection category and user-visible reason are required.");
  }

  return prisma.$transaction(async (tx) => {
    const initialSale = await tx.eggSaleRequest.findUnique({ where: { publicReference } });
    if (!initialSale) throw new Error("Egg-sale request was not found.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${initialSale.userId}))`;
    const sale = await tx.eggSaleRequest.findUnique({ where: { publicReference } });
    if (!sale) throw new Error("Egg-sale request was not found.");

    if (["PAYMENT_PROCESSING", "REJECTED", "CANCELLED", "PAID"].includes(sale.status)) {
      return sale;
    }
    if (sale.status !== "UNDER_REVIEW") {
      throw new Error("Start review before recording an egg-sale decision.");
    }

    const reservation = await tx.eggLedgerEntry.findFirst({
      where: {
        sourceType: "EGG_SALE",
        sourceId: sale.id,
        entryType: "SALE_RESERVATION",
      },
    });
    if (!reservation || reservation.eggUnits !== -sale.eggQuantity) {
      throw new Error("Sale request has no valid reservation ledger entry.");
    }

    const now = new Date();
    if (decision === "approve") {
      const released = await tx.eggLedgerEntry.findFirst({
        where: {
          sourceType: "EGG_SALE",
          sourceId: sale.id,
          entryType: "SALE_RELEASE",
        },
      });
      if (released) {
        throw new Error("Released egg-sale requests cannot be approved.");
      }

      assertEggSaleTransition({ from: sale.status, to: "PAYMENT_PROCESSING" });
      const updated = await tx.eggSaleRequest.update({
        where: { id: sale.id },
        data: {
          status: "PAYMENT_PROCESSING",
          reviewedAt: now,
          reviewedByUserId: actor.id,
          approvedAt: now,
          paymentProcessingAt: now,
          internalReviewNotes,
        },
      });
      await tx.notification.create({
        data: {
          userId: sale.userId,
          type: "SALE",
          title: "Egg-sale payment processing",
          message: `${sale.publicReference} has been approved and is being prepared for payment.`,
          metadata: { publicReference: sale.publicReference, status: "PAYMENT_PROCESSING" },
        },
      });
      await createAuditLog(
        {
          actorUserId: actor.id,
          action: "EGG_SALE_APPROVED",
          entityType: "EggSaleRequest",
          entityId: sale.id,
          metadata: { publicReference } satisfies Prisma.InputJsonValue,
        },
        tx,
      );
      return updated;
    }

    assertEggSaleTransition({ from: sale.status, to: "REJECTED" });
    const updated = await tx.eggSaleRequest.update({
      where: { id: sale.id },
      data: {
        status: "REJECTED",
        reviewedAt: now,
        reviewedByUserId: actor.id,
        rejectedAt: now,
        rejectionCategory: rejectionCategoryValue!,
        userVisibleReason: userVisibleReasonValue!,
        internalReviewNotes,
      },
    });
    await createSaleReleaseEntry({
      tx,
      sale,
      actorUserId: actor.id,
      reason: "rejected",
    });
    await tx.notification.create({
      data: {
        userId: sale.userId,
        type: "SALE",
        title: "Egg-sale request rejected",
        message: `${sale.publicReference} was rejected. Reserved eggs were released.`,
        metadata: { publicReference: sale.publicReference, status: "REJECTED" },
      },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "EGG_SALE_REJECTED",
        entityType: "EggSaleRequest",
        entityId: sale.id,
        metadata: {
          publicReference,
          rejectionCategory,
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    return updated;
  });
}

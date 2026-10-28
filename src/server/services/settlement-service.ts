import type { Prisma, User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { normalizeSettlementReference } from "@/lib/utilities/phase3";
import { canRecordSettlements } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";
import { createSaleFinalizationEntry } from "@/server/services/egg-sale-service";
import { assertEggSaleTransition } from "@/server/services/egg-sale-transitions";

export async function recordManualSettlement({
  actor,
  publicReference,
  settlementReference,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  publicReference: string;
  settlementReference: string;
  notes?: string;
}) {
  if (!canRecordSettlements(actor.role)) {
    throw new Error("You are not allowed to record settlements.");
  }

  const normalized = normalizeSettlementReference(settlementReference);

  return prisma.$transaction(async (tx) => {
    const initialSale = await tx.eggSaleRequest.findUnique({ where: { publicReference } });
    if (!initialSale) throw new Error("Egg-sale request was not found.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${initialSale.userId}))`;
    const sale = await tx.eggSaleRequest.findUnique({ where: { publicReference } });
    if (!sale) throw new Error("Egg-sale request was not found.");
    if (sale.status !== "PAYMENT_PROCESSING") {
      throw new Error("Only payment-processing egg-sale requests can receive a settlement record.");
    }

    const reservation = await tx.eggLedgerEntry.findFirst({
      where: {
        sourceType: "EGG_SALE",
        sourceId: sale.id,
        entryType: "SALE_RESERVATION",
      },
    });
    const release = await tx.eggLedgerEntry.findFirst({
      where: {
        sourceType: "EGG_SALE",
        sourceId: sale.id,
        entryType: "SALE_RELEASE",
      },
    });
    if (!reservation || reservation.eggUnits !== -sale.eggQuantity || release) {
      throw new Error("The reserved eggs could not be safely prepared for settlement.");
    }

    const existing = await tx.payout.findUnique({ where: { eggSaleRequestId: sale.id } });
    if (existing) return existing;

    if (
      !sale.payoutProviderSnapshot ||
      !sale.payoutIdentifierMaskedSnapshot ||
      !sale.payoutIdentifierProtectedSnapshot
    ) {
      throw new Error("Sale request does not have a payout method snapshot.");
    }

    const payout = await tx.payout.create({
      data: {
        userId: sale.userId,
        eggSaleRequestId: sale.id,
        payoutMethodId: sale.payoutMethodId,
        amountPaisa: sale.totalAmountPaisa,
        status: "RECORDED",
        settlementReference: settlementReference.trim(),
        settlementReferenceNormalized: normalized,
        payoutProviderSnapshot: sale.payoutProviderSnapshot,
        payoutIdentifierMaskedSnapshot: sale.payoutIdentifierMaskedSnapshot,
        payoutIdentifierProtectedSnapshot: sale.payoutIdentifierProtectedSnapshot,
        notes,
        createdByUserId: actor.id,
      },
    });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "SETTLEMENT_CREATED",
        entityType: "Payout",
        entityId: payout.id,
        metadata: {
          publicReference,
          amountPaisa: sale.totalAmountPaisa.toString(),
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    return payout;
  });
}

export async function confirmManualSettlement({
  actor,
  payoutId,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  payoutId: string;
  notes?: string;
}) {
  if (!canRecordSettlements(actor.role)) {
    throw new Error("You are not allowed to confirm settlements.");
  }

  return prisma.$transaction(async (tx) => {
    const initialPayout = await tx.payout.findUnique({
      where: { id: payoutId },
      include: { eggSaleRequest: true },
    });
    if (!initialPayout) throw new Error("Settlement record was not found.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${initialPayout.eggSaleRequest.userId}))`;
    const payout = await tx.payout.findUnique({
      where: { id: payoutId },
      include: { eggSaleRequest: true },
    });
    if (!payout) throw new Error("Settlement record was not found.");
    if (payout.status === "CONFIRMED") return payout;
    if (payout.status !== "RECORDED") {
      throw new Error("Only recorded settlements can be confirmed.");
    }
    if (payout.eggSaleRequest.status !== "PAYMENT_PROCESSING") {
      throw new Error("Only payment-processing egg-sale requests can be marked paid.");
    }
    if (payout.amountPaisa !== payout.eggSaleRequest.totalAmountPaisa) {
      throw new Error("The settlement amount does not match the trusted payable amount.");
    }

    const reservation = await tx.eggLedgerEntry.findFirst({
      where: {
        sourceType: "EGG_SALE",
        sourceId: payout.eggSaleRequestId,
        entryType: "SALE_RESERVATION",
      },
    });
    const release = await tx.eggLedgerEntry.findFirst({
      where: {
        sourceType: "EGG_SALE",
        sourceId: payout.eggSaleRequestId,
        entryType: "SALE_RELEASE",
      },
    });
    if (!reservation || reservation.eggUnits !== -payout.eggSaleRequest.eggQuantity || release) {
      throw new Error("The reserved eggs could not be safely settled.");
    }

    const now = new Date();
    assertEggSaleTransition({ from: payout.eggSaleRequest.status, to: "PAID" });
    await createSaleFinalizationEntry({
      tx,
      sale: payout.eggSaleRequest,
      actorUserId: actor.id,
      payoutId: payout.id,
    });
    const updated = await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: now,
        confirmedByUserId: actor.id,
        notes: notes ?? payout.notes,
      },
    });
    await tx.eggSaleRequest.update({
      where: { id: payout.eggSaleRequestId },
      data: { status: "PAID", paidAt: now },
    });
    await tx.notification.create({
      data: {
        userId: payout.userId,
        type: "SETTLEMENT",
        title: "Egg-sale payment completed",
        message: `${payout.eggSaleRequest.publicReference} was marked paid after finance confirmation.`,
        metadata: {
          publicReference: payout.eggSaleRequest.publicReference,
          amountPaisa: payout.amountPaisa.toString(),
          status: "PAID",
        } satisfies Prisma.InputJsonValue,
      },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "SETTLEMENT_CONFIRMED",
        entityType: "Payout",
        entityId: payout.id,
        metadata: {
          publicReference: payout.eggSaleRequest.publicReference,
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    return updated;
  });
}

export async function failManualSettlement({
  actor,
  payoutId,
  notes,
}: {
  actor: Pick<User, "id" | "role">;
  payoutId: string;
  notes?: string;
}) {
  if (!canRecordSettlements(actor.role)) {
    throw new Error("You are not allowed to update settlements.");
  }

  return prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout) throw new Error("Settlement record was not found.");
    if (payout.status !== "RECORDED") return payout;

    const updated = await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        notes,
      },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "SETTLEMENT_FAILED",
        entityType: "Payout",
        entityId: payout.id,
      },
      tx,
    );
    return updated;
  });
}

import type { EggSaleRequest, Prisma, PrismaClient, User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import {
  calculateEggSaleAmountPaisa,
  createEggSaleIdempotencyHash,
  createEggSaleReference,
  formatMaskedPayoutIdentifier,
} from "@/lib/utilities/phase3";
import { createAuditLog } from "@/server/services/audit";
import { getAvailableEggBalance } from "@/server/services/egg-ledger";
import { getDefaultPayoutMethod } from "@/server/services/payout-method-service";
import { assertEggSaleTransition } from "@/server/services/egg-sale-transitions";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const SALE_RATE_CODE = "DEMO-EGG-SALE";

export async function getActiveEggSaleRate(tx: PrismaExecutor = prisma, now = new Date()) {
  return tx.eggSaleRate.findFirst({
    where: {
      code: SALE_RATE_CODE,
      isActive: true,
      archivedAt: null,
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
}

export async function userHasSaleEligibleHen(userId: string, tx: PrismaExecutor = prisma) {
  const count = await tx.henAsset.count({
    where: {
      userId,
      status: { notIn: ["PENDING_ACTIVATION", "CANCELLED", "REFUNDED"] },
      purchaseOrder: { status: "APPROVED" },
    },
  });
  return count > 0;
}

export async function getEggSaleEligibility(userId: string) {
  const [availableEggs, hasEligibleHen, activeRate, payoutMethod] = await Promise.all([
    getAvailableEggBalance(userId),
    userHasSaleEligibleHen(userId),
    getActiveEggSaleRate(),
    getDefaultPayoutMethod(userId),
  ]);

  return {
    availableEggs,
    hasEligibleHen,
    activeRate,
    payoutMethod,
    canSubmit: hasEligibleHen && availableEggs > 0 && Boolean(activeRate) && Boolean(payoutMethod),
  };
}

export async function submitEggSaleRequest({
  user,
  eggQuantity,
  payoutMethodId,
  idempotencyKey,
}: {
  user: Pick<User, "id">;
  eggQuantity: number;
  payoutMethodId?: string;
  idempotencyKey: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;

    const currentUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { id: true, status: true, deletedAt: true },
    });
    if (!currentUser || currentUser.status !== "ACTIVE" || currentUser.deletedAt) {
      throw new Error("Your account is not eligible to submit an egg-sale request.");
    }

    const rate = await getActiveEggSaleRate(tx);
    if (!rate) {
      throw new Error("Egg-sale requests are temporarily unavailable in demo mode.");
    }

    const hasEligibleHen = await userHasSaleEligibleHen(user.id, tx);
    if (!hasEligibleHen) {
      throw new Error(
        "At least one approved non-refunded hen asset is required before selling eggs.",
      );
    }

    const payoutMethod = await tx.payoutMethod.findFirst({
      where: {
        id: payoutMethodId,
        userId: user.id,
        status: "ACTIVE",
        archivedAt: null,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    if (!payoutMethod) {
      throw new Error("Add a payout method before submitting an egg-sale request.");
    }

    const requestHash = createEggSaleIdempotencyHash({
      eggQuantity,
      rateId: rate.id,
      ratePaisaPerEgg: rate.ratePaisaPerEgg,
      payoutMethodId: payoutMethod.id,
    });
    const existing = await tx.eggSaleRequest.findUnique({
      where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } },
    });
    if (existing) {
      if (existing.idempotencyRequestHash !== requestHash) {
        throw new Error("Idempotency key was already used for a different egg-sale request.");
      }
      return existing;
    }

    const availableBalance = await getAvailableEggBalance(user.id, tx);
    if (availableBalance < eggQuantity) {
      throw new Error("Available egg balance is not sufficient for this request.");
    }

    const totalAmountPaisa = calculateEggSaleAmountPaisa({
      eggQuantity,
      ratePaisaPerEgg: rate.ratePaisaPerEgg,
    });
    const sale = await tx.eggSaleRequest.create({
      data: {
        publicReference: createEggSaleReference(),
        userId: user.id,
        payoutMethodId: payoutMethod.id,
        status: "AWAITING_REVIEW",
        eggQuantity,
        rateId: rate.id,
        rateCodeSnapshot: rate.code,
        ratePaisaPerEggSnapshot: rate.ratePaisaPerEgg,
        totalAmountPaisa,
        payoutProviderSnapshot: payoutMethod.provider,
        payoutAccountTitleSnapshot: payoutMethod.accountTitle,
        payoutIdentifierMaskedSnapshot: formatMaskedPayoutIdentifier(
          payoutMethod.accountIdentifierLastFour,
        ),
        payoutIdentifierProtectedSnapshot: payoutMethod.accountIdentifierProtected,
        idempotencyKey,
        idempotencyRequestHash: requestHash,
      },
    });

    const reservation = await tx.eggLedgerEntry.create({
      data: {
        userId: user.id,
        entryType: "SALE_RESERVATION",
        eggUnits: -eggQuantity,
        description: `Egg-sale reservation ${sale.publicReference}`,
        sourceType: "EGG_SALE",
        sourceId: sale.id,
        idempotencyKey: `sale-reservation:${sale.id}`,
        metadata: {
          publicReference: sale.publicReference,
          eggQuantity,
          ratePaisaPerEgg: rate.ratePaisaPerEgg.toString(),
          totalAmountPaisa: totalAmountPaisa.toString(),
        } satisfies Prisma.InputJsonValue,
      },
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "SALE",
        title: "Egg-sale request submitted",
        message: `${eggQuantity} eggs were reserved for review under ${sale.publicReference}.`,
        metadata: {
          publicReference: sale.publicReference,
          eggQuantity,
          amountPaisa: totalAmountPaisa.toString(),
          status: sale.status,
        } satisfies Prisma.InputJsonValue,
      },
    });

    await createAuditLog(
      {
        actorUserId: user.id,
        action: "EGG_SALE_SUBMITTED",
        entityType: "EggSaleRequest",
        entityId: sale.id,
        metadata: {
          publicReference: sale.publicReference,
          eggQuantity,
          totalAmountPaisa: totalAmountPaisa.toString(),
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    await createAuditLog(
      {
        actorUserId: user.id,
        action: "EGG_SALE_RESERVATION_CREATED",
        entityType: "EggLedgerEntry",
        entityId: reservation.id,
        metadata: {
          saleRequestId: sale.id,
          eggUnits: reservation.eggUnits,
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );

    return sale;
  });
}

export async function cancelEggSaleRequest({
  user,
  publicReference,
}: {
  user: Pick<User, "id">;
  publicReference: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;

    const sale = await tx.eggSaleRequest.findFirst({
      where: { userId: user.id, publicReference },
    });
    if (!sale) {
      throw new Error("Egg-sale request was not found.");
    }
    if (sale.status === "CANCELLED") {
      return sale;
    }
    if (sale.status !== "AWAITING_REVIEW") {
      throw new Error("Only submitted egg-sale requests can be cancelled by the user.");
    }

    assertEggSaleTransition({ from: sale.status, to: "CANCELLED" });

    const updated = await tx.eggSaleRequest.update({
      where: { id: sale.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await createSaleReleaseEntry({
      tx,
      sale,
      actorUserId: user.id,
      reason: "cancelled",
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "SALE",
        title: "Egg-sale request cancelled",
        message: `${sale.eggQuantity} reserved eggs were released from ${sale.publicReference}.`,
        metadata: { publicReference: sale.publicReference },
      },
    });
    await createAuditLog(
      {
        actorUserId: user.id,
        action: "EGG_SALE_CANCELLED",
        entityType: "EggSaleRequest",
        entityId: sale.id,
        metadata: { publicReference: sale.publicReference } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    return updated;
  });
}

export async function createSaleReleaseEntry({
  tx,
  sale,
  actorUserId,
  reason,
}: {
  tx: Prisma.TransactionClient;
  sale: Pick<EggSaleRequest, "id" | "userId" | "eggQuantity" | "publicReference">;
  actorUserId: string | null;
  reason: "cancelled" | "rejected";
}) {
  const existing = await tx.eggLedgerEntry.findFirst({
    where: {
      sourceType: "EGG_SALE",
      sourceId: sale.id,
      entryType: "SALE_RELEASE",
    },
  });
  if (existing) return existing;

  const entry = await tx.eggLedgerEntry.create({
    data: {
      userId: sale.userId,
      entryType: "SALE_RELEASE",
      eggUnits: sale.eggQuantity,
      description: `Egg-sale ${reason} release ${sale.publicReference}`,
      sourceType: "EGG_SALE",
      sourceId: sale.id,
      idempotencyKey: `sale-release:${sale.id}:${reason}`,
      metadata: {
        publicReference: sale.publicReference,
        reason,
      } satisfies Prisma.InputJsonValue,
    },
  });
  await createAuditLog(
    {
      actorUserId,
      action: "EGG_SALE_RESERVATION_RELEASED",
      entityType: "EggLedgerEntry",
      entityId: entry.id,
      metadata: {
        saleRequestId: sale.id,
        eggUnits: sale.eggQuantity,
        reason,
      } satisfies Prisma.InputJsonValue,
    },
    tx,
  );
  return entry;
}

export async function createSaleFinalizationEntry({
  tx,
  sale,
  actorUserId,
  payoutId,
}: {
  tx: Prisma.TransactionClient;
  sale: Pick<EggSaleRequest, "id" | "userId" | "eggQuantity" | "publicReference">;
  actorUserId: string;
  payoutId: string;
}) {
  const existing = await tx.eggLedgerEntry.findFirst({
    where: {
      sourceType: "EGG_SALE",
      sourceId: sale.id,
      entryType: "SALE_FINALIZED",
    },
  });
  if (existing) return existing;

  const entry = await tx.eggLedgerEntry.create({
    data: {
      userId: sale.userId,
      entryType: "SALE_FINALIZED",
      eggUnits: 0,
      description: `Egg-sale settled ${sale.publicReference}`,
      sourceType: "EGG_SALE",
      sourceId: sale.id,
      idempotencyKey: `sale-finalized:${sale.id}`,
      metadata: {
        publicReference: sale.publicReference,
        eggQuantity: sale.eggQuantity,
        payoutId,
      } satisfies Prisma.InputJsonValue,
    },
  });
  await createAuditLog(
    {
      actorUserId,
      action: "EGG_SALE_FINALIZED",
      entityType: "EggLedgerEntry",
      entityId: entry.id,
      metadata: {
        saleRequestId: sale.id,
        eggUnits: 0,
        lifecycle: "settled",
      } satisfies Prisma.InputJsonValue,
    },
    tx,
  );
  return entry;
}

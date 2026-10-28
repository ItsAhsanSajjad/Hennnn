import type { Prisma, User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { maskPayoutIdentifier } from "@/lib/utilities/phase3";
import { createAuditLog } from "@/server/services/audit";
import { encryptPayoutIdentifier } from "@/server/services/payout-identifier-crypto";

export async function savePayoutMethodForUser({
  user,
  id,
  provider,
  bankName,
  accountTitle,
  accountIdentifier,
  isDefault = true,
}: {
  user: Pick<User, "id">;
  id?: string;
  provider: "EASYPAISA" | "JAZZCASH" | "BANK_TRANSFER" | "OTHER";
  bankName?: string;
  accountTitle: string;
  accountIdentifier: string;
  isDefault?: boolean;
}) {
  const masked = maskPayoutIdentifier(accountIdentifier);

  return prisma.$transaction(async (tx) => {
    const existing = id
      ? await tx.payoutMethod.findFirst({
          where: { id, userId: user.id, archivedAt: null },
          select: { id: true },
        })
      : null;
    if (id && !existing) {
      throw new Error("Payout method was not found.");
    }

    if (isDefault) {
      await tx.payoutMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const data = {
      provider,
      bankName: provider === "BANK_TRANSFER" ? (bankName?.trim() ?? null) : null,
      accountTitle: accountTitle.trim(),
      accountIdentifierProtected: encryptPayoutIdentifier(accountIdentifier),
      accountIdentifierLastFour: masked.lastFour,
      status: "ACTIVE" as const,
      isDefault,
    };

    const method = id
      ? await tx.payoutMethod.update({
          where: { id: existing!.id },
          data,
        })
      : await tx.payoutMethod.create({
          data: {
            userId: user.id,
            ...data,
          },
        });

    await createAuditLog(
      {
        actorUserId: user.id,
        action: id ? "PAYOUT_METHOD_UPDATED" : "PAYOUT_METHOD_CREATED",
        entityType: "PayoutMethod",
        entityId: method.id,
        metadata: {
          provider,
          bankName: method.bankName,
          lastFour: method.accountIdentifierLastFour,
          isDefault: method.isDefault,
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );

    return method;
  });
}

export async function archivePayoutMethodForUser({
  user,
  id,
}: {
  user: Pick<User, "id">;
  id: string;
}) {
  return prisma.$transaction(async (tx) => {
    const method = await tx.payoutMethod.findFirst({
      where: { id, userId: user.id, archivedAt: null },
    });
    if (!method) {
      throw new Error("Payout method was not found.");
    }

    const archived = await tx.payoutMethod.update({
      where: { id: method.id },
      data: { status: "ARCHIVED", archivedAt: new Date(), isDefault: false },
    });
    if (method.isDefault) {
      const replacement = await tx.payoutMethod.findFirst({
        where: { userId: user.id, status: "ACTIVE", archivedAt: null, id: { not: method.id } },
        orderBy: { createdAt: "desc" },
      });
      if (replacement) {
        await tx.payoutMethod.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
    }
    await createAuditLog(
      {
        actorUserId: user.id,
        action: "PAYOUT_METHOD_UPDATED",
        entityType: "PayoutMethod",
        entityId: archived.id,
        metadata: {
          archived: true,
          lastFour: archived.accountIdentifierLastFour,
        } satisfies Prisma.InputJsonValue,
      },
      tx,
    );
    return archived;
  });
}

export async function getDefaultPayoutMethod(userId: string) {
  return prisma.payoutMethod.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      archivedAt: null,
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

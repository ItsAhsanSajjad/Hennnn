import type { AuditAction, Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";

type AuditInput = {
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createAuditLog(input: AuditInput, tx: PrismaExecutor = prisma) {
  return tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

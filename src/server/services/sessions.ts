import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { env } from "@/lib/env/server";
import { createSecureToken, hashToken } from "@/lib/security/tokens";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export async function createSessionRecord(userId: string) {
  const token = createSecureToken(48);
  const sessionToken = hashToken(token);
  const expires = new Date(Date.now() + env.SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  return { token, sessionToken, expires };
}

export async function getSessionByToken(token: string) {
  const session = await prisma.session.findUnique({
    where: {
      sessionToken: hashToken(token),
    },
    include: {
      user: true,
    },
  });

  if (
    !session ||
    !session.user ||
    session.expires <= new Date() ||
    session.user.deletedAt ||
    session.user.status !== "ACTIVE"
  ) {
    if (session) {
      await revokeSessionToken(token);
    }
    return null;
  }

  return session;
}

export async function revokeSessionToken(token: string) {
  await prisma.session.deleteMany({
    where: {
      sessionToken: hashToken(token),
    },
  });
}

export async function revokeAllUserSessions(userId: string, tx: PrismaExecutor = prisma) {
  await tx.session.deleteMany({
    where: { userId },
  });
}

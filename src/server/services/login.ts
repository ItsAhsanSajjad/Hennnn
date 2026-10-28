import type { User } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { verifyPassword } from "@/lib/security/passwords";
import { normalizePakistaniPhone, normalizeUsername } from "@/lib/validation/auth";
import { createAuditLog } from "@/server/services/audit";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type LoginVerificationResult =
  { ok: true; user: User } | { ok: false; message: string; userId?: string };

export async function verifyLoginCredentials(
  identifier: string,
  password: string,
  meta: RequestMeta = {},
): Promise<LoginVerificationResult> {
  const phone = normalizePakistaniPhone(identifier);
  const normalizedIdentifier = phone.ok ? phone.phoneE164 : normalizeUsername(identifier);

  const user = await prisma.user.findFirst({
    where: phone.ok
      ? { phoneE164: phone.phoneE164, deletedAt: null }
      : { usernameNormalized: normalizedIdentifier, deletedAt: null },
  });

  const validPassword = user ? await verifyPassword(user.passwordHash, password) : false;

  if (!user || !validPassword) {
    await createAuditLog({
      actorUserId: user?.id,
      action: "USER_LOGIN_FAILED",
      entityType: "User",
      entityId: user?.id,
      metadata: { reason: "invalid_credentials" },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return {
      ok: false,
      message: "Invalid username, phone number, or password.",
      userId: user?.id,
    };
  }

  if (user.status !== "ACTIVE") {
    await createAuditLog({
      actorUserId: user.id,
      action: "USER_LOGIN_FAILED",
      entityType: "User",
      entityId: user.id,
      metadata: { reason: "account_not_active" },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return {
      ok: false,
      message: "Invalid username, phone number, or password.",
      userId: user.id,
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    actorUserId: user.id,
    action: "USER_LOGIN_SUCCEEDED",
    entityType: "User",
    entityId: user.id,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return { ok: true, user: updatedUser };
}

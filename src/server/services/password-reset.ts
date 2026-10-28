import { addMinutes } from "@/server/services/time";
import { prisma } from "@/lib/database/prisma";
import { env } from "@/lib/env/server";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";
import { createSecureToken, hashToken } from "@/lib/security/tokens";
import { createNotificationProvider } from "@/server/providers/notifications";
import { createAuditLog } from "@/server/services/audit";
import { revokeAllUserSessions } from "@/server/services/sessions";

export async function createPasswordResetToken(
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string },
) {
  const token = createSecureToken(48);
  const tokenHash = hashToken(token);
  const expiresAt = addMinutes(new Date(), env.PASSWORD_RESET_TOKEN_TTL_MINUTES);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, phoneE164: true },
  });
  const provider = createNotificationProvider(env);
  const delivery = user
    ? await provider.sendPasswordReset({
        username: user.username,
        phoneE164: user.phoneE164,
        resetToken: token,
        expiresAt,
      })
    : { ok: false, reason: "user_not_found" };

  await createAuditLog({
    actorUserId: userId,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "PasswordResetToken",
    entityId: undefined,
    metadata: {
      provider: env.NOTIFICATION_PROVIDER,
      deliveryAccepted: delivery.ok,
      deliveryReason: delivery.ok ? undefined : delivery.reason,
    },
    ipAddress: meta?.ipAddress,
    userAgent: meta?.userAgent,
  });

  return {
    token,
    expiresAt,
  };
}

export async function completePasswordReset(
  token: string,
  password: string,
  meta?: { ipAddress?: string; userAgent?: string },
) {
  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return { ok: false as const, message: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
    await revokeAllUserSessions(resetToken.userId, tx);
    await createAuditLog(
      {
        actorUserId: resetToken.userId,
        action: "PASSWORD_RESET_COMPLETED",
        entityType: "User",
        entityId: resetToken.userId,
        metadata: { sessionsInvalidated: true },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
      tx,
    );
  });

  return { ok: true as const };
}

export async function changeCurrentUserPassword({
  userId,
  currentPassword,
  newPassword,
  meta,
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  meta?: { ipAddress?: string; userAgent?: string };
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) {
    return { ok: false as const, message: "Your current password is incorrect." };
  }

  if (await verifyPassword(user.passwordHash, newPassword)) {
    return {
      ok: false as const,
      message: "Choose a new password that is different from the current one.",
    };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await revokeAllUserSessions(userId, tx);
    await createAuditLog(
      {
        actorUserId: userId,
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: userId,
        metadata: { source: "authenticated_settings", sessionsInvalidated: true },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
      tx,
    );
  });

  return { ok: true as const };
}

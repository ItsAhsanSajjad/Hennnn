import type { User, UserRole, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/database/prisma";
import { canManageRole, canManageUsers } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type AdminUserMutationResult =
  { ok: true; message: string } | { ok: false; message: string };

export async function updateUserStatusAsAdmin(
  actor: Pick<User, "id" | "role">,
  userId: string,
  status: UserStatus,
  reason: string,
  meta: RequestMeta = {},
): Promise<AdminUserMutationResult> {
  if (!canManageUsers(actor.role)) {
    return { ok: false, message: "You are not authorized to manage users." };
  }
  if (reason.trim().length < 5) {
    return { ok: false, message: "A reason of at least 5 characters is required." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });

  if (!target) {
    return { ok: false, message: "User not found." };
  }

  if (!canManageRole(actor.role, target.role)) {
    return { ok: false, message: "You are not authorized to change this user's status." };
  }

  if (target.role === "SUPER_ADMIN" && status !== "ACTIVE") {
    const activeSuperAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", status: "ACTIVE", deletedAt: null },
    });

    if (activeSuperAdmins <= 1) {
      return { ok: false, message: "The last active super admin cannot be suspended or disabled." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { status },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: status === "ACTIVE" ? "USER_REACTIVATED" : "USER_SUSPENDED",
        entityType: "User",
        entityId: userId,
        metadata: { previousStatus: target.status, status, reason: reason.trim() },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      tx,
    );
  });

  return { ok: true, message: "User status updated." };
}

export async function updateUserRoleAsAdmin(
  actor: Pick<User, "id" | "role">,
  userId: string,
  role: UserRole,
  reason: string,
  meta: RequestMeta = {},
): Promise<AdminUserMutationResult> {
  if (!canManageUsers(actor.role)) {
    return { ok: false, message: "You are not authorized to manage users." };
  }
  if (reason.trim().length < 5) {
    return { ok: false, message: "A reason of at least 5 characters is required." };
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });

  if (!target) {
    return { ok: false, message: "User not found." };
  }

  if (!canManageRole(actor.role, target.role) || !canManageRole(actor.role, role)) {
    return { ok: false, message: "You are not authorized to assign that role." };
  }

  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const superAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN", deletedAt: null },
    });

    if (superAdmins <= 1) {
      return { ok: false, message: "The last super admin cannot be demoted." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "USER_ROLE_CHANGED",
        entityType: "User",
        entityId: userId,
        metadata: { previousRole: target.role, role, reason: reason.trim() },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      tx,
    );
  });

  return { ok: true, message: "User role updated." };
}

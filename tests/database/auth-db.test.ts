import type { UserRole, UserStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/database/prisma";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";
import { hashToken } from "@/lib/security/tokens";
import { normalizePakistaniPhone, normalizeUsername } from "@/lib/validation/auth";
import { updateUserStatusAsAdmin } from "@/server/services/admin-users";
import { verifyLoginCredentials } from "@/server/services/login";
import {
  changeCurrentUserPassword,
  completePasswordReset,
  createPasswordResetToken,
} from "@/server/services/password-reset";
import { registerUserAccount } from "@/server/services/registration";
import { createSessionRecord, getSessionByToken } from "@/server/services/sessions";

const PASSWORD = "StrongPass123!";
const NEW_PASSWORD = "StrongerPass456!";

let userCounter = 1;
let phoneCounter = 2_000_000;
let referralCounter = 222_222;

function nextUsername(prefix = "user") {
  userCounter += 1;
  return `${prefix}_${userCounter}`;
}

function nextPhone() {
  phoneCounter += 1;
  return `0300${String(phoneCounter).padStart(7, "0")}`;
}

function nextReferralCode() {
  referralCounter += 1;
  return `TEST${referralCounter}`;
}

type TestUserInput = {
  username?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  referralCode?: string;
  deletedAt?: Date | null;
};

async function createTestUser(input: TestUserInput = {}) {
  const username = input.username ?? nextUsername();
  const phone = normalizePakistaniPhone(input.phone ?? nextPhone());

  if (!phone.ok) {
    throw new Error(`Invalid test phone for ${username}`);
  }

  return prisma.user.create({
    data: {
      username,
      usernameNormalized: normalizeUsername(username),
      phoneE164: phone.phoneE164,
      passwordHash: await hashPassword(input.password ?? PASSWORD),
      role: input.role ?? "USER",
      status: input.status ?? "ACTIVE",
      referralCode: input.referralCode ?? nextReferralCode(),
      deletedAt: input.deletedAt,
    },
  });
}

function isTransientConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Server has closed the connection") ||
    message.includes("Connection terminated unexpectedly")
  );
}

async function retryTransientConnection<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientConnectionError(error)) {
      throw error;
    }

    await prisma.$disconnect();
    return operation();
  }
}

describe.sequential("database-backed authentication and account flows", () => {
  it("registers a user with normalized identity, legal records, notification, audit log, and Argon2id hash", async () => {
    const result = await registerUserAccount(
      {
        username: "Farm_One",
        phone: "0300 1234567",
        password: PASSWORD,
      },
      { ipAddress: "127.0.0.1", userAgent: "vitest" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);

    const user = await retryTransientConnection(() =>
      prisma.user.findUniqueOrThrow({ where: { id: result.userId } }),
    );
    const legalAcceptances = await retryTransientConnection(() =>
      prisma.legalAcceptance.findMany({ where: { userId: result.userId } }),
    );
    const notifications = await retryTransientConnection(() =>
      prisma.notification.findMany({ where: { userId: result.userId } }),
    );
    const auditLogs = await retryTransientConnection(() =>
      prisma.auditLog.findMany({ where: { actorUserId: result.userId } }),
    );

    expect(user.usernameNormalized).toBe("farm_one");
    expect(user.phoneE164).toBe("+923001234567");
    expect(user.passwordHash).not.toBe(PASSWORD);
    expect(await verifyPassword(user.passwordHash, PASSWORD)).toBe(true);
    expect(legalAcceptances.map((item) => item.documentType).sort()).toEqual(["PRIVACY", "TERMS"]);
    expect(notifications).toHaveLength(1);
    expect(auditLogs.map((item) => item.action)).toContain("USER_REGISTERED");
  });

  it("rejects duplicate normalized usernames and duplicate normalized Pakistani phone numbers safely", async () => {
    const first = await registerUserAccount({
      username: "Case_User",
      phone: "0300-7654321",
      password: PASSWORD,
    });
    expect(first.ok).toBe(true);

    const duplicateUsername = await registerUserAccount({
      username: "case_user",
      phone: nextPhone(),
      password: PASSWORD,
    });
    expect(duplicateUsername).toMatchObject({
      ok: false,
      fieldErrors: { username: ["This username is already registered."] },
    });

    const duplicatePhone = await registerUserAccount({
      username: nextUsername("phone"),
      phone: "+92 300 7654321",
      password: PASSWORD,
    });
    expect(duplicatePhone).toMatchObject({
      ok: false,
      fieldErrors: { phone: ["This phone number is already registered."] },
    });
  });

  it("stores referral attribution in the registration transaction without creating Phase 1 rewards", async () => {
    await createTestUser({
      username: "inviter_user",
      referralCode: "INVITERPK",
    });
    const inviter = await prisma.user.findUniqueOrThrow({
      where: { referralCode: "INVITERPK" },
    });

    const result = await registerUserAccount(
      {
        username: "invited_user",
        phone: "00923005551234",
        password: PASSWORD,
        referralCode: "inviterpk",
      },
      { ipAddress: "127.0.0.1" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);

    const relationship = await prisma.referralRelationship.findUniqueOrThrow({
      where: { inviteeId: result.userId },
    });
    expect(relationship.inviterId).toBe(inviter.id);
    expect(relationship.sourceCode).toBe("INVITERPK");
    expect(await prisma.referralReward.count()).toBe(0);
    expect(
      await prisma.auditLog.count({
        where: { actorUserId: result.userId, action: "REFERRAL_ATTACHED" },
      }),
    ).toBe(1);
  });

  it("rejects invalid or inactive referral codes before creating a user", async () => {
    const inactiveInviter = await createTestUser({
      status: "SUSPENDED",
      referralCode: "SUSPENDPK",
    });

    const invalidShape = await registerUserAccount({
      username: "bad_ref_shape",
      phone: nextPhone(),
      password: PASSWORD,
      referralCode: "bad code",
    });
    const inactive = await registerUserAccount({
      username: "bad_ref_status",
      phone: nextPhone(),
      password: PASSWORD,
      referralCode: inactiveInviter.referralCode,
    });

    expect(invalidShape.ok).toBe(false);
    expect(inactive.ok).toBe(false);
    expect(await prisma.user.count()).toBe(1);
  });

  it("keeps database constraints active for lower-case usernames, self-referrals, and positive future values", async () => {
    const user = await createTestUser();

    await expect(
      prisma.user.create({
        data: {
          username: "UpperCheck",
          usernameNormalized: "UpperCheck",
          phoneE164: "+923009999991",
          passwordHash: await hashPassword(PASSWORD),
          referralCode: "UPPERCHK",
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.referralRelationship.create({
        data: {
          inviterId: user.id,
          inviteeId: user.id,
          sourceCode: user.referralCode,
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.henPlan.create({
        data: {
          name: "Invalid negative plan",
          code: "INVALID-NEGATIVE",
          slug: "invalid-negative-plan",
          shortDescription: "Constraint fixture for a negative plan.",
          fullDescription: "Constraint fixture for validating negative plan pricing.",
          pricePaisa: BigInt(-1),
          dailyEggUnits: 1,
          maximumEggUnits: 30,
          validityDays: 30,
          termsVersion: "test",
        },
      }),
    ).rejects.toThrow();
  });

  it("uses unique database constraints to protect concurrent duplicate registration", async () => {
    const username = "concurrent_user";
    const phone = "0300 4445556";

    const results = await Promise.allSettled([
      registerUserAccount({ username, phone, password: PASSWORD }),
      registerUserAccount({ username, phone, password: PASSWORD }),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled" && result.value.ok),
    ).toHaveLength(1);
    await prisma.$disconnect();
    const createdUsers = await retryTransientConnection(() =>
      prisma.user.findMany({ where: { usernameNormalized: username }, select: { id: true } }),
    );
    expect(createdUsers).toHaveLength(1);
  });

  it("logs in by case-insensitive username and Pakistani phone formats", async () => {
    const user = await createTestUser({ username: "MiXeD_User", phone: "0300 6007008" });

    const usernameLogin = await verifyLoginCredentials("mixed_user", PASSWORD, {
      ipAddress: "127.0.0.1",
    });
    const phoneLogin = await verifyLoginCredentials("+923006007008", PASSWORD);

    expect(usernameLogin.ok).toBe(true);
    expect(phoneLogin.ok).toBe(true);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({
      lastLoginAt: expect.any(Date),
    });
    expect(
      await prisma.auditLog.count({
        where: { actorUserId: user.id, action: "USER_LOGIN_SUCCEEDED" },
      }),
    ).toBe(2);
  });

  it("uses generic login failures for wrong passwords, suspended, disabled, and deleted users", async () => {
    const active = await createTestUser({ username: "active_login" });
    const suspended = await createTestUser({ username: "suspended_login", status: "SUSPENDED" });
    const disabled = await createTestUser({ username: "disabled_login", status: "DISABLED" });
    await createTestUser({ username: "deleted_login", deletedAt: new Date() });

    const attempts = [];
    for (const [identifier, password] of [
      [active.username, "wrong-password"],
      [suspended.username, PASSWORD],
      [disabled.username, PASSWORD],
      ["deleted_login", PASSWORD],
      ["missing_user", PASSWORD],
    ] as const) {
      attempts.push(await verifyLoginCredentials(identifier, password));
    }

    for (const attempt of attempts) {
      expect(attempt).toMatchObject({
        ok: false,
        message: "Invalid username, phone number, or password.",
      });
    }
    expect(await prisma.auditLog.count({ where: { action: "USER_LOGIN_FAILED" } })).toBe(5);
  });

  it("stores only hashed session tokens and revokes inactive or expired sessions on lookup", async () => {
    const user = await createTestUser();
    const session = await createSessionRecord(user.id);

    expect(session.token).not.toBe(session.sessionToken);
    expect(session.sessionToken).toBe(hashToken(session.token));
    expect(await getSessionByToken(session.token)).toMatchObject({ userId: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { status: "SUSPENDED" } });
    expect(await getSessionByToken(session.token)).toBeNull();
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);

    const expiredToken = "expired-token-fixture";
    await prisma.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken: hashToken(expiredToken),
        expires: new Date(Date.now() - 60_000),
      },
    });
    expect(await getSessionByToken(expiredToken)).toBeNull();
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("invalidates all sessions and updates the password during password reset", async () => {
    const user = await createTestUser();
    await createSessionRecord(user.id);
    await createSessionRecord(user.id);
    const reset = await createPasswordResetToken(user.id, { userAgent: "vitest" });

    const result = await completePasswordReset(reset.token, NEW_PASSWORD, {
      ipAddress: "127.0.0.1",
    });

    expect(result.ok).toBe(true);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword(updated.passwordHash, PASSWORD)).toBe(false);
    expect(await verifyPassword(updated.passwordHash, NEW_PASSWORD)).toBe(true);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    expect(
      await prisma.passwordResetToken.count({ where: { userId: user.id, usedAt: null } }),
    ).toBe(0);
    expect(
      await prisma.auditLog.count({
        where: { actorUserId: user.id, action: "PASSWORD_RESET_COMPLETED" },
      }),
    ).toBe(1);
  });

  it("changes an authenticated password, invalidates sessions, and records an audit event", async () => {
    const user = await createTestUser();
    const session = await createSessionRecord(user.id);

    const rejected = await changeCurrentUserPassword({
      userId: user.id,
      currentPassword: "not-the-password",
      newPassword: NEW_PASSWORD,
      meta: { userAgent: "vitest" },
    });
    expect(rejected.ok).toBe(false);

    const changed = await changeCurrentUserPassword({
      userId: user.id,
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      meta: { userAgent: "vitest" },
    });
    expect(changed.ok).toBe(true);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword(updated.passwordHash, PASSWORD)).toBe(false);
    expect(await verifyPassword(updated.passwordHash, NEW_PASSWORD)).toBe(true);
    expect(await getSessionByToken(session.token)).toBeNull();
    await expect(
      prisma.auditLog.count({ where: { actorUserId: user.id, action: "PASSWORD_CHANGED" } }),
    ).resolves.toBe(1);
  });

  it("prevents suspending the last active super admin but allows the change after another super admin exists", async () => {
    const actor = await createTestUser({ role: "SUPER_ADMIN", username: "root_admin" });

    const blocked = await updateUserStatusAsAdmin(actor, actor.id, "SUSPENDED", "Security review");
    expect(blocked).toMatchObject({
      ok: false,
      message: "The last active super admin cannot be suspended or disabled.",
    });

    await createTestUser({ role: "SUPER_ADMIN", username: "backup_admin" });
    const allowed = await updateUserStatusAsAdmin(actor, actor.id, "SUSPENDED", "Security review");

    expect(allowed).toMatchObject({ ok: true });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: actor.id } })).toMatchObject({
      status: "SUSPENDED",
    });
    expect(
      await prisma.auditLog.count({ where: { actorUserId: actor.id, action: "USER_SUSPENDED" } }),
    ).toBe(1);
  });

  it("blocks non-admin actors from direct admin status mutations", async () => {
    const actor = await createTestUser({ role: "USER" });
    const target = await createTestUser({ username: "target_user" });

    const result = await updateUserStatusAsAdmin(actor, target.id, "SUSPENDED", "Security review");

    expect(result).toMatchObject({
      ok: false,
      message: "You are not authorized to manage users.",
    });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: target.id } })).toMatchObject({
      status: "ACTIVE",
    });
  });

  it("prevents an operations admin from changing a super admin account status", async () => {
    const actor = await createTestUser({ role: "ADMIN", username: "operations_admin" });
    const target = await createTestUser({ role: "SUPER_ADMIN", username: "protected_root" });

    const result = await updateUserStatusAsAdmin(actor, target.id, "SUSPENDED", "Security review");

    expect(result).toMatchObject({
      ok: false,
      message: "You are not authorized to change this user's status.",
    });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: target.id } })).toMatchObject({
      status: "ACTIVE",
    });
    expect(
      await prisma.auditLog.count({ where: { actorUserId: actor.id, entityId: target.id } }),
    ).toBe(0);
  });
});

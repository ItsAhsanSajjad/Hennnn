import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env/server";
import {
  ADMIN_PERMISSIONS,
  canAccessAdmin,
  canAccessOperations,
  hasAdminPermission,
  isActiveStatus,
} from "@/server/policies/authorization";
import type { AdminPermission } from "@/server/policies/authorization";
import type { UserRole } from "@prisma/client";
import {
  createSessionRecord,
  getSessionByToken,
  revokeSessionToken,
} from "@/server/services/sessions";

export const SESSION_COOKIE_NAME = "pakhen_session";
export const REFERRAL_COOKIE_NAME = "pakhen_referral";
export const useSecureCookies = new URL(env.APP_URL).protocol === "https:";

type UserRequirementOptions = {
  callbackUrl?: string;
  parameter?: "callbackUrl" | "next";
  signInPath?: "/sign-in" | "/admin-login";
};

export function getSafePostLoginPath(value: unknown) {
  if (typeof value !== "string") return null;

  const candidate = value.trim();
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("://")
  ) {
    return null;
  }

  return candidate;
}

export async function createUserSession(userId: string) {
  const session = await createSessionRecord(userId);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies,
    path: "/",
    expires: session.expires,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSessionToken(token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const session = await getSessionByToken(token);

    if (!session) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function requireUser({
  callbackUrl = "/dashboard",
  parameter = "next",
  signInPath = "/sign-in",
}: UserRequirementOptions = {}) {
  const session = await getCurrentSession();

  if (!session) {
    const safeCallbackUrl = getSafePostLoginPath(callbackUrl) ?? "/dashboard";
    redirect(`${signInPath}?${parameter}=${encodeURIComponent(safeCallbackUrl)}`);
  }

  if (!isActiveStatus(session.user.status)) {
    redirect("/access-denied");
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser({
    callbackUrl: "/admin",
    parameter: "callbackUrl",
    signInPath: "/admin-login",
  });

  if (!canAccessAdmin(user.role)) {
    redirect("/access-denied");
  }

  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser({
    callbackUrl: "/admin",
    parameter: "callbackUrl",
    signInPath: "/admin-login",
  });

  if (!roles.includes(user.role)) {
    redirect("/access-denied");
  }

  return user;
}

export async function requireOperationsUser() {
  const user = await requireUser({
    callbackUrl: "/admin",
    parameter: "callbackUrl",
    signInPath: "/admin-login",
  });

  if (!canAccessOperations(user.role)) {
    redirect("/access-denied");
  }

  return user;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const user = await requireOperationsUser();

  if (!hasAdminPermission(user.role, permission)) {
    redirect("/access-denied");
  }

  return user;
}

export const requirePermission = requireAdminPermission;

export async function requireAdminConsoleUser() {
  return requireAdminPermission(ADMIN_PERMISSIONS.CONSOLE_ACCESS);
}

export async function setReferralCookie(code: string) {
  const cookieStore = await cookies();
  cookieStore.set(REFERRAL_COOKIE_NAME, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getReferralCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(REFERRAL_COOKIE_NAME)?.value ?? "";
}

export async function clearReferralCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(REFERRAL_COOKIE_NAME);
}

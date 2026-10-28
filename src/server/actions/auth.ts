"use server";

import { redirect } from "next/navigation";

import {
  clearReferralCookie,
  clearUserSession,
  createUserSession,
  getSafePostLoginPath,
  requireUser,
} from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { env } from "@/lib/env/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  forgotPasswordSchema,
  changePasswordSchema,
  normalizePakistaniPhone,
  normalizeUsername,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";
import { createAuditLog } from "@/server/services/audit";
import {
  changeCurrentUserPassword,
  completePasswordReset,
  createPasswordResetToken,
} from "@/server/services/password-reset";
import { getRequestMeta } from "@/server/request-meta";
import { formError, formRedirect, formSuccess, type ActionState } from "@/server/actions/types";
import { registerUserAccount } from "@/server/services/registration";
import { verifyLoginCredentials } from "@/server/services/login";
import { canAccessOperations } from "@/server/policies/authorization";

function toObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function getRateLimited(key: string, limit: number, windowMs: number, cooldownMs?: number) {
  if (!env.RATE_LIMIT_ENABLED) {
    return null;
  }

  const result = checkRateLimit(key, { limit, windowMs, cooldownMs });
  return result.allowed ? null : result.retryAfterSeconds;
}

const REGISTRATION_LIMIT = {
  limit: 20,
  windowMs: 15 * 60_000,
  cooldownMs: 15 * 60_000,
};

export async function registerAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const meta = await getRequestMeta();
  const ipKey = meta.ipAddress ?? "unknown";
  const retryAfter = getRateLimited(
    `register:${ipKey}`,
    REGISTRATION_LIMIT.limit,
    REGISTRATION_LIMIT.windowMs,
    REGISTRATION_LIMIT.cooldownMs,
  );

  if (retryAfter) {
    return formError(`Too many registration attempts. Try again in ${retryAfter} seconds.`);
  }

  const parsed = signUpSchema.safeParse(toObject(formData));
  if (!parsed.success) {
    return formError("Please correct the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const registration = await registerUserAccount(parsed.data, meta);

  if (!registration.ok) {
    return formError(registration.message, registration.fieldErrors);
  }

  await clearReferralCookie();
  // New accounts are created ACTIVE, so sign the user straight in and hand the
  // dashboard path back to the client. The client then saves the credential for
  // one-tap access and finishes with a real navigation (no "sign in" detour).
  await createUserSession(registration.userId);
  return formRedirect("/dashboard");
}

type LoginPortal = "customer" | "admin";

async function signInForPortal(formData: FormData, portal: LoginPortal): Promise<ActionState> {
  const meta = await getRequestMeta();
  const parsed = signInSchema.safeParse(toObject(formData));

  if (!parsed.success) {
    return formError("Please correct the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const identifier = parsed.data.identifier;
  const phone = normalizePakistaniPhone(identifier);
  const normalizedIdentifier = phone.ok ? phone.phoneE164 : normalizeUsername(identifier);
  const retryAfter = getRateLimited(
    `${portal}-login:${meta.ipAddress ?? "unknown"}:${normalizedIdentifier}`,
    8,
    10 * 60_000,
    10 * 60_000,
  );

  if (retryAfter) {
    return formError(`Too many login attempts. Try again in ${retryAfter} seconds.`);
  }

  const login = await verifyLoginCredentials(identifier, parsed.data.password, meta);
  if (!login.ok) {
    return formError(login.message);
  }

  const hasAdminAccess = canAccessOperations(login.user.role);
  if (portal === "admin" && !hasAdminAccess) {
    return formError("This account does not have administrator access.");
  }
  if (portal === "customer" && hasAdminAccess) {
    return formError("Use the administrator sign-in page to access this account.");
  }

  await createUserSession(login.user.id);

  const requestedPath =
    getSafePostLoginPath(formData.get("callbackUrl")) ?? getSafePostLoginPath(formData.get("next"));
  const callbackUrl =
    portal === "admin"
      ? requestedPath?.startsWith("/admin")
        ? requestedPath
        : "/admin"
      : requestedPath?.startsWith("/admin")
        ? "/dashboard"
        : (requestedPath ?? "/dashboard");

  // Return the safe path so the client can finish with a real navigation. That
  // navigation (plus the Credential Management API) is what lets the browser
  // offer to save the password for one-tap sign-in next time.
  return formRedirect(callbackUrl);
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  return signInForPortal(formData, "customer");
}

export async function adminLoginAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return signInForPortal(formData, "admin");
}

export async function logoutAction(formData: FormData) {
  const meta = await getRequestMeta();
  await clearUserSession();
  await createAuditLog({
    action: "USER_LOGGED_OUT",
    entityType: "Session",
    metadata: { source: "server_action" },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });
  const portal = String(formData.get("portal") ?? "");
  redirect(portal === "admin" ? "/admin-login?signedOut=1" : "/sign-in?signedOut=1");
}

export async function forgotPasswordAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const meta = await getRequestMeta();
  const parsed = forgotPasswordSchema.safeParse(toObject(formData));

  if (!parsed.success) {
    return formError("Please correct the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const phone = normalizePakistaniPhone(parsed.data.identifier);
  const normalizedIdentifier = phone.ok
    ? phone.phoneE164
    : normalizeUsername(parsed.data.identifier);
  const retryAfter = getRateLimited(
    `password-reset:${meta.ipAddress ?? "unknown"}:${normalizedIdentifier}`,
    5,
    30 * 60_000,
    30 * 60_000,
  );

  if (retryAfter) {
    return formError(`Too many password reset attempts. Try again in ${retryAfter} seconds.`);
  }

  const user = await prisma.user.findFirst({
    where: phone.ok
      ? { phoneE164: phone.phoneE164, deletedAt: null }
      : { usernameNormalized: normalizedIdentifier, deletedAt: null },
  });

  if (user?.status === "ACTIVE") {
    await createPasswordResetToken(user.id, meta);
  }

  return formSuccess(
    "If an active account matches the information provided, reset instructions will be sent through the configured provider.",
  );
}

export async function resetPasswordAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const meta = await getRequestMeta();
  const parsed = resetPasswordSchema.safeParse(toObject(formData));

  if (!parsed.success) {
    return formError("Please correct the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const result = await completePasswordReset(parsed.data.token, parsed.data.password, meta);

  if (!result.ok) {
    return formError(result.message);
  }

  redirect("/sign-in?reset=1");
}

export async function changeOwnPasswordAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser({
    callbackUrl: "/admin/settings",
    parameter: "callbackUrl",
    signInPath: "/admin-login",
  });
  const parsed = changePasswordSchema.safeParse(toObject(formData));

  if (!parsed.success) {
    return formError("Please correct the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const meta = await getRequestMeta();
  const retryAfter = getRateLimited(
    `password-change:${meta.ipAddress ?? "unknown"}:${user.id}`,
    5,
    10 * 60_000,
    10 * 60_000,
  );
  if (retryAfter) {
    return formError(`Too many password-change attempts. Try again in ${retryAfter} seconds.`);
  }

  const result = await changeCurrentUserPassword({
    userId: user.id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
    meta,
  });
  if (!result.ok) {
    return formError(result.message);
  }

  await clearUserSession();
  await createUserSession(user.id);
  return formSuccess("Password changed. Other active sessions have been signed out.");
}

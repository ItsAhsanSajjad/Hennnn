import { describe, expect, it, vi } from "vitest";

import { createRateLimitProvider } from "@/server/providers/rate-limit";
import { createNotificationProvider } from "@/server/providers/notifications";
import { createStorageProvider } from "@/server/providers/storage";
import type { ServerEnv } from "@/lib/env/server";

const baseEnv: ServerEnv = {
  NODE_ENV: "development",
  APP_NAME: "PakHen",
  APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://pakhen:secret@localhost:5432/pakhen",
  DIRECT_DATABASE_URL: undefined,
  AUTH_SECRET: "development-auth-secret-change-before-production",
  AUTH_TRUST_HOST: true,
  PASSWORD_RESET_TOKEN_TTL_MINUTES: 30,
  SESSION_MAX_AGE_SECONDS: 2_592_000,
  RATE_LIMIT_ENABLED: true,
  RATE_LIMIT_PROVIDER: "memory",
  REDIS_URL: undefined,
  REDIS_TOKEN: undefined,
  NOTIFICATION_PROVIDER: "development",
  SMS_API_URL: undefined,
  SMS_API_KEY: undefined,
  SMS_SENDER_ID: undefined,
  EMAIL_FROM: undefined,
  EMAIL_PROVIDER_API_KEY: undefined,
  ALLOW_DEVELOPMENT_RESET_TOKEN_LOG: false,
  STORAGE_PROVIDER: "disabled",
  STORAGE_ENDPOINT: undefined,
  STORAGE_REGION: undefined,
  STORAGE_BUCKET: undefined,
  STORAGE_ACCESS_KEY: undefined,
  STORAGE_SECRET_KEY: undefined,
  PRIVATE_STORAGE_DIR: ".private-storage",
  PAYMENT_PROOF_MAX_BYTES: 3_145_728,
  EGG_ACCRUAL_JOB_SECRET: undefined,
  PRODUCT_MODE: "DEMO",
  PAYBOST_PUBLIC_KEY: undefined,
  PAYBOST_SECRET_KEY: undefined,
  PAYBOST_SANDBOX: true,
  PAYBOST_SITE_LOGO_URL: undefined,
};

describe("provider readiness", () => {
  it("allows memory rate limiting outside production and blocks it in production", () => {
    expect(createRateLimitProvider(baseEnv).validateReadiness().ok).toBe(true);
    expect(
      createRateLimitProvider({
        ...baseEnv,
        NODE_ENV: "production",
        PRODUCT_MODE: "PRODUCTION",
      }).validateReadiness().ok,
    ).toBe(false);
  });

  it("requires Redis URL for Redis rate limiting", () => {
    expect(
      createRateLimitProvider({
        ...baseEnv,
        RATE_LIMIT_PROVIDER: "redis",
      }).validateReadiness().ok,
    ).toBe(false);
    expect(
      createRateLimitProvider({
        ...baseEnv,
        RATE_LIMIT_PROVIDER: "redis",
        REDIS_URL: "rediss://redis.example.com:6379",
      }).validateReadiness().ok,
    ).toBe(true);
  });

  it("redacts development password-reset token output by default", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const provider = createNotificationProvider(baseEnv);

    await provider.sendPasswordReset({
      username: "demo_user",
      phoneE164: "+92300000002",
      resetToken: "raw-reset-token-that-must-not-be-logged",
      expiresAt: new Date("2026-07-13T00:00:00.000Z"),
    });

    const payload = JSON.stringify(info.mock.calls);
    expect(payload).toContain("raw-re...redacted");
    expect(payload).not.toContain("raw-reset-token-that-must-not-be-logged");
    info.mockRestore();
  });

  it("blocks local storage in production mode", () => {
    expect(
      createStorageProvider({ ...baseEnv, STORAGE_PROVIDER: "disabled" }).validateReadiness().ok,
    ).toBe(true);
    expect(
      createStorageProvider({
        ...baseEnv,
        NODE_ENV: "production",
        PRODUCT_MODE: "PRODUCTION",
        STORAGE_PROVIDER: "local",
      }).validateReadiness().ok,
    ).toBe(false);
  });
});

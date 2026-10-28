import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env/server";

describe("environment validation", () => {
  it("parses safe development defaults", () => {
    const parsed = parseServerEnv({
      DATABASE_URL: "postgresql://pakhen:pakhen_dev_password@localhost:5432/pakhen_dev",
    });
    expect(parsed.APP_NAME).toBe("GrowMeta Egg");
    expect(parsed.PRODUCT_MODE).toBe("DEMO");
  });

  it("rejects missing database configuration", () => {
    expect(() => parseServerEnv({})).toThrow();
  });

  it("rejects unsafe launch-mode defaults", () => {
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "postgresql://pakhen:pakhen_dev_password@localhost:5432/pakhen_dev",
        PRODUCT_MODE: "PRODUCTION",
        AUTH_SECRET: "development-auth-secret-change-before-production",
      }),
    ).toThrow();
  });

  it("rejects in-memory rate limiting in launch mode", () => {
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "postgresql://pakhen:pakhen_dev_password@localhost:5432/pakhen_dev",
        NODE_ENV: "production",
        APP_URL: "https://app.example.com",
        NEXT_PUBLIC_APP_URL: "https://app.example.com",
        PRODUCT_MODE: "PRODUCTION",
        AUTH_SECRET: "launch-secret-value-with-enough-length-123",
        RATE_LIMIT_PROVIDER: "memory",
        NOTIFICATION_PROVIDER: "sms",
        SMS_API_URL: "https://sms.example.com",
        SMS_API_KEY: "test-key",
        SMS_SENDER_ID: "PakHen",
      }),
    ).toThrow();
  });

  it("accepts structurally complete production configuration", () => {
    const parsed = parseServerEnv({
      NODE_ENV: "production",
      APP_URL: "https://app.example.com",
      NEXT_PUBLIC_APP_URL: "https://app.example.com",
      DATABASE_URL: "postgresql://pakhen:secret@db.example.com:5432/pakhen",
      PRODUCT_MODE: "PRODUCTION",
      AUTH_SECRET: "launch-secret-value-with-enough-length-123",
      PAYOUT_ACCOUNT_ENCRYPTION_KEY: "separate-payout-key-with-enough-length-123",
      RATE_LIMIT_PROVIDER: "redis",
      REDIS_URL: "rediss://redis.example.com:6379",
      NOTIFICATION_PROVIDER: "email",
      EMAIL_FROM: "support@example.com",
      EMAIL_PROVIDER_API_KEY: "provider-secret",
      STORAGE_PROVIDER: "disabled",
      EGG_ACCRUAL_JOB_SECRET: "launch-job-secret-with-enough-length-123",
    });

    expect(parsed.PRODUCT_MODE).toBe("PRODUCTION");
    expect(parsed.RATE_LIMIT_PROVIDER).toBe("redis");
  });

  it("rejects production local URLs and development notification provider", () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: "production",
        APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        DATABASE_URL: "postgresql://pakhen:secret@localhost:5432/pakhen",
        PRODUCT_MODE: "PRODUCTION",
        AUTH_SECRET: "launch-secret-value-with-enough-length-123",
        RATE_LIMIT_PROVIDER: "redis",
        REDIS_URL: "rediss://redis.example.com:6379",
        NOTIFICATION_PROVIDER: "development",
      }),
    ).toThrow();
  });
});

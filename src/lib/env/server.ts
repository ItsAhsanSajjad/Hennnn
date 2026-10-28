import { z } from "zod";

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((value) => (typeof value === "boolean" ? value : value.toLowerCase() === "true"));

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_NAME: z.string().default("GrowMeta Egg"),
    APP_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
    DIRECT_DATABASE_URL: z.string().optional(),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).optional(),
    AUTH_SECRET: z.string().min(32).default("development-auth-secret-change-before-production"),
    PAYOUT_ACCOUNT_ENCRYPTION_KEY: z.string().min(32).optional(),
    AUTH_TRUST_HOST: boolish.default(true),
    PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
    SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(2_592_000),
    RATE_LIMIT_ENABLED: boolish.default(true),
    RATE_LIMIT_PROVIDER: z.enum(["memory", "redis"]).default("memory"),
    REDIS_URL: z.string().optional(),
    REDIS_TOKEN: z.string().optional(),
    NOTIFICATION_PROVIDER: z.enum(["development", "sms", "email"]).default("development"),
    SMS_API_URL: z.string().optional(),
    SMS_API_KEY: z.string().optional(),
    SMS_SENDER_ID: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    EMAIL_PROVIDER_API_KEY: z.string().optional(),
    ALLOW_DEVELOPMENT_RESET_TOKEN_LOG: boolish.default(false),
    STORAGE_PROVIDER: z.enum(["disabled", "local", "s3"]).default("disabled"),
    STORAGE_ENDPOINT: z.string().optional(),
    STORAGE_REGION: z.string().optional(),
    STORAGE_BUCKET: z.string().optional(),
    STORAGE_ACCESS_KEY: z.string().optional(),
    STORAGE_SECRET_KEY: z.string().optional(),
    PRIVATE_STORAGE_DIR: z.string().default(".private-storage"),
    PAYMENT_PROOF_MAX_BYTES: z.coerce.number().int().positive().default(5_242_880),
    EGG_ACCRUAL_JOB_SECRET: z.string().optional(),
    PRODUCT_MODE: z.enum(["DEVELOPMENT", "DEMO", "TEST", "PRODUCTION"]).default("DEMO"),
    PAYBOST_PUBLIC_KEY: z.string().optional(),
    PAYBOST_SECRET_KEY: z.string().optional(),
    PAYBOST_SANDBOX: boolish.default(true),
    PAYBOST_SITE_LOGO_URL: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const isProduction = value.PRODUCT_MODE === "PRODUCTION";

    if (isProduction && value.NODE_ENV !== "production") {
      ctx.addIssue({
        code: "custom",
        path: ["NODE_ENV"],
        message: "Production product mode requires NODE_ENV=production.",
      });
    }

    if (isProduction && !value.APP_URL.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["APP_URL"],
        message: "Production APP_URL must use HTTPS.",
      });
    }

    if (isProduction && !value.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_APP_URL"],
        message: "Production NEXT_PUBLIC_APP_URL must use HTTPS.",
      });
    }

    if (value.RATE_LIMIT_PROVIDER === "redis" && !value.REDIS_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["REDIS_URL"],
        message: "REDIS_URL is required when RATE_LIMIT_PROVIDER=redis.",
      });
    }

    if (value.NOTIFICATION_PROVIDER === "sms") {
      if (!value.SMS_API_URL || !value.SMS_API_KEY || !value.SMS_SENDER_ID) {
        ctx.addIssue({
          code: "custom",
          path: ["NOTIFICATION_PROVIDER"],
          message:
            "SMS notification provider requires SMS_API_URL, SMS_API_KEY, and SMS_SENDER_ID.",
        });
      }
    }

    if (value.NOTIFICATION_PROVIDER === "email") {
      if (!value.EMAIL_FROM || !value.EMAIL_PROVIDER_API_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["NOTIFICATION_PROVIDER"],
          message: "Email notification provider requires EMAIL_FROM and EMAIL_PROVIDER_API_KEY.",
        });
      }
    }

    if (value.STORAGE_PROVIDER === "s3") {
      if (
        !value.STORAGE_REGION ||
        !value.STORAGE_BUCKET ||
        !value.STORAGE_ACCESS_KEY ||
        !value.STORAGE_SECRET_KEY
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["STORAGE_PROVIDER"],
          message: "S3 storage requires region, bucket, access key, and secret key.",
        });
      }
    }

    if (value.PRODUCT_MODE === "PRODUCTION") {
      if (value.AUTH_SECRET === "development-auth-secret-change-before-production") {
        ctx.addIssue({
          code: "custom",
          path: ["AUTH_SECRET"],
          message: "AUTH_SECRET must be unique in production.",
        });
      }
      if (
        !value.PAYOUT_ACCOUNT_ENCRYPTION_KEY ||
        value.PAYOUT_ACCOUNT_ENCRYPTION_KEY === value.AUTH_SECRET
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["PAYOUT_ACCOUNT_ENCRYPTION_KEY"],
          message: "Production launch mode requires a unique payout-account encryption key.",
        });
      }
      if (
        value.NOTIFICATION_PROVIDER === "development" ||
        value.ALLOW_DEVELOPMENT_RESET_TOKEN_LOG
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["NOTIFICATION_PROVIDER"],
          message: "Production launch mode requires a production notification provider.",
        });
      }
      if (value.RATE_LIMIT_ENABLED && value.RATE_LIMIT_PROVIDER === "memory") {
        ctx.addIssue({
          code: "custom",
          path: ["RATE_LIMIT_PROVIDER"],
          message: "Production launch mode requires a distributed rate-limit provider.",
        });
      }
      if (value.STORAGE_PROVIDER === "local") {
        ctx.addIssue({
          code: "custom",
          path: ["STORAGE_PROVIDER"],
          message: "Production launch mode cannot use local filesystem storage.",
        });
      }
      if (!value.EGG_ACCRUAL_JOB_SECRET || value.EGG_ACCRUAL_JOB_SECRET.length < 32) {
        ctx.addIssue({
          code: "custom",
          path: ["EGG_ACCRUAL_JOB_SECRET"],
          message: "Production launch mode requires a unique egg accrual job secret.",
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

export function parseServerEnv(input: Partial<NodeJS.ProcessEnv> = process.env): ServerEnv {
  return envSchema.parse(input);
}

export const env = parseServerEnv();

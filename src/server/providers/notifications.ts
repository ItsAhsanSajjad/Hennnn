import type { ServerEnv } from "@/lib/env/server";

type PasswordResetPayload = {
  username: string;
  phoneE164?: string | null;
  resetToken: string;
  expiresAt: Date;
};

type NotificationReadiness = {
  ok: boolean;
  provider: ServerEnv["NOTIFICATION_PROVIDER"];
  reason?: string;
};

export interface NotificationProvider {
  readonly name: ServerEnv["NOTIFICATION_PROVIDER"];
  validateReadiness(): NotificationReadiness;
  sendPasswordReset(payload: PasswordResetPayload): Promise<{ ok: boolean; reason?: string }>;
}

class DevelopmentNotificationProvider implements NotificationProvider {
  readonly name = "development" as const;

  constructor(
    private readonly env: Pick<
      ServerEnv,
      "PRODUCT_MODE" | "ALLOW_DEVELOPMENT_RESET_TOKEN_LOG" | "NEXT_PUBLIC_APP_URL"
    >,
  ) {}

  validateReadiness(): NotificationReadiness {
    if (this.env.PRODUCT_MODE === "PRODUCTION") {
      return {
        ok: false,
        provider: this.name,
        reason: "Development notifications cannot run in production.",
      };
    }

    return { ok: true, provider: this.name };
  }

  async sendPasswordReset(payload: PasswordResetPayload) {
    const tokenHint = this.env.ALLOW_DEVELOPMENT_RESET_TOKEN_LOG
      ? payload.resetToken
      : `${payload.resetToken.slice(0, 6)}...redacted`;

    console.info("[development notification] password reset prepared", {
      username: payload.username,
      expiresAt: payload.expiresAt.toISOString(),
      resetUrl: `${this.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      tokenHint,
    });

    return { ok: true };
  }
}

class SmsNotificationProvider implements NotificationProvider {
  readonly name = "sms" as const;

  constructor(
    private readonly env: Pick<ServerEnv, "SMS_API_URL" | "SMS_API_KEY" | "SMS_SENDER_ID">,
  ) {}

  validateReadiness(): NotificationReadiness {
    if (!this.env.SMS_API_URL || !this.env.SMS_API_KEY || !this.env.SMS_SENDER_ID) {
      return {
        ok: false,
        provider: this.name,
        reason: "SMS provider credentials are incomplete.",
      };
    }

    return { ok: true, provider: this.name };
  }

  async sendPasswordReset() {
    return {
      ok: false,
      reason: "SMS delivery adapter is not wired to a vendor in Phase 1.",
    };
  }
}

class EmailNotificationProvider implements NotificationProvider {
  readonly name = "email" as const;

  constructor(private readonly env: Pick<ServerEnv, "EMAIL_FROM" | "EMAIL_PROVIDER_API_KEY">) {}

  validateReadiness(): NotificationReadiness {
    if (!this.env.EMAIL_FROM || !this.env.EMAIL_PROVIDER_API_KEY) {
      return {
        ok: false,
        provider: this.name,
        reason: "Email provider credentials are incomplete.",
      };
    }

    return { ok: true, provider: this.name };
  }

  async sendPasswordReset() {
    return {
      ok: false,
      reason: "Email delivery adapter is not wired to a vendor in Phase 1.",
    };
  }
}

export function createNotificationProvider(env: ServerEnv): NotificationProvider {
  if (env.NOTIFICATION_PROVIDER === "sms") {
    return new SmsNotificationProvider(env);
  }

  if (env.NOTIFICATION_PROVIDER === "email") {
    return new EmailNotificationProvider(env);
  }

  return new DevelopmentNotificationProvider(env);
}

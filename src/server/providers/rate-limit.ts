import type { ServerEnv } from "@/lib/env/server";

export type RateLimitProviderName = "memory" | "redis";

export type RateLimitReadiness = {
  ok: boolean;
  provider: RateLimitProviderName;
  reason?: string;
};

export interface RateLimitProvider {
  readonly name: RateLimitProviderName;
  validateReadiness(): RateLimitReadiness;
}

export class MemoryRateLimitProvider implements RateLimitProvider {
  readonly name = "memory" as const;

  constructor(private readonly env: Pick<ServerEnv, "PRODUCT_MODE">) {}

  validateReadiness(): RateLimitReadiness {
    if (this.env.PRODUCT_MODE === "PRODUCTION") {
      return {
        ok: false,
        provider: this.name,
        reason: "Memory rate limiting is single-process only and cannot be used for production.",
      };
    }

    return { ok: true, provider: this.name };
  }
}

export class RedisRateLimitProvider implements RateLimitProvider {
  readonly name = "redis" as const;

  constructor(private readonly env: Pick<ServerEnv, "REDIS_URL">) {}

  validateReadiness(): RateLimitReadiness {
    if (!this.env.REDIS_URL) {
      return {
        ok: false,
        provider: this.name,
        reason: "REDIS_URL is required for Redis-backed rate limiting.",
      };
    }

    return { ok: true, provider: this.name };
  }
}

export function createRateLimitProvider(env: ServerEnv): RateLimitProvider {
  if (env.RATE_LIMIT_PROVIDER === "redis") {
    return new RedisRateLimitProvider(env);
  }

  return new MemoryRateLimitProvider(env);
}

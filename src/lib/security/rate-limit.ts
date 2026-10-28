type RateLimitOptions = {
  limit: number;
  windowMs: number;
  cooldownMs?: number;
};

type Bucket = {
  count: number;
  resetAt: number;
  blockedUntil?: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.blockedUntil - now) / 1000),
    };
  }

  const bucket =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + options.windowMs,
        };

  bucket.count += 1;

  if (bucket.count > options.limit) {
    bucket.blockedUntil = now + (options.cooldownMs ?? options.windowMs);
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(((bucket.blockedUntil ?? bucket.resetAt) - now) / 1000),
    };
  }

  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimitsForTests() {
  buckets.clear();
}

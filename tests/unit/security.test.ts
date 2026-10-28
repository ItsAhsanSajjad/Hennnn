import { describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimitsForTests } from "@/lib/security/rate-limit";
import { createSecureToken, hashToken, safeEqual } from "@/lib/security/tokens";

describe("security utilities", () => {
  it("creates high-entropy session tokens and stable non-reversible hashes", () => {
    const token = createSecureToken(48);
    const secondToken = createSecureToken(48);
    const hash = hashToken(token);

    expect(token).not.toBe(secondToken);
    expect(token.length).toBeGreaterThan(40);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(token);
    expect(hashToken(token)).toBe(hash);
  });

  it("compares equal-length secrets with timing-safe equality", () => {
    expect(safeEqual("same-secret", "same-secret")).toBe(true);
    expect(safeEqual("same-secret", "other-value")).toBe(false);
    expect(safeEqual("short", "longer")).toBe(false);
  });

  it("enforces in-memory rate limits and can reset test state", () => {
    resetRateLimitsForTests();

    expect(checkRateLimit("login:+923001234567", { limit: 2, windowMs: 60_000 }).allowed).toBe(
      true,
    );
    expect(checkRateLimit("login:+923001234567", { limit: 2, windowMs: 60_000 }).allowed).toBe(
      true,
    );
    expect(
      checkRateLimit("login:+923001234567", {
        limit: 2,
        windowMs: 60_000,
        cooldownMs: 60_000,
      }).allowed,
    ).toBe(false);

    resetRateLimitsForTests();
    expect(checkRateLimit("login:+923001234567", { limit: 2, windowMs: 60_000 }).allowed).toBe(
      true,
    );
  });
});

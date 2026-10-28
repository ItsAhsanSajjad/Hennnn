import { describe, expect, it } from "vitest";

import {
  generateReferralCode,
  isReferralCodeShape,
  normalizeReferralCode,
} from "@/lib/validation/referrals";

describe("referral utilities", () => {
  it("normalizes referral codes", () => {
    expect(normalizeReferralCode("  abc123  ")).toBe("ABC123");
  });

  it("generates referral codes with safe characters", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(10);
    expect(isReferralCodeShape(code)).toBe(true);
  });

  it("rejects malformed referral codes", () => {
    expect(isReferralCodeShape("bad code")).toBe(false);
    expect(isReferralCodeShape("abc")).toBe(false);
  });
});

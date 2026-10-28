import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  normalizePakistaniPhone,
  normalizeUsername,
  signUpSchema,
  validatePassword,
  validateUsername,
} from "@/lib/validation/auth";

describe("auth validation", () => {
  it("normalizes usernames case-insensitively", () => {
    expect(normalizeUsername("  Demo_User  ")).toBe("demo_user");
  });

  it("rejects reserved usernames", () => {
    expect(validateUsername("admin").ok).toBe(false);
    expect(validateUsername("PakHen").ok).toBe(false);
  });

  it("accepts allowed usernames", () => {
    const result = validateUsername("farmer_2026");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.normalized).toBe("farmer_2026");
  });

  it("normalizes common Pakistani mobile formats", () => {
    expect(normalizePakistaniPhone("0300 1234567")).toEqual({
      ok: true,
      phoneE164: "+923001234567",
    });
    expect(normalizePakistaniPhone("+92 300 1234567")).toEqual({
      ok: true,
      phoneE164: "+923001234567",
    });
    expect(normalizePakistaniPhone("923001234567")).toEqual({
      ok: true,
      phoneE164: "+923001234567",
    });
    expect(normalizePakistaniPhone("00923001234567")).toEqual({
      ok: true,
      phoneE164: "+923001234567",
    });
  });

  it("rejects invalid Pakistani phone numbers", () => {
    expect(normalizePakistaniPhone("021 1234567").ok).toBe(false);
    expect(normalizePakistaniPhone("123").ok).toBe(false);
    expect(normalizePakistaniPhone("+91 300 1234567").ok).toBe(false);
    expect(normalizePakistaniPhone("0300 abcdefg").ok).toBe(false);
  });

  it("enforces password length boundaries", () => {
    expect(validatePassword("a").ok).toBe(false);
    expect(validatePassword("ab").ok).toBe(true);
    expect(validatePassword("a".repeat(20)).ok).toBe(true);
    expect(validatePassword("a".repeat(21)).ok).toBe(false);
  });

  it("validates an authenticated password change", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "CurrentPass123!",
        newPassword: "UpdatedPass456!",
        confirmPassword: "UpdatedPass456!",
      }).success,
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "CurrentPass123!",
        newPassword: "short",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("accepts sign-up without explicit consent checkboxes", () => {
    const result = signUpSchema.safeParse({
      username: "farmer_2026",
      phone: "0300 1234567",
      password: "demo12",
      confirmPassword: "demo12",
    });

    expect(result.success).toBe(true);
  });
});

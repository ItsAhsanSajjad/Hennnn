import { describe, expect, it } from "vitest";

import { signUpSchema } from "@/lib/validation/auth";

describe("Phase 1 registration boundaries", () => {
  it("accepts registration without explicit consent checkboxes", () => {
    const result = signUpSchema.safeParse({
      username: "valid_user",
      phone: "03001234567",
      password: "validpassword1",
      confirmPassword: "validpassword1",
    });

    expect(result.success).toBe(true);
  });

  it("does not accept mismatched passwords before server work begins", () => {
    const result = signUpSchema.safeParse({
      username: "valid_user",
      phone: "03001234567",
      password: "validpassword1",
      confirmPassword: "differentpass1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords do not match.",
      );
    }
  });
});

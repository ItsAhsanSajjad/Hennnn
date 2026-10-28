import { z } from "zod";

const reservedUsernames = new Set([
  "admin",
  "administrator",
  "support",
  "owner",
  "system",
  "pakhen",
]);

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  const normalized = normalizeUsername(username);
  if (!/^[a-zA-Z0-9_]{4,24}$/.test(username)) {
    return {
      ok: false as const,
      message: "Username must be 4-24 characters and use only letters, numbers, or underscore.",
    };
  }
  if (reservedUsernames.has(normalized)) {
    return {
      ok: false as const,
      message: "Please choose a different username.",
    };
  }
  return { ok: true as const, normalized };
}

export function normalizePakistaniPhone(input: string) {
  let digits = input.replace(/[^\d]/g, "");

  if (digits.startsWith("0092")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("92")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (!/^3\d{9}$/.test(digits)) {
    return {
      ok: false as const,
      message: "Enter a valid Pakistani mobile number, for example 0300 1234567.",
    };
  }

  return { ok: true as const, phoneE164: `+92${digits}` };
}

export const PASSWORD_MIN_LENGTH = 2;
export const PASSWORD_MAX_LENGTH = 20;

export function validatePassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false as const,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false as const,
      message: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true as const };
}

export const signUpSchema = z
  .object({
    username: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    password: z.string(),
    confirmPassword: z.string(),
    referralCode: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const username = validateUsername(value.username);
    if (!username.ok) {
      ctx.addIssue({ code: "custom", path: ["username"], message: username.message });
    }

    const phone = normalizePakistaniPhone(value.phone);
    if (!phone.ok) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: phone.message });
    }

    const password = validatePassword(value.password);
    if (!password.ok) {
      ctx.addIssue({ code: "custom", path: ["password"], message: password.message });
    }

    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or phone number."),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or phone number."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((value, ctx) => {
    const password = validatePassword(value.password);
    if (!password.ok) {
      ctx.addIssue({ code: "custom", path: ["password"], message: password.message });
    }
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((value, ctx) => {
    const password = validatePassword(value.newPassword);
    if (!password.ok) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: password.message });
    }
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

import { z } from "zod";

export const eggSaleSubmissionSchema = z.object({
  eggQuantity: z.coerce.number().int().min(1).max(1_000_000),
  payoutMethodId: z.uuid().optional(),
  idempotencyKey: z.string().trim().min(12).max(120),
  termsAccepted: z.coerce.boolean().default(false),
});

export const eggSaleCancelSchema = z.object({
  publicReference: z.string().trim().min(8).max(40),
});

export const eggSaleReviewSchema = z
  .object({
    publicReference: z.string().trim().min(8).max(40),
    decision: z.enum(["approve", "reject"]),
    rejectionCategory: z.string().trim().max(80).optional(),
    userVisibleReason: z.string().trim().max(1000).optional(),
    internalReviewNotes: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "reject" && !value.rejectionCategory) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionCategory"],
        message: "Select a rejection reason.",
      });
    }
    if (value.decision === "reject" && !value.userVisibleReason) {
      ctx.addIssue({
        code: "custom",
        path: ["userVisibleReason"],
        message: "Provide a customer-visible explanation.",
      });
    }
  });

export const saleRateFormSchema = z
  .object({
    id: z.uuid().optional(),
    code: z.string().trim().min(3).max(40).toUpperCase(),
    name: z.string().trim().min(3).max(120),
    ratePaisaPerEgg: z.coerce.number().int().min(1).max(1_000_000_000),
    effectiveFrom: z.string().trim().min(1),
    effectiveUntil: z.string().trim().optional(),
    isActive: z.boolean().default(false),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    const from = new Date(value.effectiveFrom);
    const until = value.effectiveUntil ? new Date(value.effectiveUntil) : null;
    if (Number.isNaN(from.getTime())) {
      ctx.addIssue({ code: "custom", path: ["effectiveFrom"], message: "Invalid start date." });
    }
    if (until && Number.isNaN(until.getTime())) {
      ctx.addIssue({ code: "custom", path: ["effectiveUntil"], message: "Invalid end date." });
    }
    if (until && !Number.isNaN(from.getTime()) && until <= from) {
      ctx.addIssue({
        code: "custom",
        path: ["effectiveUntil"],
        message: "End date must be after start date.",
      });
    }
  });

export const payoutMethodSchema = z
  .object({
    id: z.uuid().optional(),
    provider: z.enum(["EASYPAISA", "JAZZCASH", "BANK_TRANSFER", "OTHER"]),
    bankName: z.string().trim().min(2).max(120).optional(),
    accountTitle: z.string().trim().min(3).max(120),
    accountIdentifier: z.string().trim().min(4).max(120),
    isDefault: z.coerce.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.provider === "BANK_TRANSFER" && !value.bankName) {
      ctx.addIssue({
        code: "custom",
        path: ["bankName"],
        message: "Select your bank before saving this payout method.",
      });
    }
  });

export const payoutMethodArchiveSchema = z.object({
  id: z.uuid(),
});

export const settlementRecordSchema = z.object({
  publicReference: z.string().trim().min(8).max(40),
  settlementReference: z.string().trim().min(4).max(120),
  notes: z.string().trim().max(1000).optional(),
});

export const settlementStatusSchema = z.object({
  payoutId: z.uuid(),
  notes: z.string().trim().max(1000).optional(),
});

export const referralRuleFormSchema = z
  .object({
    id: z.uuid().optional(),
    code: z.string().trim().min(3).max(40).toUpperCase(),
    name: z.string().trim().min(3).max(120),
    rewardEggUnits: z.coerce.number().int().min(1).max(100_000),
    effectiveFrom: z.string().trim().min(1),
    effectiveUntil: z.string().trim().optional(),
    isActive: z.boolean().default(false),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    const from = new Date(value.effectiveFrom);
    const until = value.effectiveUntil ? new Date(value.effectiveUntil) : null;
    if (Number.isNaN(from.getTime())) {
      ctx.addIssue({ code: "custom", path: ["effectiveFrom"], message: "Invalid start date." });
    }
    if (until && Number.isNaN(until.getTime())) {
      ctx.addIssue({ code: "custom", path: ["effectiveUntil"], message: "Invalid end date." });
    }
    if (until && !Number.isNaN(from.getTime()) && until <= from) {
      ctx.addIssue({
        code: "custom",
        path: ["effectiveUntil"],
        message: "End date must be after start date.",
      });
    }
  });

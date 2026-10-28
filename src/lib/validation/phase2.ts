import { z } from "zod";

export const purchaseOrderSchema = z.object({
  planId: z.uuid(),
  quantity: z.coerce.number().int().min(1).max(10_000),
  idempotencyKey: z.string().trim().min(12).max(120).optional(),
});

export const paymentSubmissionSchema = z.object({
  purchaseOrderId: z.uuid(),
  paymentAccountId: z.uuid(),
  transactionReference: z.string().trim().max(120),
});

export const paymentReviewSchema = z.object({
  paymentSubmissionId: z.uuid(),
  decision: z.enum(["approve", "reject"]),
  reviewNotes: z.string().trim().max(1000).optional(),
  rejectionReason: z.string().trim().max(1000).optional(),
});

export const henPlanFormSchema = z
  .object({
    id: z.uuid().optional(),
    code: z.string().trim().min(3).max(40).toUpperCase(),
    name: z.string().trim().min(3).max(120),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
    shortDescription: z.string().trim().min(12).max(220),
    fullDescription: z.string().trim().min(20).max(4000),
    pricePaisa: z.coerce.number().int().min(100),
    dailyEggUnits: z.coerce.number().int().min(1).max(10_000),
    maximumEggUnits: z.coerce.number().int().min(1).max(1_000_000),
    validityDays: z.coerce.number().int().min(1).max(3650),
    minimumQuantity: z.coerce.number().int().min(1).max(10_000),
    maximumQuantity: z.coerce.number().int().min(1).max(10_000),
    status: z.enum(["DRAFT", "INACTIVE", "ACTIVE", "ARCHIVED"]),
    isActive: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    displayOrder: z.coerce.number().int().min(0).max(10_000),
    termsVersion: z.string().trim().min(1).max(32),
  })
  .superRefine((value, ctx) => {
    if (value.minimumQuantity > value.maximumQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["maximumQuantity"],
        message: "Maximum quantity must be at least the minimum quantity.",
      });
    }
    if (value.maximumEggUnits < value.dailyEggUnits) {
      ctx.addIssue({
        code: "custom",
        path: ["maximumEggUnits"],
        message: "Maximum egg units must cover at least one production day.",
      });
    }
    if (value.isActive && value.status !== "ACTIVE") {
      ctx.addIssue({
        code: "custom",
        path: ["isActive"],
        message: "Only ACTIVE plans can be published.",
      });
    }
  });

export const planPromotionFormSchema = z.object({
  planId: z.uuid(),
  label: z.string().trim().min(3).max(48),
  description: z.string().trim().min(8).max(220),
  discountPaisaPerHen: z.number().int().min(0).max(10_000_000),
  isActive: z.boolean().default(false),
});

export const publicPlanPackageSettingsFormSchema = z.object({
  planId: z.uuid(),
  pricePaisa: z.number().int().min(100).max(100_000_000),
  starterHens: z.coerce.number().int().min(1).max(10_000),
  recommendedHens: z.coerce.number().int().min(1).max(10_000),
  premiumHens: z.coerce.number().int().min(1).max(10_000),
  starterName: z.string().trim().min(3).max(80),
  recommendedName: z.string().trim().min(3).max(80),
  premiumName: z.string().trim().min(3).max(80),
  starterAudience: z.string().trim().min(3).max(180),
  recommendedAudience: z.string().trim().min(3).max(180),
  premiumAudience: z.string().trim().min(3).max(180),
});

export const purchaseDiscountTiersFormSchema = z
  .object({
    tierOneMinimumQuantity: z.coerce.number().int().min(1).max(10_000),
    tierOneMaximumQuantity: z.coerce.number().int().min(1).max(10_000),
    tierOneDiscountPercent: z.coerce.number().int().min(0).max(90),
    tierTwoMinimumQuantity: z.coerce.number().int().min(1).max(10_000),
    tierTwoMaximumQuantity: z.coerce.number().int().min(1).max(10_000),
    tierTwoDiscountPercent: z.coerce.number().int().min(0).max(90),
    tierThreeMinimumQuantity: z.coerce.number().int().min(1).max(10_000),
    tierThreeDiscountPercent: z.coerce.number().int().min(0).max(90),
  })
  .superRefine((value, ctx) => {
    if (value.tierOneMinimumQuantity > value.tierOneMaximumQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["tierOneMaximumQuantity"],
        message: "Use a value at least as large as the minimum.",
      });
    }
    if (value.tierTwoMinimumQuantity > value.tierTwoMaximumQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["tierTwoMaximumQuantity"],
        message: "Use a value at least as large as the minimum.",
      });
    }
    if (value.tierTwoMinimumQuantity <= value.tierOneMaximumQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["tierTwoMinimumQuantity"],
        message: "This tier must start after the previous tier ends.",
      });
    }
    if (value.tierThreeMinimumQuantity <= value.tierTwoMaximumQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["tierThreeMinimumQuantity"],
        message: "This tier must start after the previous tier ends.",
      });
    }
  });

export const ledgerAdjustmentSchema = z.object({
  userId: z.uuid(),
  eggUnits: z.coerce
    .number()
    .int()
    .min(-1_000_000)
    .max(1_000_000)
    .refine((value) => value !== 0, {
      message: "Adjustment cannot be zero.",
    }),
  description: z.string().trim().min(8).max(240),
});

export const paymentAccountFormSchema = z.object({
  id: z.uuid().optional(),
  provider: z.enum(["EASYPAISA", "JAZZCASH", "BANK_TRANSFER", "OTHER"]),
  accountTitle: z.string().trim().min(3).max(120),
  accountIdentifierProtected: z.string().trim().min(4).max(180),
  accountIdentifierLastFour: z.string().trim().min(2).max(12),
  bankName: z.string().trim().max(120).optional().nullable(),
  iban: z.string().trim().max(40).optional().nullable(),
  isVerified: z.boolean().default(true),
  instructions: z.string().trim().min(12).max(2000),
  isActive: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).max(10_000),
});

export const henSuspensionSchema = z.object({
  henAssetId: z.uuid(),
  reason: z.string().trim().min(8).max(1000),
});

export const eggAccrualRequestSchema = z.object({
  date: z.iso.date().optional(),
  dryRun: z.boolean().optional().default(false),
});

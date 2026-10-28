"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminPermission, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import { createAuditLog } from "@/server/services/audit";
import {
  cancelEggPayoutByUser,
  getAdminEggSaleDetails,
  markEggPayoutPaid,
  markEggPayoutProcessing,
  rejectEggPayout,
  requestEggMarketSalePayout,
  reverseEggMarketSale,
} from "@/server/services/egg-market-service";

const sellEggsSchema = z.object({
  marketId: z.string().uuid("Invalid market selection."),
  eggQuantity: z.coerce
    .number()
    .int("Egg quantity must be a whole integer.")
    .positive("Quantity must be greater than 0."),
  payoutMethod: z.enum(["JAZZCASH", "EASYPAISA"]),
  accountHolderName: z
    .string()
    .trim()
    .min(2, "Account title must be at least 2 characters.")
    .max(100, "Account title cannot exceed 100 characters."),
  accountNumber: z
    .string()
    .trim()
    .regex(/^(?:(?:\+92|0)?3[0-9]{9})$/, "Enter a valid 11-digit Pakistani mobile number (e.g. 03001234567)."),
  confirmAccountNumber: z.string().trim(),
  agreeTerms: z.preprocess((val) => val === "on" || val === "true" || val === true, z.literal(true)),
  idempotencyKey: z.string().min(10, "Invalid transaction key."),
}).refine((data) => {
  const clean1 = data.accountNumber.replace(/\D/g, "").slice(-10);
  const clean2 = data.confirmAccountNumber.replace(/\D/g, "").slice(-10);
  return clean1 === clean2;
}, {
  message: "Account numbers do not match.",
  path: ["confirmAccountNumber"],
});

export async function sellEggsToMarketAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = sellEggsSchema.safeParse({
    marketId: formData.get("marketId"),
    eggQuantity: formData.get("eggQuantity"),
    payoutMethod: formData.get("payoutMethod"),
    accountHolderName: formData.get("accountHolderName"),
    accountNumber: formData.get("accountNumber"),
    confirmAccountNumber: formData.get("confirmAccountNumber"),
    agreeTerms: formData.get("agreeTerms"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return formError("Please check your sell inputs.", parsed.error.flatten().fieldErrors);
  }

  try {
    const sale = await requestEggMarketSalePayout({
      userId: user.id,
      marketId: parsed.data.marketId,
      eggQuantity: parsed.data.eggQuantity,
      payoutMethod: parsed.data.payoutMethod as any,
      accountHolderName: parsed.data.accountHolderName,
      accountNumber: parsed.data.accountNumber,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sell-eggs");
    revalidatePath("/dashboard/profit-egg");
    revalidatePath("/dashboard/egg-ledger");
    revalidatePath("/admin/egg-markets");

    return formSuccess(
      `Payout request for ${sale.eggQuantity} eggs submitted successfully. PKR ${(Number(sale.totalAmountPaisa) / 100).toLocaleString("en-PK")} will be sent to your ${sale.payoutMethod} account (${sale.accountNumberMasked}). Reference: ${sale.publicReference}`
    );
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to submit payout request.");
  }
}

export async function cancelEggPayoutAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const saleId = String(formData.get("saleId") ?? "");

  if (!saleId) {
    return formError("Invalid payout request ID.");
  }

  try {
    const cancelled = await cancelEggPayoutByUser({
      userId: user.id,
      saleId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sell-eggs");
    revalidatePath("/dashboard/profit-egg");
    revalidatePath("/dashboard/egg-ledger");

    return formSuccess(`Payout request ${cancelled.publicReference} has been cancelled and eggs returned to your balance.`);
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to cancel payout request.");
  }
}

const saveMarketSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9-_]+$/, "Code must be uppercase alphanumeric with dashes/underscores"),
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional().default(""),
  minEggs: z.coerce.number().int().min(1, "Minimum eggs must be at least 1"),
  maxEggs: z.coerce.number().int().min(1, "Maximum eggs must be at least 1"),
  pricePerEggRs: z.coerce.number().positive("Price must be greater than 0"),
  icon: z.string().trim().max(80).optional().default("Egg"),
  imagePath: z.string().trim().max(255).optional().nullable(),
  imageAlt: z.string().trim().max(255).optional().nullable(),
  isVerified: z.preprocess((val) => val === "on" || val === "true" || val === true, z.boolean()),
  isActive: z.preprocess((val) => val === "on" || val === "true" || val === true, z.boolean()),
  isPaused: z.preprocess((val) => val === "on" || val === "true" || val === true, z.boolean()),
  displayOrder: z.coerce.number().int().default(0),
  dailyLimitEggs: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().int().positive().nullable().optional(),
  ),
  totalCapacityEggs: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().int().positive().nullable().optional(),
  ),
});

export async function saveEggMarketAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SALE_RATES_MANAGE);

  const raw = Object.fromEntries(formData.entries());
  const parsed = saveMarketSchema.safeParse(raw);

  if (!parsed.success) {
    return formError("Please fix the validation errors.", parsed.error.flatten().fieldErrors);
  }

  const {
    id,
    code,
    name,
    description,
    minEggs,
    maxEggs,
    pricePerEggRs,
    icon,
    imagePath,
    imageAlt,
    isVerified,
    isActive,
    isPaused,
    displayOrder,
    dailyLimitEggs,
    totalCapacityEggs,
  } = parsed.data;

  if (minEggs > maxEggs) {
    return formError("Minimum eggs cannot be greater than maximum eggs.");
  }

  const pricePerEggPaisa = BigInt(Math.round(pricePerEggRs * 100));

  try {
    if (id) {
      const updated = await prisma.eggMarket.update({
        where: { id },
        data: {
          name,
          description: description || null,
          minEggs,
          maxEggs,
          pricePerEggPaisa,
          icon: icon || null,
          imagePath: imagePath || null,
          imageAlt: imageAlt || null,
          isVerified,
          isActive,
          isPaused,
          displayOrder,
          dailyLimitEggs: dailyLimitEggs ?? null,
          totalCapacityEggs: totalCapacityEggs ?? null,
          updatedByUserId: actor.id,
        },
      });

      await createAuditLog({
        actorUserId: actor.id,
        action: "EGG_MARKET_UPDATED",
        entityType: "EggMarket",
        entityId: updated.id,
        metadata: { code: updated.code, name: updated.name, pricePerEggRs },
      });

      revalidatePath("/admin/egg-markets");
      revalidatePath("/dashboard/sell-eggs");
      return formSuccess(`Market "${updated.name}" updated successfully.`);
    } else {
      const created = await prisma.eggMarket.create({
        data: {
          code: code.toUpperCase(),
          name,
          description: description || null,
          minEggs,
          maxEggs,
          pricePerEggPaisa,
          icon: icon || null,
          imagePath: imagePath || null,
          imageAlt: imageAlt || null,
          isVerified,
          isActive,
          isPaused,
          displayOrder,
          dailyLimitEggs: dailyLimitEggs ?? null,
          totalCapacityEggs: totalCapacityEggs ?? null,
          createdByUserId: actor.id,
        },
      });

      await createAuditLog({
        actorUserId: actor.id,
        action: "EGG_MARKET_CREATED",
        entityType: "EggMarket",
        entityId: created.id,
        metadata: { code: created.code, name: created.name, pricePerEggRs },
      });

      revalidatePath("/admin/egg-markets");
      revalidatePath("/dashboard/sell-eggs");
      return formSuccess(`Market "${created.name}" created successfully.`);
    }
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to save egg market.");
  }
}

export async function toggleEggMarketStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.SALE_RATES_MANAGE);
  const marketId = String(formData.get("marketId") ?? "");
  const field = String(formData.get("field") ?? "");
  const targetValue = formData.get("value") === "true";

  if (!marketId || !field) {
    return formError("Invalid toggle parameters.");
  }

  try {
    const updateData: Record<string, any> = { updatedByUserId: actor.id };
    if (field === "isActive") updateData.isActive = targetValue;
    if (field === "isPaused") updateData.isPaused = targetValue;
    if (field === "isVerified") updateData.isVerified = targetValue;

    const updated = await prisma.eggMarket.update({
      where: { id: marketId },
      data: updateData,
    });

    await createAuditLog({
      actorUserId: actor.id,
      action: "EGG_MARKET_UPDATED",
      entityType: "EggMarket",
      entityId: updated.id,
      metadata: { field, targetValue, marketName: updated.name },
    });

    revalidatePath("/admin/egg-markets");
    revalidatePath("/dashboard/sell-eggs");
    return formSuccess(`Updated status for "${updated.name}".`);
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to update market status.");
  }
}

export async function markEggPayoutProcessingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_REVIEW);
  const saleId = String(formData.get("saleId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!saleId) {
    return formError("Sale ID is required.");
  }

  try {
    const updated = await markEggPayoutProcessing({
      actor,
      saleId,
      notes,
    });

    revalidatePath("/admin/egg-markets");
    revalidatePath("/dashboard/sell-eggs");

    return formSuccess(`Payout ${updated.publicReference} moved to Processing status.`);
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to update payout status.");
  }
}

export async function markEggPayoutPaidAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_REVIEW);
  const saleId = String(formData.get("saleId") ?? "");
  const adminTransactionId = String(formData.get("adminTransactionId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!saleId || !adminTransactionId) {
    return formError("Sale ID and Transaction Reference are required.");
  }

  try {
    const updated = await markEggPayoutPaid({
      actor,
      saleId,
      adminTransactionId,
      notes,
    });

    revalidatePath("/admin/egg-markets");
    revalidatePath("/dashboard/sell-eggs");
    revalidatePath("/dashboard/profit-egg");

    return formSuccess(`Payout ${updated.publicReference} marked as PAID. Txn ID: ${updated.adminTransactionId}`);
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to complete payout.");
  }
}

export async function rejectEggPayoutAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_REVIEW);
  const saleId = String(formData.get("saleId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!saleId || !reason) {
    return formError("Sale ID and a rejection reason are required.");
  }

  try {
    const rejected = await rejectEggPayout({
      actor,
      saleId,
      reason,
      notes,
    });

    revalidatePath("/admin/egg-markets");
    revalidatePath("/dashboard/sell-eggs");
    revalidatePath("/dashboard/egg-ledger");

    return formSuccess(`Payout ${rejected.publicReference} rejected. ${rejected.eggQuantity} eggs released back to user.`);
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to reject payout.");
  }
}

export async function getAdminEggSaleDetailsAction(saleId: string) {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.EGG_SALES_REVIEW);
  try {
    const details = await getAdminEggSaleDetails(saleId, actor);
    return {
      ok: true,
      data: {
        id: details.id,
        publicReference: details.publicReference,
        payoutMethod: details.payoutMethod,
        accountHolderName: details.accountHolderNameDecrypted,
        accountNumber: details.accountNumberDecrypted,
        accountNumberMasked: details.accountNumberMasked,
        eggQuantity: details.eggQuantity,
        totalAmountPaisa: details.totalAmountPaisa.toString(),
        totalAmountRs: Number(details.totalAmountPaisa) / 100,
        status: details.status,
        adminTransactionId: details.adminTransactionId,
        adminNotes: details.adminNotes,
        rejectionReason: details.rejectionReason,
        submittedAt: details.submittedAt,
        processingAt: details.processingAt,
        paidAt: details.paidAt,
        rejectedAt: details.rejectedAt,
        user: details.user,
        market: {
          name: details.market.name,
          code: details.market.code,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to fetch payout details.",
    };
  }
}

export async function reverseEggMarketSaleAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.LEDGER_ADJUST);
  const saleId = String(formData.get("saleId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!saleId || !reason) {
    return formError("Sale ID and a valid reversal reason are required.");
  }

  try {
    const reversed = await reverseEggMarketSale({
      actor,
      saleId,
      reason,
    });

    revalidatePath("/admin/egg-markets");
    revalidatePath("/dashboard/sell-eggs");
    revalidatePath("/dashboard/profit-egg");
    revalidatePath("/dashboard/egg-ledger");

    return formSuccess(
      `Sale ${reversed.publicReference} reversed successfully. ${reversed.eggQuantity} eggs credited back to user.`,
    );
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Failed to reverse sale.");
  }
}


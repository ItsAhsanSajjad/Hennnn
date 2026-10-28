"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminPermission, requireUser } from "@/lib/auth/session";
import {
  henPlanFormSchema,
  henSuspensionSchema,
  ledgerAdjustmentSchema,
  paymentAccountFormSchema,
  paymentReviewSchema,
  paymentSubmissionSchema,
  purchaseOrderSchema,
  planPromotionFormSchema,
  purchaseDiscountTiersFormSchema,
  publicPlanPackageSettingsFormSchema,
} from "@/lib/validation/phase2";
import { formError, formSuccess, type ActionState } from "@/server/actions/types";
import { createLedgerAdjustment } from "@/server/services/egg-ledger";
import { createPurchaseOrderForUser } from "@/server/services/purchases";
import { reviewPaymentSubmission, submitPaymentForOrder } from "@/server/services/payments";
import { prisma } from "@/lib/database/prisma";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";
import { parsePlanPromotions, planPromotionsSettingKey } from "@/server/services/plan-promotions";
import { publicPlanPackageSettingsKey } from "@/server/services/public-plan-package-settings";
import { purchaseDiscountTiersSettingKey } from "@/server/services/purchase-discount-tiers";

function optionalBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function rupeesToPaisa(value: string) {
  const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;

  const paisa = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(paisa) ? paisa : null;
}

export async function createPurchaseOrderAction(formData: FormData) {
  const user = await requireUser();
  const rawIdem = String(formData.get("idempotencyKey") ?? "").trim();
  const parsed = purchaseOrderSchema.parse({
    planId: String(formData.get("planId") ?? ""),
    quantity: formData.get("quantity"),
    idempotencyKey: rawIdem.length >= 12 ? rawIdem : undefined,
  });

  const order = await createPurchaseOrderForUser({ user, ...parsed });
  revalidatePath("/dashboard/orders");
  redirect(`/dashboard/orders/${order.orderReference}`);
}

export async function submitPaymentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const proofFile = formData.get("proofFile");
  if (!(proofFile instanceof File) || proofFile.size === 0) {
    return formError("Screenshot must be a JPG, PNG, or WebP file smaller than 5 MB.");
  }

  const parsed = paymentSubmissionSchema.safeParse({
    purchaseOrderId: String(formData.get("purchaseOrderId") ?? ""),
    paymentAccountId: String(formData.get("paymentAccountId") ?? ""),
    transactionReference: String(formData.get("transactionReference") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the payment details.", parsed.error.flatten().fieldErrors);
  }

  try {
    const submission = await submitPaymentForOrder({ user, ...parsed.data, proofFile });
    revalidatePath("/admin/payments");
    revalidatePath(`/dashboard/orders/${submission.orderReference}`);
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Payment submission failed.");
  }

  revalidatePath("/dashboard/orders");
  return formSuccess("Payment submitted for finance review.");
}

export async function reviewPaymentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.PAYMENTS_REVIEW);
  const parsed = paymentReviewSchema.safeParse({
    paymentSubmissionId: String(formData.get("paymentSubmissionId") ?? ""),
    decision: String(formData.get("decision") ?? ""),
    reviewNotes: String(formData.get("reviewNotes") ?? "") || undefined,
    rejectionReason: String(formData.get("rejectionReason") ?? "") || undefined,
  });
  if (!parsed.success) {
    return formError("Check the review details.", parsed.error.flatten().fieldErrors);
  }

  const payment = await prisma.paymentSubmission.findUnique({
    where: { id: parsed.data.paymentSubmissionId },
    select: { purchaseOrder: { select: { orderReference: true } } },
  });

  try {
    await reviewPaymentSubmission({ actor, ...parsed.data });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Payment review failed.");
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${parsed.data.paymentSubmissionId}`);
  revalidatePath("/admin/hens");
  revalidatePath("/dashboard/orders");
  if (payment) {
    revalidatePath(`/dashboard/orders/${payment.purchaseOrder.orderReference}`);
  }
  return formSuccess(
    parsed.data.decision === "approve"
      ? "Payment approved and hen asset activated."
      : "Payment rejected.",
  );
}

export async function saveHenPlanAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.PLANS_MANAGE);
  const submittedPricePaisa = rupeesToPaisa(String(formData.get("priceRupees") ?? ""));
  if (submittedPricePaisa === null || submittedPricePaisa < 100) {
    return formError("Enter a valid plan price in rupees.", {
      priceRupees: ["Use a whole rupee amount or up to two decimal places."],
    });
  }

  const parsed = henPlanFormSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    fullDescription: String(formData.get("fullDescription") ?? ""),
    pricePaisa: submittedPricePaisa,
    dailyEggUnits: formData.get("dailyEggUnits"),
    maximumEggUnits: formData.get("maximumEggUnits"),
    validityDays: formData.get("validityDays"),
    minimumQuantity: formData.get("minimumQuantity"),
    maximumQuantity: formData.get("maximumQuantity"),
    status: String(formData.get("status") ?? ""),
    isActive: optionalBoolean(formData, "isActive"),
    isFeatured: optionalBoolean(formData, "isFeatured"),
    displayOrder: formData.get("displayOrder"),
    termsVersion: String(formData.get("termsVersion") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the plan details.", parsed.error.flatten().fieldErrors);
  }

  const { id, pricePaisa, ...data } = parsed.data;
  const plan = id
    ? await prisma.henPlan.update({
        where: { id },
        data: { ...data, pricePaisa: BigInt(pricePaisa), updatedByUserId: actor.id },
      })
    : await prisma.henPlan.create({
        data: {
          ...data,
          pricePaisa: BigInt(pricePaisa),
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
        },
      });

  await createAuditLog({
    actorUserId: actor.id,
    action: id ? "HEN_PLAN_UPDATED" : "HEN_PLAN_CREATED",
    entityType: "HenPlan",
    entityId: plan.id,
  });
  revalidatePath("/admin/plans");
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard/plans");
  return formSuccess("Plan saved.");
}

export async function savePlanPromotionAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.PLANS_MANAGE);
  const discountPaisaPerHen = rupeesToPaisa(String(formData.get("discountRupeesPerHen") ?? ""));
  if (discountPaisaPerHen === null) {
    return formError("Enter the discount in rupees.", {
      discountRupeesPerHen: ["Use a whole rupee amount or up to two decimal places."],
    });
  }

  const parsed = planPromotionFormSchema.safeParse({
    planId: String(formData.get("planId") ?? ""),
    label: String(formData.get("label") ?? ""),
    description: String(formData.get("description") ?? ""),
    discountPaisaPerHen,
    isActive: optionalBoolean(formData, "isActive"),
  });
  if (!parsed.success) {
    return formError("Check the offer details.", parsed.error.flatten().fieldErrors);
  }

  const plan = await prisma.henPlan.findUnique({
    where: { id: parsed.data.planId },
    select: { id: true, name: true },
  });
  if (!plan) return formError("That plan is no longer available.");

  await prisma.$transaction(async (tx) => {
    const setting = await tx.appSetting.findUnique({
      where: { key: planPromotionsSettingKey },
      select: { value: true },
    });
    const promotions = parsePlanPromotions(setting?.value);
    const nextPromotion = parsed.data;
    const nextPromotions = [
      ...promotions.filter((promotion) => promotion.planId !== nextPromotion.planId),
      nextPromotion,
    ];

    await tx.appSetting.upsert({
      where: { key: planPromotionsSettingKey },
      create: {
        key: planPromotionsSettingKey,
        value: nextPromotions,
        updatedByUserId: actor.id,
      },
      update: { value: nextPromotions, updatedByUserId: actor.id },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "APP_SETTING_UPDATED",
        entityType: "PlanPromotion",
        entityId: plan.id,
        metadata: {
          planName: plan.name,
          label: parsed.data.label,
          discountPaisaPerHen: parsed.data.discountPaisaPerHen,
          isActive: parsed.data.isActive,
        },
      },
      tx,
    );
  });

  revalidatePath("/admin/plans");
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard/plans");
  return formSuccess("Plan offer published. New orders use the server-checked discount.");
}

export async function savePurchaseDiscountTiersAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.PLANS_MANAGE);
  const parsed = purchaseDiscountTiersFormSchema.safeParse({
    tierOneMinimumQuantity: formData.get("tierOneMinimumQuantity"),
    tierOneMaximumQuantity: formData.get("tierOneMaximumQuantity"),
    tierOneDiscountPercent: formData.get("tierOneDiscountPercent"),
    tierTwoMinimumQuantity: formData.get("tierTwoMinimumQuantity"),
    tierTwoMaximumQuantity: formData.get("tierTwoMaximumQuantity"),
    tierTwoDiscountPercent: formData.get("tierTwoDiscountPercent"),
    tierThreeMinimumQuantity: formData.get("tierThreeMinimumQuantity"),
    tierThreeDiscountPercent: formData.get("tierThreeDiscountPercent"),
  });
  if (!parsed.success) {
    return formError("Check the quantity discount tiers.", parsed.error.flatten().fieldErrors);
  }

  const tiers = [
    {
      key: "tierOne",
      label: `${parsed.data.tierOneMinimumQuantity} to ${parsed.data.tierOneMaximumQuantity} hens`,
      minimumQuantity: parsed.data.tierOneMinimumQuantity,
      maximumQuantity: parsed.data.tierOneMaximumQuantity,
      discountPercent: parsed.data.tierOneDiscountPercent,
    },
    {
      key: "tierTwo",
      label: `${parsed.data.tierTwoMinimumQuantity} to ${parsed.data.tierTwoMaximumQuantity} hens`,
      minimumQuantity: parsed.data.tierTwoMinimumQuantity,
      maximumQuantity: parsed.data.tierTwoMaximumQuantity,
      discountPercent: parsed.data.tierTwoDiscountPercent,
    },
    {
      key: "tierThree",
      label: `${parsed.data.tierThreeMinimumQuantity} or more hens`,
      minimumQuantity: parsed.data.tierThreeMinimumQuantity,
      maximumQuantity: null,
      discountPercent: parsed.data.tierThreeDiscountPercent,
    },
  ];

  await prisma.$transaction(async (tx) => {
    await tx.appSetting.upsert({
      where: { key: purchaseDiscountTiersSettingKey },
      create: { key: purchaseDiscountTiersSettingKey, value: tiers, updatedByUserId: actor.id },
      update: { value: tiers, updatedByUserId: actor.id },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "APP_SETTING_UPDATED",
        entityType: "PurchaseDiscountTiers",
        entityId: purchaseDiscountTiersSettingKey,
        metadata: { tiers },
      },
      tx,
    );
  });

  revalidatePath("/admin/plans");
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard/plans");
  return formSuccess("Quantity discounts updated. New orders use these server-checked tiers.");
}

export async function savePublicPlanPackageSettingsAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.PLANS_MANAGE);
  const pricePaisa = rupeesToPaisa(String(formData.get("priceRupees") ?? ""));
  if (pricePaisa === null || pricePaisa < 100) {
    return formError("Enter a valid base price in rupees.", {
      priceRupees: ["Use a whole rupee amount or up to two decimal places."],
    });
  }
  const parsed = publicPlanPackageSettingsFormSchema.safeParse({
    planId: String(formData.get("planId") ?? ""),
    pricePaisa,
    starterHens: formData.get("starterHens"),
    recommendedHens: formData.get("recommendedHens"),
    premiumHens: formData.get("premiumHens"),
    starterName: String(formData.get("starterName") ?? ""),
    recommendedName: String(formData.get("recommendedName") ?? ""),
    premiumName: String(formData.get("premiumName") ?? ""),
    starterAudience: String(formData.get("starterAudience") ?? ""),
    recommendedAudience: String(formData.get("recommendedAudience") ?? ""),
    premiumAudience: String(formData.get("premiumAudience") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the package card details.", parsed.error.flatten().fieldErrors);
  }

  const { planId, pricePaisa: nextPricePaisa, ...settings } = parsed.data;
  const cards = [
    {
      key: "starter" as const,
      name: settings.starterName,
      hens: settings.starterHens,
      audience: settings.starterAudience,
    },
    {
      key: "recommended" as const,
      name: settings.recommendedName,
      hens: settings.recommendedHens,
      audience: settings.recommendedAudience,
      badge: "Recommended",
    },
    {
      key: "premium" as const,
      name: settings.premiumName,
      hens: settings.premiumHens,
      audience: settings.premiumAudience,
    },
  ];

  const plan = await prisma.henPlan.findUnique({
    where: { id: planId },
    select: { id: true, name: true },
  });
  if (!plan) return formError("The selected base plan no longer exists.");

  await prisma.$transaction(async (tx) => {
    await tx.henPlan.update({
      where: { id: plan.id },
      data: { pricePaisa: BigInt(nextPricePaisa), updatedByUserId: actor.id },
    });
    await tx.appSetting.upsert({
      where: { key: publicPlanPackageSettingsKey },
      create: { key: publicPlanPackageSettingsKey, value: cards, updatedByUserId: actor.id },
      update: { value: cards, updatedByUserId: actor.id },
    });
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "HEN_PLAN_UPDATED",
        entityType: "HenPlan",
        entityId: plan.id,
        metadata: { packageCards: cards, pricePaisa: nextPricePaisa },
      },
      tx,
    );
    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "APP_SETTING_UPDATED",
        entityType: "PublicPlanPackageSettings",
        entityId: publicPlanPackageSettingsKey,
      },
      tx,
    );
  });

  revalidatePath("/admin/plans");
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard/plans");
  return formSuccess("Customer plan cards and base price updated.");
}

export async function savePaymentAccountAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.PAYMENT_ACCOUNTS_MANAGE);
  const parsed = paymentAccountFormSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    provider: String(formData.get("provider") ?? ""),
    accountTitle: String(formData.get("accountTitle") ?? ""),
    accountIdentifierProtected: String(formData.get("accountIdentifierProtected") ?? ""),
    accountIdentifierLastFour: String(formData.get("accountIdentifierLastFour") ?? ""),
    bankName: String(formData.get("bankName") ?? "").trim() || undefined,
    iban: String(formData.get("iban") ?? "").trim() || undefined,
    isVerified: optionalBoolean(formData, "isVerified") ?? true,
    instructions: String(formData.get("instructions") ?? ""),
    isActive: optionalBoolean(formData, "isActive"),
    displayOrder: formData.get("displayOrder"),
  });
  if (!parsed.success) {
    return formError("Check the payment account details.", parsed.error.flatten().fieldErrors);
  }

  const { id, ...data } = parsed.data;
  const account = id
    ? await prisma.paymentAccount.update({
        where: { id },
        data: { ...data, updatedByUserId: actor.id },
      })
    : await prisma.paymentAccount.create({
        data: { ...data, createdByUserId: actor.id, updatedByUserId: actor.id },
      });

  await createAuditLog({
    actorUserId: actor.id,
    action: "PAYMENT_ACCOUNT_UPDATED",
    entityType: "PaymentAccount",
    entityId: account.id,
  });
  revalidatePath("/admin/payment-accounts");
  revalidatePath("/dashboard/orders");
  return formSuccess("Payment account saved.");
}

export async function createLedgerAdjustmentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.LEDGER_ADJUST);
  const parsed = ledgerAdjustmentSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    eggUnits: formData.get("eggUnits"),
    description: String(formData.get("description") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the ledger adjustment.", parsed.error.flatten().fieldErrors);
  }

  try {
    await createLedgerAdjustment({ actor, ...parsed.data });
  } catch (error) {
    return formError(error instanceof Error ? error.message : "Ledger adjustment failed.");
  }

  revalidatePath("/admin/ledger");
  return formSuccess("Ledger adjustment recorded.");
}

export async function suspendHenAssetAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireAdminPermission(ADMIN_PERMISSIONS.HENS_MANAGE);

  const parsed = henSuspensionSchema.safeParse({
    henAssetId: String(formData.get("henAssetId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  if (!parsed.success) {
    return formError("Check the suspension details.", parsed.error.flatten().fieldErrors);
  }

  const asset = await prisma.henAsset.update({
    where: { id: parsed.data.henAssetId },
    data: {
      status: "SUSPENDED",
      suspendedAt: new Date(),
      suspensionReason: parsed.data.reason,
    },
  });
  await createAuditLog({
    actorUserId: actor.id,
    action: "HEN_ASSET_SUSPENDED",
    entityType: "HenAsset",
    entityId: asset.id,
  });
  revalidatePath("/admin/hens");
  return formSuccess("Hen asset suspended.");
}

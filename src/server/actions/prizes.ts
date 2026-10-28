"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { PRIZE_CATALOGUE } from "@/lib/prizes/config";

export interface PrizeClaimActionState {
  status: "idle" | "success" | "error";
  message: string;
  claimId?: string;
  whatsappUrl?: string;
}

export async function submitPrizeClaimAction(
  prevState: PrizeClaimActionState,
  formData: FormData
): Promise<PrizeClaimActionState> {
  try {
    const user = await requireUser();
    const prizeKey = String(formData.get("prizeKey") || "").trim();
    const userNote = String(formData.get("userNote") || "").trim().slice(0, 500);

    const prize = PRIZE_CATALOGUE.find((p) => p.id === prizeKey);
    if (!prize) {
      return {
        status: "error",
        message: "Invalid prize selection. Please choose an active prize from the catalogue.",
      };
    }

    // 1. Calculate real verified investment on server
    const approvedOrders = await prisma.purchaseOrder.findMany({
      where: { userId: user.id, status: "APPROVED" },
      select: { totalAmountPaisa: true },
    });

    const verifiedInvestmentPaisa = approvedOrders.reduce(
      (sum, o) => sum + BigInt(o.totalAmountPaisa),
      0n
    );

    if (verifiedInvestmentPaisa < prize.requiredInvestmentPaisa) {
      const requiredRs = Number(prize.requiredInvestmentPaisa / 100n);
      const currentRs = Number(verifiedInvestmentPaisa / 100n);
      const remainingRs = requiredRs - currentRs;
      return {
        status: "error",
        message: `Eligibility requirement not met. Your verified investment is PKR ${currentRs.toLocaleString()}, but this prize requires PKR ${requiredRs.toLocaleString()} (PKR ${remainingRs.toLocaleString()} remaining).`,
      };
    }

    // 2. Prevent duplicate claims
    const existingClaim = await prisma.prizeClaim.findFirst({
      where: {
        userId: user.id,
        prizeKey: prize.id,
        status: { in: ["PENDING", "UNDER_REVIEW", "APPROVED", "DELIVERED"] },
      },
    });

    if (existingClaim) {
      return {
        status: "error",
        message: `You already have an active or completed claim for ${prize.name} (Status: ${existingClaim.status}).`,
      };
    }

    // 3. Create real claim record in transaction
    const claim = await prisma.$transaction(async (tx) => {
      const newClaim = await tx.prizeClaim.create({
        data: {
          userId: user.id,
          prizeKey: prize.id,
          prizeName: prize.name,
          prizeCategory: prize.category,
          requiredInvestmentPaisa: prize.requiredInvestmentPaisa,
          verifiedInvestmentPaisa,
          status: "PENDING",
          userNote: userNote || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: "RECONCILIATION_RUN", // Using safe valid AuditAction enum
          entityType: "PrizeClaim",
          entityId: newClaim.id,
          metadata: {
            prizeKey: prize.id,
            prizeName: prize.name,
            requiredInvestmentRs: Number(prize.requiredInvestmentPaisa / 100n),
            verifiedInvestmentRs: Number(verifiedInvestmentPaisa / 100n),
          },
        },
      });

      return newClaim;
    });

    // 4. Construct safe prefilled WhatsApp message for Admin fulfillment desk
    const prefilledText = encodeURIComponent(
      `Hello GrowMeta Egg Admin desk,\nI have submitted a prize claim for "${prize.name}" on my account @${user.username}.\nClaim ID: ${claim.id.slice(0, 8)}.\nPlease verify my fulfillment details.`
    );
    const whatsappUrl = `https://wa.me/923000000000?text=${prefilledText}`;

    revalidatePath("/dashboard/prizes");

    return {
      status: "success",
      message: `Your claim for ${prize.name} has been successfully submitted! Our dispatch desk is reviewing your order history.`,
      claimId: claim.id,
      whatsappUrl,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process prize claim";
    return {
      status: "error",
      message: errorMsg,
    };
  }
}

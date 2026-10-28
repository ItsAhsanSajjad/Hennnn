import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/database/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { isActiveStatus } from "@/server/policies/authorization";
import {
  createGeneratedPaymentReference,
  normalizeTransactionReference,
} from "@/lib/utilities/phase2";
import { createAuditLog } from "@/server/services/audit";
import { isUnconfirmedPaybost } from "@/server/services/payments";
import {
  appBaseUrl,
  getPaybostConfig,
  initiatePaybostPayment,
  isPaybostEnabled,
  newGatewayIdentifier,
  paisaToAmountString,
} from "@/server/services/paybost";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.uuid(),
  // Accepted for parity with the gateway contract but never trusted: the amount
  // charged is always taken from the server-stored order snapshot.
  amount: z.union([z.number(), z.string()]).optional(),
  type: z.string().optional(),
});

function buildCustomerEmail(
  user: { email: string | null; usernameNormalized: string },
  base: string,
) {
  if (user.email && user.email.includes("@") && user.email.trim().length <= 30) {
    return user.email.trim();
  }
  const cleanUser = (user.usernameNormalized || "user").replace(/[^a-z0-9]/gi, "").slice(0, 16);
  const candidate = `${cleanUser || "user"}@gme.pk`;
  return candidate.slice(0, 30);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || !isActiveStatus(session.user.status)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!(await isPaybostEnabled())) {
    return NextResponse.json({ error: "Online payment is not available." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const user = session.user;
  const order = await prisma.purchaseOrder.findFirst({
    where: {
      id: parsed.data.orderId,
      userId: user.id,
      status: { in: ["AWAITING_PAYMENT", "REJECTED", "PAYMENT_SUBMITTED"] },
      paymentDueAt: { gt: new Date() },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "This order is not ready for payment." }, { status: 404 });
  }

  const identifier = newGatewayIdentifier();
  const reference = createGeneratedPaymentReference();

  // Create the PENDING payment FIRST (so a fast IPN can find it), superseding any
  // abandoned online attempt. A confirmed or manual active submission blocks here.
  let paymentId: string;
  try {
    paymentId = await prisma.$transaction(async (tx) => {
      const active = await tx.paymentSubmission.findFirst({
        where: {
          purchaseOrderId: order.id,
          status: { in: ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (active) {
        if (active.status === "APPROVED") {
          throw new Error("ALREADY_PAID");
        }
        if (isUnconfirmedPaybost(active)) {
          await tx.paymentSubmission.updateMany({
            where: { id: active.id, status: "PENDING", gatewayTxnId: null },
            data: {
              status: "REJECTED",
              gatewayStatus: "superseded_by_retry",
              rejectionReason: "Superseded by online payment retry",
            },
          });
        } else {
          throw new Error("ALREADY_UNDER_REVIEW");
        }
      }

      const created = await tx.paymentSubmission.create({
        data: {
          purchaseOrderId: order.id,
          submittedByUserId: user.id,
          transactionReference: reference,
          transactionReferenceNormalized: normalizeTransactionReference(reference),
          amountPaisaSnapshot: order.totalAmountPaisa,
          status: "PENDING",
          method: "PAYBOST",
          gatewayIdentifier: identifier,
        },
      });
      return created.id;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ALREADY_PAID") {
      return NextResponse.json({ error: "This order is already paid." }, { status: 409 });
    }
    if (message === "ALREADY_UNDER_REVIEW") {
      return NextResponse.json(
        { error: "This order already has a payment under review." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not start the payment." }, { status: 500 });
  }

  const base = appBaseUrl(request);
  const { siteLogoUrl } = getPaybostConfig();
  const returnBase = `${base}/dashboard/orders/${order.orderReference}`;

  const result = await initiatePaybostPayment({
    amount: paisaToAmountString(order.totalAmountPaisa),
    identifier,
    currency: "PKR",
    details: `Order ${order.orderReference} - ${order.planNameSnapshot}`.slice(0, 100),
    ipnUrl: `${base}/api/payment/gateway/ipn`,
    siteLogo: siteLogoUrl || `${base}/favicon.ico`,
    successUrl: `${returnBase}?pay=success`,
    cancelUrl: `${returnBase}?pay=cancel`,
    checkoutTheme: "dark",
    customerName: user.username,
    customerEmail: buildCustomerEmail(user, base),
  });

  if (!result.ok) {
    // Roll back the pending row only if the gateway never confirmed it.
    await prisma.paymentSubmission.deleteMany({
      where: { id: paymentId, status: "PENDING", gatewayTxnId: null },
    });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Move the order into the in-progress state. Conditional so a fast IPN that
  // already approved the order is never regressed.
  await prisma.purchaseOrder.updateMany({
    where: { id: order.id, status: { in: ["AWAITING_PAYMENT", "REJECTED"] } },
    data: { status: "PAYMENT_SUBMITTED", submittedAt: new Date() },
  });
  await createAuditLog({
    actorUserId: user.id,
    action: "PAYMENT_SUBMITTED",
    entityType: "PaymentSubmission",
    entityId: paymentId,
    metadata: {
      orderReference: order.orderReference,
      method: "PAYBOST",
      gatewayIdentifier: identifier,
    },
  });

  return NextResponse.json({ url: result.url });
}

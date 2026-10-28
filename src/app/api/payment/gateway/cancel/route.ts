import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/database/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { isActiveStatus } from "@/server/policies/authorization";
import { createAuditLog } from "@/server/services/audit";
import { appBaseUrl } from "@/server/services/paybost";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().optional(),
  identifier: z.string().optional(),
  orderReference: z.string().optional(),
});

/**
 * Cancel an abandoned online attempt so the customer can immediately pay another
 * way. Only ever touches a PENDING, UNCONFIRMED (gatewayTxnId IS NULL) Paybost
 * payment belonging to the caller — never a confirmed/approved one.
 */
export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || !isActiveStatus(session.user.status)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json ?? {});
  const { orderId, identifier, orderReference } = parsed.success
    ? parsed.data
    : { orderId: undefined, identifier: undefined, orderReference: undefined };

  const cancelled = await prisma.$transaction(async (tx) => {
    const pending = await tx.paymentSubmission.findFirst({
      where: {
        submittedByUserId: session.user.id,
        method: "PAYBOST",
        status: "PENDING",
        gatewayTxnId: null,
        ...(orderId ? { purchaseOrderId: orderId } : {}),
        ...(identifier ? { gatewayIdentifier: identifier } : {}),
        ...(orderReference ? { purchaseOrder: { orderReference } } : {}),
        purchaseOrder: { userId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      include: { purchaseOrder: true },
    });
    if (!pending) return null;

    const claim = await tx.paymentSubmission.updateMany({
      where: { id: pending.id, status: "PENDING", gatewayTxnId: null },
      data: {
        status: "REJECTED",
        gatewayStatus: "cancelled_by_user",
        rejectionReason: "Payment cancelled by user",
      },
    });
    if (claim.count !== 1) return null;

    // Return the order to a payable state so manual upload is unblocked.
    await tx.purchaseOrder.updateMany({
      where: { id: pending.purchaseOrderId, status: "PAYMENT_SUBMITTED" },
      data: { status: "AWAITING_PAYMENT" },
    });
    await createAuditLog(
      {
        actorUserId: session.user.id,
        action: "PAYMENT_REJECTED",
        entityType: "PaymentSubmission",
        entityId: pending.id,
        metadata: {
          reason: "cancelled_by_user",
          orderReference: pending.purchaseOrder.orderReference,
        },
      },
      tx,
    );
    return pending.id;
  });

  return NextResponse.json({ ok: true, cancelled: Boolean(cancelled) });
}

/**
 * Handles direct browser GET redirects from PayBost or cancellation links.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const identifier = url.searchParams.get("identifier") || url.searchParams.get("order_id");
  const orderRef =
    url.searchParams.get("orderReference") ||
    url.searchParams.get("order") ||
    url.searchParams.get("id");
  const base = appBaseUrl(request);

  const session = await getCurrentSession();

  let targetOrderRef = orderRef;

  try {
    const pending = await prisma.paymentSubmission.findFirst({
      where: {
        method: "PAYBOST",
        status: "PENDING",
        gatewayTxnId: null,
        ...(identifier ? { gatewayIdentifier: identifier } : {}),
        ...(orderRef ? { purchaseOrder: { orderReference: orderRef } } : {}),
        ...(session?.user ? { submittedByUserId: session.user.id } : {}),
      },
      include: { purchaseOrder: true },
      orderBy: { createdAt: "desc" },
    });

    if (pending) {
      targetOrderRef = pending.purchaseOrder.orderReference;
      await prisma.$transaction(async (tx) => {
        await tx.paymentSubmission.updateMany({
          where: { id: pending.id, status: "PENDING", gatewayTxnId: null },
          data: {
            status: "REJECTED",
            gatewayStatus: "cancelled_by_user",
            rejectionReason: "Payment cancelled by user",
          },
        });
        await tx.purchaseOrder.updateMany({
          where: { id: pending.purchaseOrderId, status: "PAYMENT_SUBMITTED" },
          data: { status: "AWAITING_PAYMENT" },
        });
      });
    }
  } catch {
    // ignore
  }

  const redirectUrl = targetOrderRef
    ? `${base}/dashboard/orders/${targetOrderRef}?pay=cancel`
    : `${base}/dashboard/orders?pay=cancel`;

  return NextResponse.redirect(redirectUrl);
}

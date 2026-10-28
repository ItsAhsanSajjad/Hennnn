import { NextResponse } from "next/server";

import { prisma } from "@/lib/database/prisma";
import { createAuditLog } from "@/server/services/audit";
import { applyApprovedPayment } from "@/server/services/payments";
import {
  amountStringToPaisa,
  getPaybostConfig,
  verifyIpnSignature,
} from "@/server/services/paybost";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Read the IPN body once and flatten it into a single lookup, tolerating both
 * form-urlencoded and JSON, and both nested spellings: data[amount] and data.amount.
 */
async function readIncoming(request: Request): Promise<Record<string, string>> {
  const raw = await request.text();
  const flat: Record<string, string> = {};

  try {
    const json = JSON.parse(raw);
    if (json && typeof json === "object") {
      for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          for (const [innerKey, innerValue] of Object.entries(value as Record<string, unknown>)) {
            flat[`${key}.${innerKey}`] = String(innerValue);
            flat[`${key}[${innerKey}]`] = String(innerValue);
          }
        } else {
          flat[key] = String(value);
        }
      }
      return flat;
    }
  } catch {
    // Not JSON — fall through to form parsing.
  }

  for (const [key, value] of new URLSearchParams(raw).entries()) {
    flat[key] = value;
  }
  return flat;
}

function pick(flat: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = flat[key];
    if (value !== undefined && value !== "") return value;
  }
  return undefined;
}

export async function POST(request: Request) {
  const { secretKey } = getPaybostConfig();
  if (!secretKey) {
    // Gateway not configured on this deployment: nothing to verify against.
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const flat = await readIncoming(request);
  const identifier = pick(flat, ["identifier", "data[identifier]", "data.identifier"]);
  const signature = pick(flat, ["signature", "data[signature]", "data.signature"]);
  const status = (pick(flat, ["status", "data[status]", "data.status"]) ?? "").toLowerCase();
  const rawAmount = pick(flat, ["data[amount]", "data.amount", "amount"]);
  const gatewayTxnId = pick(flat, [
    "data[transaction id]",
    "data[transaction_id]",
    "data[transactionId]",
    "data.transaction id",
    "data.transaction_id",
    "transaction_id",
    "txn_id",
  ]);

  if (!identifier || !signature || rawAmount === undefined) {
    return NextResponse.json({ error: "Malformed IPN." }, { status: 400 });
  }

  // AUTH: the signature is the only proof of authenticity (the endpoint is public
  // and unauthenticated). Verify with a constant-time compare over the raw amount.
  const signatureValid = verifyIpnSignature({
    rawAmount,
    identifier,
    signature,
    secretKey,
  });
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payment = await prisma.paymentSubmission.findUnique({
    where: { gatewayIdentifier: identifier },
    include: { purchaseOrder: true },
  });
  // Unknown identifier: return 200 so the gateway stops retrying.
  if (!payment) {
    return NextResponse.json({ ok: true, ignored: "unknown_identifier" });
  }

  // Idempotent: a repeat of an already-approved payment is a no-op success.
  if (payment.status === "APPROVED") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // AMOUNT INTEGRITY: the charged amount must match our stored snapshot exactly.
  // We always act on OUR stored amount, never the wire value.
  const wirePaisa = amountStringToPaisa(rawAmount);
  if (wirePaisa === null || wirePaisa !== payment.amountPaisaSnapshot) {
    await createAuditLog({
      actorUserId: null,
      action: "PAYMENT_REJECTED",
      entityType: "PaymentSubmission",
      entityId: payment.id,
      metadata: {
        reason: "amount_mismatch",
        wireAmount: rawAmount,
        storedPaisa: payment.amountPaisaSnapshot.toString(),
        gatewayIdentifier: identifier,
      },
    });
    return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
  }

  if (status === "success") {
    await prisma.$transaction(async (tx) => {
      // Atomically claim the PENDING row so concurrent retries no-op.
      const claim = await tx.paymentSubmission.updateMany({
        where: { id: payment.id, status: "PENDING", method: "PAYBOST" },
        data: { status: "UNDER_REVIEW", gatewayTxnId: gatewayTxnId ?? null, gatewayStatus: "success" },
      });
      if (claim.count !== 1) {
        // Another retry already handled it, or it is no longer PENDING.
        return;
      }
      const claimed = await tx.paymentSubmission.findUniqueOrThrow({
        where: { id: payment.id },
        include: { purchaseOrder: true },
      });
      await applyApprovedPayment(tx, claimed, { id: null });
    });
    return NextResponse.json({ ok: true, applied: true });
  }

  if (status === "failed" || status === "cancelled" || status === "canceled" || status === "error") {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.paymentSubmission.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          status: "REJECTED",
          gatewayStatus: status,
          gatewayTxnId: gatewayTxnId ?? null,
          rejectionReason: `Gateway returned status: ${status}`,
        },
      });
      if (claim.count !== 1) return;
      // Free the order so the customer can retry or pay manually.
      await tx.purchaseOrder.updateMany({
        where: { id: payment.purchaseOrderId, status: "PAYMENT_SUBMITTED" },
        data: { status: "AWAITING_PAYMENT" },
      });
      await tx.notification.create({
        data: {
          userId: payment.purchaseOrder.userId,
          type: "ACCOUNT",
          title: "Online payment not completed",
          message: `Your online payment for order ${payment.purchaseOrder.orderReference} did not go through. You can try again or pay another way.`,
          metadata: {
            orderReference: payment.purchaseOrder.orderReference,
            gatewayStatus: status,
          },
        },
      });
      await createAuditLog(
        {
          actorUserId: null,
          action: "PAYMENT_REJECTED",
          entityType: "PaymentSubmission",
          entityId: payment.id,
          metadata: { gatewayStatus: status, gatewayIdentifier: identifier },
        },
        tx,
      );
    });
    return NextResponse.json({ ok: true, rejected: true });
  }

  // Any other status is acknowledged but not acted on.
  return NextResponse.json({ ok: true, ignored: status || "unknown_status" });
}

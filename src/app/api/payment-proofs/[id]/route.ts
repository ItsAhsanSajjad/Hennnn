import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { canReviewPayments, isActiveStatus } from "@/server/policies/authorization";
import { readPrivateFile } from "@/server/services/private-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session?.user || !isActiveStatus(session.user.status)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;

  const { id } = await params;
  const proof = await prisma.paymentProof.findUnique({
    where: { id },
    include: {
      paymentSubmission: { include: { purchaseOrder: true } },
    },
  });
  if (!proof || proof.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = proof.paymentSubmission.purchaseOrder.userId === user.id;
  const isReviewer = canReviewPayments(user.role);
  if (!isOwner && !isReviewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The proof record can exist while the file is absent on this host (private
  // storage is per-server). Return 404 so the UI shows its graceful placeholder
  // rather than a 500 broken image.
  const file = await readPrivateFile(proof.storageKey).catch(() => null);
  if (!file) {
    return NextResponse.json(
      { error: "Proof file is not available on this server." },
      { status: 404 },
    );
  }
  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": proof.mimeType,
      "Content-Length": String(file.sizeBytes),
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${proof.safeFileName.replaceAll('"', "")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

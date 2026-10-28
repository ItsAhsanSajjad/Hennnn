import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime, formatPaisa } from "@/lib/utilities/format";
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  isActiveStatus,
} from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

function csvValue(value: string | number) {
  const normalized = String(value);
  const safeValue = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user || !isActiveStatus(session.user.status)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminPermission(session.user.role, ADMIN_PERMISSIONS.REPORTS_EXPORT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sales = await prisma.eggSaleRequest.findMany({
    orderBy: { submittedAt: "desc" },
    take: 10_000,
    include: {
      user: { select: { username: true, name: true, email: true, phone: true } },
      reviewedBy: { select: { username: true } },
      payouts: {
        select: { settlementReference: true, confirmedAt: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  const headers = [
    "Request reference",
    "Customer",
    "Contact",
    "Egg quantity",
    "Rate per egg",
    "Payable amount",
    "Payment method",
    "Masked account",
    "Status",
    "Reviewer",
    "Submitted date",
    "Payment date",
    "Payment status",
    "Transaction reference",
  ];
  const rows = sales.map((sale) => {
    const payout = sale.payouts[0];
    return [
      sale.publicReference,
      sale.user.name ?? sale.user.username,
      sale.user.phone ?? sale.user.email ?? "",
      sale.eggQuantity,
      formatPaisa(sale.ratePaisaPerEggSnapshot),
      formatPaisa(sale.totalAmountPaisa),
      sale.payoutProviderSnapshot ?? "",
      sale.payoutIdentifierMaskedSnapshot ?? "",
      sale.status,
      sale.reviewedBy?.username ?? "",
      formatDateTime(sale.submittedAt),
      formatDateTime(payout?.confirmedAt),
      payout?.status ?? "",
      payout?.settlementReference ?? "",
    ];
  });
  const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pakhen-egg-sales.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

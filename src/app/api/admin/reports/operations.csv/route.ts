import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session";
import { formatPaisa } from "@/lib/utilities/format";
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  isActiveStatus,
} from "@/server/policies/authorization";
import {
  getAdminOperationsReport,
  resolveAdminReportRange,
} from "@/server/services/admin-reporting";

export const dynamic = "force-dynamic";

function csvValue(value: string | number) {
  const normalized = String(value);
  const safeValue = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user || !isActiveStatus(session.user.status)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminPermission(session.user.role, ADMIN_PERMISSIONS.REPORTS_EXPORT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = resolveAdminReportRange(
    searchParams.get("from") ?? undefined,
    searchParams.get("to") ?? undefined,
  );
  const report = await getAdminOperationsReport(range);
  const rows: [string, string | number][] = [
    ["Report from", range.fromInput],
    ["Report to", range.toInput],
    ["Accounts created", report.accountsCreated],
    ["Orders created", report.ordersCreated],
    ["Payment submissions", report.paymentSubmissionCount],
    ["Payment submission amount", formatPaisa(report.paymentSubmissionAmount)],
    ["Egg-sale requests", report.eggSaleRequestCount],
    ["Egg quantity requested", report.eggSaleEggQuantity],
    ["Egg-sale amount snapshot", formatPaisa(report.eggSaleAmount)],
    ["Settlement records", report.settlementsRecordedCount],
    ["Settlement amount recorded", formatPaisa(report.settlementsRecordedAmount)],
    ["Confirmed settlements", report.settlementsConfirmed],
    ["Current active hens", report.activeHens],
    ["Audit events", report.auditEvents],
  ];
  const csv = [["Metric", "Value"], ...rows].map((row) => row.map(csvValue).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pakhen-operations-${range.fromInput}-to-${range.toInput}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

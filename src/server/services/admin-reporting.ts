import { prisma } from "@/lib/database/prisma";

export type AdminReportRange = {
  from: Date;
  toExclusive: Date;
  fromInput: string;
  toInput: string;
};

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateInput(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function resolveAdminReportRange(fromValue?: string, toValue?: string): AdminReportRange {
  const now = new Date();
  const defaultFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29),
  );
  const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = parseDateInput(fromValue) ?? defaultFrom;
  const requestedTo = parseDateInput(toValue) ?? defaultTo;
  const to = requestedTo < from ? from : requestedTo;
  const toExclusive = new Date(to);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

  return {
    from,
    toExclusive,
    fromInput: dateInput(from),
    toInput: dateInput(to),
  };
}

export async function getAdminOperationsReport(range: AdminReportRange) {
  const dateRange = { gte: range.from, lt: range.toExclusive };
  const [
    accountsCreated,
    ordersCreated,
    paymentSubmissions,
    eggSaleRequests,
    settlementsRecorded,
    settlementsConfirmed,
    activeHens,
    auditEvents,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: dateRange, deletedAt: null } }),
    prisma.purchaseOrder.count({ where: { createdAt: dateRange } }),
    prisma.paymentSubmission.aggregate({
      where: { submittedAt: dateRange },
      _count: { _all: true },
      _sum: { amountPaisaSnapshot: true },
    }),
    prisma.eggSaleRequest.aggregate({
      where: { submittedAt: dateRange },
      _count: { _all: true },
      _sum: { eggQuantity: true, totalAmountPaisa: true },
    }),
    prisma.payout.aggregate({
      where: { recordedAt: dateRange },
      _count: { _all: true },
      _sum: { amountPaisa: true },
    }),
    prisma.payout.count({ where: { confirmedAt: dateRange, status: "CONFIRMED" } }),
    prisma.henAsset.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.count({ where: { createdAt: dateRange } }),
  ]);

  return {
    accountsCreated,
    ordersCreated,
    paymentSubmissionCount: paymentSubmissions._count._all,
    paymentSubmissionAmount: paymentSubmissions._sum.amountPaisaSnapshot ?? 0n,
    eggSaleRequestCount: eggSaleRequests._count._all,
    eggSaleEggQuantity: eggSaleRequests._sum.eggQuantity ?? 0,
    eggSaleAmount: eggSaleRequests._sum.totalAmountPaisa ?? 0n,
    settlementsRecordedCount: settlementsRecorded._count._all,
    settlementsRecordedAmount: settlementsRecorded._sum.amountPaisa ?? 0n,
    settlementsConfirmed,
    activeHens,
    auditEvents,
  };
}

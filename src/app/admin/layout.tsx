import type { ReactNode } from "react";
import type { EggSaleStatus, PaymentSubmissionStatus, PurchaseOrderStatus } from "@prisma/client";

import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavigation } from "@/config/navigation";
import { prisma } from "@/lib/database/prisma";
import { requireAdminConsoleUser } from "@/lib/auth/session";
import { hasAdminPermission, roleLabels } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

// Only statuses that actually need the admin to act — so a badge counts down to
// zero as the queue is reviewed. Post-review states (order AWAITING_PAYMENT waits
// on the customer; egg-sale PAYMENT_PROCESSING is handled under Payouts) are excluded.
const reviewPaymentStatuses: PaymentSubmissionStatus[] = ["SUBMITTED", "UNDER_REVIEW"];
const reviewSaleStatuses: EggSaleStatus[] = ["AWAITING_REVIEW", "UNDER_REVIEW"];
const pendingOrderStatuses: PurchaseOrderStatus[] = ["PAYMENT_SUBMITTED", "UNDER_REVIEW"];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminConsoleUser();
  const visibleNav = adminNavigation.filter((item) =>
    hasAdminPermission(user.role, item.permission),
  );

  // Each badged section reports how many items need attention (count) and when the
  // newest one arrived (signal, epoch ms). The shell highlights a section only while
  // it has a pending item newer than the admin last opened it — so the badge clears
  // on open and returns when a newer item appears.
  const [paymentAgg, eggSaleAgg, payoutAgg, orderAgg] = await Promise.all([
    prisma.paymentSubmission.aggregate({
      where: { status: { in: reviewPaymentStatuses } },
      _count: true,
      _max: { createdAt: true },
    }),
    prisma.eggSaleRequest.aggregate({
      where: { status: { in: reviewSaleStatuses } },
      _count: true,
      _max: { createdAt: true },
    }),
    prisma.payout.aggregate({
      where: { status: "RECORDED" },
      _count: true,
      _max: { createdAt: true },
    }),
    prisma.purchaseOrder.aggregate({
      where: { status: { in: pendingOrderStatuses } },
      _count: true,
      _max: { createdAt: true },
    }),
  ]);

  const badgeByHref: Record<string, { count: number; signal: number }> = {
    "/admin/payments": {
      count: paymentAgg._count,
      signal: paymentAgg._max.createdAt?.getTime() ?? 0,
    },
    "/admin/egg-sales": {
      count: eggSaleAgg._count,
      signal: eggSaleAgg._max.createdAt?.getTime() ?? 0,
    },
    "/admin/settlements": {
      count: payoutAgg._count,
      signal: payoutAgg._max.createdAt?.getTime() ?? 0,
    },
    "/admin/orders": {
      count: orderAgg._count,
      signal: orderAgg._max.createdAt?.getTime() ?? 0,
    },
  };

  const nav = visibleNav.map((item) => {
    const info = badgeByHref[item.href];
    return {
      ...item,
      badge: info && info.count > 0 ? info.count : undefined,
      signal: info && info.count > 0 ? info.signal : undefined,
    };
  });

  return (
    <AdminShell nav={nav} username={user.username} roleLabel={roleLabels[user.role]}>
      {children}
    </AdminShell>
  );
}

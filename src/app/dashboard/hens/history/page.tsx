import { prisma } from "@/lib/database/prisma";
import { requireUser } from "@/lib/auth/session";
import { HenHistoryClient, HenRecord } from "@/components/history/hen-history-client";

export const dynamic = "force-dynamic";

export default async function HenHistoryPage() {
  const user = await requireUser();

  const [hens, pendingOrders, aggregates] = await Promise.all([
    prisma.henAsset.findMany({
      where: { userId: user.id },
      include: {
        henPlan: true,
        purchaseOrder: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchaseOrder.findMany({
      where: {
        userId: user.id,
        status: { in: ["AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "UNDER_REVIEW"] },
      },
      include: {
        henPlan: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.$queryRaw<
      {
        totalApprovedHens: number;
        activeHens: number;
        expiredHens: number;
        totalProduced: number;
      }[]
    >`
      SELECT
        COALESCE(SUM("quantity"), 0)::int AS "totalApprovedHens",
        COALESCE(SUM(CASE WHEN "status" = 'ACTIVE' THEN "quantity" ELSE 0 END), 0)::int AS "activeHens",
        COALESCE(SUM(CASE WHEN "status" IN ('EXPIRED', 'COMPLETED') THEN "quantity" ELSE 0 END), 0)::int AS "expiredHens",
        COALESCE(SUM("totalEggUnitsProduced"), 0)::int AS "totalProduced"
      FROM "HenAsset"
      WHERE "userId" = ${user.id}::uuid
    `,
  ]);

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Expiring soon individual hens
  const expiringSoonHensCount = hens
    .filter(
      (h) =>
        h.status === "ACTIVE" &&
        h.productionEndDate &&
        new Date(h.productionEndDate) <= sevenDaysFromNow
    )
    .reduce((sum, h) => sum + h.quantity, 0);

  // Pending individual hens from pending orders
  const pendingHensCount = pendingOrders.reduce((sum, o) => sum + o.quantity, 0);

  // Map approved hen assets to HenRecord
  const approvedRecords: HenRecord[] = hens.map((hen) => {
    const isExpiringSoon =
      hen.status === "ACTIVE" &&
      hen.productionEndDate !== null &&
      new Date(hen.productionEndDate) <= sevenDaysFromNow;

    const endDate = hen.productionEndDate ? new Date(hen.productionEndDate) : null;
    let remainingDays: number | null = null;
    if (endDate && hen.status === "ACTIVE") {
      remainingDays = Math.max(
        0,
        Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    const validityDays = hen.henPlan.validityDays || 125;
    const daysCompleted = hen.activatedAt
      ? Math.min(
          validityDays,
          Math.max(
            0,
            Math.floor((now.getTime() - new Date(hen.activatedAt).getTime()) / (1000 * 60 * 60 * 24))
          )
        )
      : 0;

    const cycleProgressPercent =
      hen.status === "ACTIVE"
        ? Math.min(100, Math.max(1, Math.round((daysCompleted / validityDays) * 100)))
        : hen.status === "EXPIRED" || hen.status === "COMPLETED"
        ? 100
        : 0;

    const purchasePriceRs = hen.purchaseOrder?.totalAmountPaisa
      ? Math.round(Number(hen.purchaseOrder.totalAmountPaisa) / 100)
      : Math.round((Number(hen.henPlan.pricePaisa) * hen.quantity) / 100);

    const unitPriceRs = hen.purchaseOrder?.unitPricePaisa
      ? Math.round(Number(hen.purchaseOrder.unitPricePaisa) / 100)
      : Math.round(Number(hen.henPlan.pricePaisa) / 100);

    return {
      id: hen.id,
      assetTag: `HEN-${hen.id.slice(0, 8).toUpperCase()}`,
      planName: hen.henPlan.name,
      quantity: hen.quantity,
      status: hen.status,
      dailyEggUnitsPerHen: hen.dailyEggUnitsPerHen || hen.henPlan.dailyEggUnits || 1,
      totalEggUnitsProduced: hen.totalEggUnitsProduced,
      productionCycleDaysTotal: validityDays,
      productionCycleDaysRemaining: remainingDays,
      daysCompleted,
      cycleProgressPercent,
      purchaseDate: hen.createdAt.toISOString(),
      activatedAt: hen.activatedAt ? hen.activatedAt.toISOString() : null,
      productionStartDate: hen.productionStartDate ? hen.productionStartDate.toISOString() : null,
      productionEndDate: hen.productionEndDate ? hen.productionEndDate.toISOString() : null,
      completedAt: hen.completedAt ? hen.completedAt.toISOString() : null,
      orderReference:
        hen.purchaseOrder?.orderReference || `ORD-${hen.purchaseOrderId.slice(0, 8).toUpperCase()}`,
      orderId: hen.purchaseOrderId,
      purchasePriceRs,
      unitPriceRs,
      paymentStatus: hen.purchaseOrder?.status || "APPROVED",
      isExpiringSoon,
      isPendingOrder: false,
    };
  });

  // Map pending orders to HenRecord (for full visibility in Pending tab)
  const pendingRecords: HenRecord[] = pendingOrders.map((order) => {
    const validityDays = order.validityDaysSnapshot || order.henPlan.validityDays || 125;
    const purchasePriceRs = Math.round(Number(order.totalAmountPaisa) / 100);
    const unitPriceRs = Math.round(Number(order.unitPricePaisa) / 100);

    return {
      id: order.id,
      assetTag: `PEND-${order.id.slice(0, 8).toUpperCase()}`,
      planName: order.planNameSnapshot || order.henPlan.name,
      quantity: order.quantity,
      status: (order.status === "UNDER_REVIEW" || order.status === "PAYMENT_SUBMITTED"
        ? "UNDER_REVIEW"
        : "PENDING_PAYMENT") as HenRecord["status"],
      dailyEggUnitsPerHen: order.dailyEggUnitsSnapshot || order.henPlan.dailyEggUnits || 1,
      totalEggUnitsProduced: 0,
      productionCycleDaysTotal: validityDays,
      productionCycleDaysRemaining: validityDays,
      daysCompleted: 0,
      cycleProgressPercent: 0,
      purchaseDate: order.createdAt.toISOString(),
      activatedAt: null,
      productionStartDate: null,
      productionEndDate: null,
      completedAt: null,
      orderReference: order.orderReference,
      orderId: order.id,
      purchasePriceRs,
      unitPriceRs,
      paymentStatus: order.status,
      isExpiringSoon: false,
      isPendingOrder: true,
    };
  });

  const allRecords = [...approvedRecords, ...pendingRecords];

  const totalHensPurchased = Number(aggregates[0]?.totalApprovedHens ?? 0);
  const activeHensCount = Number(aggregates[0]?.activeHens ?? 0);
  const expiredHensCount = Number(aggregates[0]?.expiredHens ?? 0);
  const totalEggsProduced = Number(aggregates[0]?.totalProduced ?? 0);

  // Flock batch counts
  const totalFlocksCount = allRecords.length;
  const activeFlocksCount = approvedRecords.filter((r) => r.status === "ACTIVE").length;
  const expiringSoonFlocksCount = approvedRecords.filter((r) => r.isExpiringSoon).length;
  const expiredFlocksCount = approvedRecords.filter(
    (r) => r.status === "EXPIRED" || r.status === "COMPLETED"
  ).length;
  const pendingFlocksCount =
    pendingRecords.length +
    approvedRecords.filter((r) => r.status === "PENDING_ACTIVATION").length;

  // Flock Overview calculations
  const activeCapacityPercent =
    totalHensPurchased > 0
      ? Math.min(100, Math.round((activeHensCount / totalHensPurchased) * 100))
      : 0;

  const dailyEggProduction = activeHensCount * 1;

  // Nearest expiry in days
  const activeWithExpiry = approvedRecords.filter(
    (r) => r.status === "ACTIVE" && r.productionCycleDaysRemaining !== null
  );
  const nearestExpiryDays =
    activeWithExpiry.length > 0
      ? Math.min(...activeWithExpiry.map((r) => r.productionCycleDaysRemaining!))
      : null;

  // Average cycle progress of active flocks
  const activeRecords = approvedRecords.filter((r) => r.status === "ACTIVE");
  const averageCycleProgress =
    activeRecords.length > 0
      ? Math.round(
          activeRecords.reduce((sum, r) => sum + r.cycleProgressPercent, 0) / activeRecords.length
        )
      : 0;

  return (
    <HenHistoryClient
      records={allRecords}
      totalHensPurchased={totalHensPurchased}
      activeHensCount={activeHensCount}
      expiringSoonHensCount={expiringSoonHensCount}
      expiredHensCount={expiredHensCount}
      pendingHensCount={pendingHensCount}
      totalEggsProduced={totalEggsProduced}
      totalFlocksCount={totalFlocksCount}
      activeFlocksCount={activeFlocksCount}
      expiringSoonFlocksCount={expiringSoonFlocksCount}
      expiredFlocksCount={expiredFlocksCount}
      pendingFlocksCount={pendingFlocksCount}
      activeCapacityPercent={activeCapacityPercent}
      dailyEggProduction={dailyEggProduction}
      nearestExpiryDays={nearestExpiryDays}
      averageCycleProgress={averageCycleProgress}
    />
  );
}

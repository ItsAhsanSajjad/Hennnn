import { notFound } from "next/navigation";

import { BuyHensFlow, type PlanData } from "@/components/phase2/buy-hens-flow";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPlansPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string }>;
}) {
  await requireUser();
  const search = searchParams ? await searchParams : undefined;
  const preselectedPlanSlug = search?.plan;

  const plans = await prisma.henPlan.findMany({
    where: { status: "ACTIVE", isActive: true, archivedAt: null },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
  });

  const activePlan =
    plans.find((p) => p.slug === preselectedPlanSlug) ||
    plans.find((p) => p.isFeatured) ||
    plans[0];

  if (!activePlan) {
    notFound();
  }

  const planData: PlanData = {
    id: activePlan.id,
    name: activePlan.name,
    code: activePlan.code,
    slug: activePlan.slug,
    pricePaisa: activePlan.pricePaisa.toString(),
    dailyEggUnits: activePlan.dailyEggUnits,
    maximumEggUnits: activePlan.maximumEggUnits,
    validityDays: activePlan.validityDays,
    minimumQuantity: activePlan.minimumQuantity,
    maximumQuantity: activePlan.maximumQuantity,
  };

  return (
    <div className="animate-in fade-in duration-300">
      <BuyHensFlow plan={planData} />
    </div>
  );
}

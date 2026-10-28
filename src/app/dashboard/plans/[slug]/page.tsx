import { notFound } from "next/navigation";

import { BuyHensFlow, type PlanData } from "@/components/phase2/buy-hens-flow";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPlanDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser();
  const { slug } = await params;

  const targetPlan = await prisma.henPlan.findFirst({
    where: { slug, status: "ACTIVE", isActive: true, archivedAt: null },
  });

  if (!targetPlan) notFound();

  const planData: PlanData = {
    id: targetPlan.id,
    name: targetPlan.name,
    code: targetPlan.code,
    slug: targetPlan.slug,
    pricePaisa: targetPlan.pricePaisa.toString(),
    dailyEggUnits: targetPlan.dailyEggUnits,
    maximumEggUnits: targetPlan.maximumEggUnits,
    validityDays: targetPlan.validityDays,
    minimumQuantity: targetPlan.minimumQuantity,
    maximumQuantity: targetPlan.maximumQuantity,
  };

  return (
    <div className="animate-in fade-in duration-300">
      <BuyHensFlow plan={planData} />
    </div>
  );
}

import { notFound } from "next/navigation";

import { HenPlanForm } from "@/components/phase2/hen-plan-form";
import { prisma } from "@/lib/database/prisma";
import { requireAdminPermission } from "@/lib/auth/session";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function EditHenPlanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPermission(ADMIN_PERMISSIONS.PLANS_MANAGE);
  const { id } = await params;
  const plan = await prisma.henPlan.findUnique({ where: { id } });
  if (!plan) notFound();

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-3xl font-black text-forest">{plan.name}</h1>
      </section>
      <HenPlanForm plan={plan} />
    </div>
  );
}

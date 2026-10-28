import { HenPlanForm } from "@/components/phase2/hen-plan-form";
import { requireAdminPermission } from "@/lib/auth/session";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function NewHenPlanPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.PLANS_MANAGE);
  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-3xl font-black text-forest">New hen plan</h1>
      </section>
      <HenPlanForm />
    </div>
  );
}

import Link from "next/link";
import { BadgePercent, Plus, Sprout } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PlanPromotionForm } from "@/components/phase2/plan-promotion-form";
import { PurchaseDiscountTiersForm } from "@/components/phase2/purchase-discount-tiers-form";
import { PublicPlanPackageSettingsForm } from "@/components/phase2/public-plan-package-settings-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/database/prisma";
import { requireAdminPermission } from "@/lib/auth/session";
import { formatPaisa } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { getPlanPromotions } from "@/server/services/plan-promotions";
import { getPurchaseDiscountTiers } from "@/server/services/purchase-discount-tiers";
import { getPublicPlanPackageSettings } from "@/server/services/public-plan-package-settings";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.PLANS_VIEW);
  const [plans, promotions, packageSettings, purchaseDiscountTiers] = await Promise.all([
    prisma.henPlan.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    }),
    getPlanPromotions(),
    getPublicPlanPackageSettings(),
    getPurchaseDiscountTiers(),
  ]);
  const publishedBasePlan = plans.find(
    (plan) => plan.status === "ACTIVE" && plan.isActive && !plan.archivedAt,
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={Sprout}
        eyebrow="Poultry catalogue"
        title="Plans and offers"
        description="Create publishable poultry plans and control the customer offers displayed on the website and applied to new orders."
        actions={
          <ButtonLink href="/admin/plans/new" className="min-h-11">
            <Plus aria-hidden="true" size={17} /> New plan
          </ButtonLink>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)]">
        <section className="overflow-hidden rounded-lg border border-mist bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
            <div>
              <h2 className="font-extrabold text-forest">Published plan catalogue</h2>
              <p className="mt-1 text-sm text-charcoal/65">
                Active plans appear on the customer site.
              </p>
            </div>
            <BadgePercent aria-hidden="true" className="text-leaf" size={22} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-ivory text-xs uppercase tracking-normal text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {plans.map((plan) => {
                  const promotion = promotions.find(
                    (candidate) => candidate.planId === plan.id && candidate.isActive,
                  );
                  return (
                    <tr key={plan.id}>
                      <td className="px-4 py-3 font-semibold text-charcoal">{plan.code}</td>
                      <td className="px-4 py-3 text-charcoal/70">{plan.name}</td>
                      <td className="px-4 py-3 text-charcoal/70">{formatPaisa(plan.pricePaisa)}</td>
                      <td className="px-4 py-3">
                        {promotion ? (
                          <span className="font-semibold text-leaf">
                            {promotion.label} (-{formatPaisa(BigInt(promotion.discountPaisaPerHen))}
                            )
                          </span>
                        ) : (
                          <span className="text-charcoal/50">No active offer</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={plan.isActive ? "success" : "neutral"}>
                          {plan.status}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/plans/${plan.id}`} className="font-bold text-forest">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="grid h-fit gap-6 xl:sticky xl:top-24">
          <PublicPlanPackageSettingsForm plan={publishedBasePlan} cards={packageSettings} />
          <PurchaseDiscountTiersForm tiers={purchaseDiscountTiers} />
          <PlanPromotionForm plans={plans} promotions={promotions} />
        </aside>
      </div>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";

import { PublicPlanCard } from "@/components/marketing/public-plan-card";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { prisma } from "@/lib/database/prisma";
import { buildPublicPlanPackages } from "@/lib/utilities/plan-packages";
import { getPlanPromotions } from "@/server/services/plan-promotions";
import { getPublicPlanPackageSettings } from "@/server/services/public-plan-package-settings";
import { getPurchaseDiscountTiers } from "@/server/services/purchase-discount-tiers";

export const revalidate = 60;

export default async function PublicPlansPage() {
  const [plans, promotions, packageSettings, purchaseDiscountTiers] = await Promise.all([
    prisma.henPlan.findMany({
      where: { status: "ACTIVE", isActive: true, archivedAt: null },
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
    }),
    getPlanPromotions(),
    getPublicPlanPackageSettings(),
    getPurchaseDiscountTiers(),
  ]);
  const packages = buildPublicPlanPackages(
    plans,
    promotions,
    packageSettings,
    purchaseDiscountTiers,
  );

  return (
    <div className="gme-site min-h-screen">
      <PublicHeader />
      <main>
        <section className="border-b border-[var(--border-default)] bg-[var(--surface-dark)] text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <p className="text-xs font-bold uppercase tracking-[.08em] text-[#f4c45b]">
              GrowMeta Poultry Plans
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">
              Choose a Plan That Matches Your Budget
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Apne budget ke mutabiq plan choose karein. Every total shown here is calculated from
              the active server plan before you continue.
            </p>
          </div>
        </section>
        <section className="bg-[var(--surface-muted)]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            {packages.length ? (
              <div className="grid gap-5 lg:grid-cols-3">
                {packages.map((item) => (
                  <div key={item.key} className="gme-reveal">
                    <PublicPlanCard item={item} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-[var(--border-default)] bg-surface p-8 text-center">
                <ShieldCheck
                  className="mx-auto text-[var(--brand-primary)]"
                  size={28}
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-xl font-extrabold">No active plan is published</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  The plan catalogue shows only plans published by the operating team.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

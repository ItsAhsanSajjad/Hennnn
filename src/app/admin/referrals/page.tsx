import { Gift, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.REFERRALS_VIEW);
  const rewards = await prisma.referralReward.findMany({
    include: { inviter: true, invitee: true, qualifyingPurchaseOrder: true, rule: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Users}
        eyebrow="Referral operations"
        title="Referrals"
        description="Review qualifying direct referral rewards and their source orders. Reward amounts are determined by the stored rule and remain traceable through the ledger."
      />
      <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
        <div className="border-b border-mist px-5 py-4">
          <h2 className="font-extrabold text-forest">Reward register</h2>
        </div>
        {rewards.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3">Referred customer</th>
                  <th className="px-4 py-3">Qualifying order</th>
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">Egg reward</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Qualified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3 font-bold text-forest">{reward.inviter.username}</td>
                    <td className="px-4 py-3 text-charcoal/70">{reward.invitee.username}</td>
                    <td className="px-4 py-3 font-semibold text-charcoal">
                      {reward.qualifyingPurchaseOrder.orderReference}
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">{reward.rule.name}</td>
                    <td className="px-4 py-3 font-bold text-charcoal">{reward.rewardEggUnits}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={reward.status === "CREDITED" ? "success" : "pending"}>
                        {reward.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-charcoal/65">
                      {formatDateTime(reward.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Gift}
              title="No referral rewards yet"
              message="Qualified rewards will appear here after their source order is approved."
            />
          </div>
        )}
      </section>
    </div>
  );
}

import { EmptyState } from "@/components/shared/empty-state";
import { requireAdminConsoleUser } from "@/lib/auth/session";
import { LockKeyhole } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FutureModulesPage() {
  await requireAdminConsoleUser();

  return (
    <section className="rounded-lg border border-mist bg-surface p-6">
      <h1 className="text-3xl font-black text-forest">Future modules</h1>
      <div className="mt-6">
        <EmptyState
          icon={LockKeyhole}
          title="Transactional tools are disabled"
          message="Payment review, hen activation, egg ledger processing, sales, payouts, and referral rewards are planned for later phases after business rules and compliance requirements are approved."
        />
      </div>
    </section>
  );
}

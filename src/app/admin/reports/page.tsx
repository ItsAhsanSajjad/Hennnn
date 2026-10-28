import Link from "next/link";
import {
  BarChart3,
  CalendarRange,
  Download,
  FileCheck,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requireAdminPermission } from "@/lib/auth/session";
import { formatPaisa } from "@/lib/utilities/format";
import {
  ADMIN_PERMISSIONS,
  canAccessAdmin,
  hasAdminPermission,
} from "@/server/policies/authorization";
import {
  getAdminOperationsReport,
  resolveAdminReportRange,
} from "@/server/services/admin-reporting";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function AdminReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireAdminPermission(ADMIN_PERMISSIONS.REPORTS_VIEW);
  const params = await searchParams;
  const range = resolveAdminReportRange(params.from, params.to);
  const report = await getAdminOperationsReport(range);
  const canExport = hasAdminPermission(user.role, ADMIN_PERMISSIONS.REPORTS_EXPORT);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={BarChart3}
        eyebrow="Operational reporting"
        title="Reports"
        description="A date-bounded operational summary of records in GrowMeta Egg. It is an internal reporting view, not a revenue statement or external settlement confirmation."
        actions={
          canExport ? (
            <Link
              href={`/api/admin/reports/operations.csv?from=${range.fromInput}&to=${range.toInput}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--surface-dark)] px-4 text-sm font-bold text-white hover:bg-leaf"
            >
              <Download aria-hidden="true" size={18} />
              Export CSV
            </Link>
          ) : null
        }
      />

      <form className="grid gap-3 rounded-lg border border-mist bg-surface p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid gap-2 text-sm font-bold text-charcoal" htmlFor="report-from">
          From
          <input
            id="report-from"
            name="from"
            type="date"
            defaultValue={range.fromInput}
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium text-charcoal outline-none focus:border-leaf"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-charcoal" htmlFor="report-to">
          To
          <input
            id="report-to"
            name="to"
            type="date"
            defaultValue={range.toInput}
            className="min-h-11 rounded-md border border-mist px-3 text-sm font-medium text-charcoal outline-none focus:border-leaf"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit">
            <CalendarRange aria-hidden="true" size={18} />
            Run report
          </Button>
        </div>
      </form>

      <section className="rounded-lg border border-mist bg-ivory px-5 py-4 text-sm text-charcoal/70">
        Reporting period: <span className="font-bold text-forest">{range.fromInput}</span> to{" "}
        <span className="font-bold text-forest">{range.toInput}</span>. Counts use records created
        or submitted inside this window; active hens are a current-status count.
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
        <AdminMetricCard
          icon={Users}
          label="Accounts created"
          value={report.accountsCreated}
          detail="New active or inactive account records in the period"
        />
        <AdminMetricCard
          icon={ReceiptText}
          label="Orders created"
          value={report.ordersCreated}
          detail="Purchase orders created in the period"
          tone="amber"
        />
        <AdminMetricCard
          icon={FileCheck}
          label="Payment submissions"
          value={report.paymentSubmissionCount}
          detail={formatPaisa(report.paymentSubmissionAmount) + " snapshot amount submitted"}
          tone="blue"
        />
        <AdminMetricCard
          icon={WalletCards}
          label="Settlement records"
          value={report.settlementsRecordedCount}
          detail={formatPaisa(report.settlementsRecordedAmount) + " manually recorded"}
          tone="rose"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BarChart3 aria-hidden="true" className="text-leaf" size={21} />
            <div>
              <h2 className="font-extrabold text-forest">Egg-sale workflow</h2>
              <p className="mt-1 text-xs text-charcoal/60">
                Request volumes and captured snapshots for this period.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Requests", report.eggSaleRequestCount],
              ["Egg quantity", report.eggSaleEggQuantity],
              ["Amount snapshot", formatPaisa(report.eggSaleAmount)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-mist bg-ivory p-4">
                <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                  {label}
                </dt>
                <dd className="mt-2 text-lg font-extrabold text-forest">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden="true" className="text-leaf" size={21} />
            <div>
              <h2 className="font-extrabold text-forest">Control and activity</h2>
              <p className="mt-1 text-xs text-charcoal/60">
                Current asset state and recorded actions.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Active hens", report.activeHens],
              ["Confirmed settlements", report.settlementsConfirmed],
              ["Audit events", report.auditEvents],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-mist bg-ivory p-4">
                <dt className="text-xs font-bold uppercase tracking-normal text-charcoal/55">
                  {label}
                </dt>
                <dd className="mt-2 text-lg font-extrabold text-forest">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      </section>

      {!canExport && !canAccessAdmin(user.role) ? (
        <p className="text-sm text-charcoal/60">
          CSV export is limited to operations administrators and super administrators.
        </p>
      ) : null}
    </div>
  );
}

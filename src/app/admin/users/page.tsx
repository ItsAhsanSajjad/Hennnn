import Link from "next/link";
import { Search, ShieldCheck, UserRound, Users } from "lucide-react";
import type { Prisma, UserRole, UserStatus } from "@prisma/client";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS, roleLabels } from "@/server/policies/authorization";

const roles: UserRole[] = ["USER", "VIEWER", "SUPPORT", "FINANCE", "ADMIN", "SUPER_ADMIN"];
const statuses: UserStatus[] = ["PENDING", "ACTIVE", "SUSPENDED", "DISABLED"];

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; role?: UserRole; status?: UserStatus }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPermission(ADMIN_PERMISSIONS.USERS_VIEW);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const role = roles.includes(params.role as UserRole) ? params.role : undefined;
  const status = statuses.includes(params.status as UserStatus) ? params.status : undefined;
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { usernameNormalized: { contains: query.toLowerCase(), mode: "insensitive" } },
            { phoneE164: { contains: query } },
            { referralCode: { contains: query.toUpperCase() } },
          ],
        }
      : {}),
  };

  const [users, activeCount, pendingCount, suspendedCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 75,
    }),
    prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.user.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.user.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
  ]);

  return (
    <div className="grid gap-7">
      <AdminPageHeader
        icon={Users}
        eyebrow="Account operations"
        title="User directory"
        description="Search customer and staff records, review current account state, and open a controlled profile view for account support or role management."
      />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="User account summary">
        <AdminMetricCard
          icon={UserRound}
          label="Active accounts"
          value={activeCount}
          detail="Enabled customer and staff records"
        />
        <AdminMetricCard
          icon={ShieldCheck}
          label="Pending accounts"
          value={pendingCount}
          detail="Accounts awaiting a status change"
          tone="amber"
        />
        <AdminMetricCard
          icon={ShieldCheck}
          label="Suspended accounts"
          value={suspendedCount}
          detail="Records currently restricted from sign-in"
          tone="rose"
        />
      </section>

      <form className="grid gap-3 rounded-lg border border-mist bg-surface p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_180px_180px_auto_auto]">
        <label className="sr-only" htmlFor="user-search">
          Search users
        </label>
        <input
          id="user-search"
          name="q"
          defaultValue={query}
          placeholder="Search username, phone, referral"
          className="min-h-11 rounded-md border border-mist bg-surface px-3 text-sm text-charcoal outline-none placeholder:text-charcoal/45 focus:border-leaf"
        />
        <label className="sr-only" htmlFor="user-role">
          Filter by role
        </label>
        <select
          id="user-role"
          name="role"
          defaultValue={role ?? ""}
          className="min-h-11 cursor-pointer rounded-md border border-mist bg-surface px-3 text-sm text-charcoal outline-none focus:border-leaf"
        >
          <option value="">All roles</option>
          {roles.map((item) => (
            <option key={item} value={item}>
              {roleLabels[item]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="user-status">
          Filter by status
        </label>
        <select
          id="user-status"
          name="status"
          defaultValue={status ?? ""}
          className="min-h-11 cursor-pointer rounded-md border border-mist bg-surface px-3 text-sm text-charcoal outline-none focus:border-leaf"
        >
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button type="submit">
          <Search aria-hidden="true" size={17} />
          Filter
        </Button>
        <ButtonLink href="/admin/users" variant="secondary">
          Clear
        </ButtonLink>
      </form>

      <section className="overflow-hidden rounded-lg border border-mist bg-surface shadow-sm">
        <div className="flex flex-col gap-1 border-b border-mist px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold text-forest">Account records</h2>
            <p className="mt-1 text-xs text-charcoal/60">
              Showing up to 75 most recent matching records
            </p>
          </div>
          <p className="text-xs text-charcoal/55">
            {users.length} result{users.length === 1 ? "" : "s"}
          </p>
        </div>

        {users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase tracking-normal text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Referral code</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" aria-label="Open user" />
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {users.map((account) => (
                  <tr key={account.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <p className="font-bold text-forest">{account.username}</p>
                      <p className="mt-1 text-xs text-charcoal/55">
                        Last sign-in: {formatDateTime(account.lastLoginAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">{account.phoneE164}</td>
                    <td className="px-4 py-3 text-charcoal/70">{account.referralCode}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={account.role === "USER" ? "neutral" : "info"}>
                        {roleLabels[account.role]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={
                          account.status === "ACTIVE"
                            ? "success"
                            : account.status === "SUSPENDED" || account.status === "DISABLED"
                              ? "danger"
                              : "pending"
                        }
                      >
                        {account.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-charcoal/65">
                      {formatDateTime(account.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${account.id}`}
                        className="inline-flex min-h-10 items-center rounded-md border border-mist px-3 text-xs font-bold text-forest hover:bg-ivory"
                      >
                        View profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users aria-hidden="true" className="mx-auto text-leaf" size={28} />
            <h2 className="mt-3 text-lg font-extrabold text-forest">No account records match</h2>
            <p className="mt-2 text-sm text-charcoal/65">
              Try another search term or clear the filters.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

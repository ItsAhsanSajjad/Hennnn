"use client";

import { useActionState } from "react";
import type { UserRole, UserStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { FormStatus, SelectInput } from "@/components/ui/forms";
import { updateUserRoleAction, updateUserStatusAction } from "@/server/actions/admin";
import { initialActionState } from "@/server/actions/types";
import { getAssignableRoles, roleLabels } from "@/server/policies/authorization";

const roles: UserRole[] = ["USER", "VIEWER", "SUPPORT", "FINANCE", "ADMIN", "SUPER_ADMIN"];
const statuses: UserStatus[] = ["PENDING", "ACTIVE", "SUSPENDED", "DISABLED"];

export function UserControls({
  userId,
  role,
  status,
  actorRole,
}: {
  userId: string;
  role: UserRole;
  status: UserStatus;
  actorRole: UserRole;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    updateUserStatusAction,
    initialActionState,
  );
  const [roleState, roleAction, rolePending] = useActionState(
    updateUserRoleAction,
    initialActionState,
  );
  const assignableRoles = getAssignableRoles(actorRole);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form
        action={statusAction}
        onSubmit={(event) => {
          if (!window.confirm("Apply this account-status change?")) event.preventDefault();
        }}
        className="rounded-lg border border-mist bg-surface p-4"
      >
        <input type="hidden" name="userId" value={userId} />
        <label htmlFor="status" className="text-sm font-semibold text-charcoal">
          Account status
        </label>
        <div className="mt-2 flex gap-2">
          <SelectInput id="status" name="status" defaultValue={status}>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectInput>
          <Button type="submit" disabled={statusPending}>
            Save
          </Button>
        </div>
        <label
          className="mt-3 grid gap-1 text-xs font-semibold text-charcoal/70"
          htmlFor="status-reason"
        >
          Internal reason
          <input
            id="status-reason"
            name="reason"
            required
            minLength={5}
            placeholder="Reason for this account change"
            className="min-h-10 rounded-md border border-mist px-3 text-sm outline-none focus:border-leaf"
          />
        </label>
        <div className="mt-3">
          <FormStatus state={statusState} />
        </div>
      </form>

      <form
        action={roleAction}
        onSubmit={(event) => {
          if (!window.confirm("Apply this role change?")) event.preventDefault();
        }}
        className="rounded-lg border border-mist bg-surface p-4"
      >
        <input type="hidden" name="userId" value={userId} />
        <label htmlFor="role" className="text-sm font-semibold text-charcoal">
          Role
        </label>
        <div className="mt-2 flex gap-2">
          <SelectInput id="role" name="role" defaultValue={role}>
            {[role, ...roles.filter((item) => item !== role && assignableRoles.includes(item))].map(
              (item) => (
                <option key={item} value={item}>
                  {roleLabels[item]}
                </option>
              ),
            )}
          </SelectInput>
          <Button type="submit" disabled={rolePending}>
            Save
          </Button>
        </div>
        <label
          className="mt-3 grid gap-1 text-xs font-semibold text-charcoal/70"
          htmlFor="role-reason"
        >
          Internal reason
          <input
            id="role-reason"
            name="reason"
            required
            minLength={5}
            placeholder="Reason for this role change"
            className="min-h-10 rounded-md border border-mist px-3 text-sm outline-none focus:border-leaf"
          />
        </label>
        <div className="mt-3">
          <FormStatus state={roleState} />
        </div>
      </form>
    </div>
  );
}

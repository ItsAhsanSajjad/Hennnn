import { describe, expect, it } from "vitest";

import {
  ADMIN_PERMISSIONS,
  canAccessAdmin,
  canAccessOperations,
  canAdjustLedger,
  canManageReferralRules,
  canManagePlans,
  canManageSaleRates,
  canManageRole,
  canRecordSettlements,
  canReviewPayments,
  canReviewEggSales,
  canRunReconciliation,
  canViewOwnResource,
  getAssignableRoles,
  hasAdminPermission,
  isActiveStatus,
} from "@/server/policies/authorization";

describe("authorization policies", () => {
  it("allows only authorized console roles into the admin area", () => {
    expect(canAccessAdmin("USER")).toBe(false);
    expect(canAccessAdmin("SUPPORT")).toBe(true);
    expect(canAccessAdmin("FINANCE")).toBe(true);
    expect(canAccessAdmin("ADMIN")).toBe(true);
    expect(canAccessAdmin("SUPER_ADMIN")).toBe(true);
  });

  it("allows finance and admin roles into operations", () => {
    expect(canAccessOperations("USER")).toBe(false);
    expect(canAccessOperations("VIEWER")).toBe(true);
    expect(canAccessOperations("SUPPORT")).toBe(true);
    expect(canReviewPayments("FINANCE")).toBe(true);
    expect(canReviewEggSales("FINANCE")).toBe(true);
    expect(canRecordSettlements("FINANCE")).toBe(true);
    expect(canReviewPayments("ADMIN")).toBe(true);
    expect(canManagePlans("FINANCE")).toBe(false);
    expect(canManagePlans("ADMIN")).toBe(true);
    expect(canManageSaleRates("FINANCE")).toBe(false);
    expect(canManageSaleRates("ADMIN")).toBe(true);
    expect(canManageReferralRules("ADMIN")).toBe(true);
    expect(canRunReconciliation("ADMIN")).toBe(true);
    expect(canAdjustLedger("FINANCE")).toBe(false);
    expect(canAdjustLedger("ADMIN")).toBe(true);
  });

  it("prevents non-super-admin privilege escalation", () => {
    expect(canManageRole("ADMIN", "USER")).toBe(true);
    expect(canManageRole("ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(canManageRole("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(getAssignableRoles("ADMIN")).toEqual(["USER", "VIEWER", "SUPPORT", "FINANCE"]);
  });

  it("keeps the auditor role read-only and scoped to assurance data", () => {
    expect(hasAdminPermission("VIEWER", ADMIN_PERMISSIONS.DASHBOARD_VIEW)).toBe(true);
    expect(hasAdminPermission("VIEWER", ADMIN_PERMISSIONS.AUDIT_LOGS_VIEW)).toBe(true);
    expect(hasAdminPermission("VIEWER", ADMIN_PERMISSIONS.REPORTS_VIEW)).toBe(true);
    expect(hasAdminPermission("VIEWER", ADMIN_PERMISSIONS.REPORTS_EXPORT)).toBe(false);
    expect(hasAdminPermission("VIEWER", ADMIN_PERMISSIONS.USERS_VIEW)).toBe(false);
    expect(hasAdminPermission("VIEWER", ADMIN_PERMISSIONS.PAYMENTS_REVIEW)).toBe(false);
  });

  it("keeps finance access focused on financial operations", () => {
    expect(hasAdminPermission("FINANCE", ADMIN_PERMISSIONS.ORDERS_VIEW)).toBe(true);
    expect(hasAdminPermission("FINANCE", ADMIN_PERMISSIONS.PAYMENTS_REVIEW)).toBe(true);
    expect(hasAdminPermission("FINANCE", ADMIN_PERMISSIONS.SETTLEMENTS_RECORD)).toBe(true);
    expect(hasAdminPermission("FINANCE", ADMIN_PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(hasAdminPermission("FINANCE", ADMIN_PERMISSIONS.PLANS_MANAGE)).toBe(false);
  });

  it("limits support access to customer and notification records", () => {
    expect(hasAdminPermission("SUPPORT", ADMIN_PERMISSIONS.USERS_VIEW)).toBe(true);
    expect(hasAdminPermission("SUPPORT", ADMIN_PERMISSIONS.NOTIFICATIONS_VIEW)).toBe(true);
    expect(hasAdminPermission("SUPPORT", ADMIN_PERMISSIONS.PAYMENTS_REVIEW)).toBe(false);
  });

  it("checks active status and resource ownership", () => {
    expect(isActiveStatus("ACTIVE")).toBe(true);
    expect(isActiveStatus("SUSPENDED")).toBe(false);
    expect(canViewOwnResource("a", "a")).toBe(true);
    expect(canViewOwnResource("a", "b")).toBe(false);
  });
});

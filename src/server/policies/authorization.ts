import type { UserRole, UserStatus } from "@prisma/client";

export const ADMIN_PERMISSIONS = {
  CONSOLE_ACCESS: "console.access",
  DASHBOARD_VIEW: "dashboard.view",
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",
  ORDERS_VIEW: "orders.view",
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_REVIEW: "payments.review",
  HENS_VIEW: "hens.view",
  HENS_MANAGE: "hens.manage",
  EGG_PRODUCTION_VIEW: "egg_production.view",
  LEDGER_VIEW: "ledger.view",
  LEDGER_ADJUST: "ledger.adjust",
  EGG_SALES_VIEW: "egg_sales.view",
  EGG_SALES_REVIEW: "egg_sales.review",
  SETTLEMENTS_VIEW: "settlements.view",
  SETTLEMENTS_RECORD: "settlements.record",
  PLANS_VIEW: "plans.view",
  PLANS_MANAGE: "plans.manage",
  PAYMENT_ACCOUNTS_VIEW: "payment_accounts.view",
  PAYMENT_ACCOUNTS_MANAGE: "payment_accounts.manage",
  SALE_RATES_VIEW: "sale_rates.view",
  SALE_RATES_MANAGE: "sale_rates.manage",
  REFERRAL_RULES_VIEW: "referral_rules.view",
  REFERRAL_RULES_MANAGE: "referral_rules.manage",
  REFERRALS_VIEW: "referrals.view",
  NOTIFICATIONS_VIEW: "notifications.view",
  RECONCILIATION_VIEW: "reconciliation.view",
  AUDIT_LOGS_VIEW: "audit_logs.view",
  SETTINGS_VIEW: "settings.view",
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const roleRank: Record<UserRole, number> = {
  USER: 10,
  VIEWER: 15,
  SUPPORT: 20,
  FINANCE: 30,
  ADMIN: 40,
  SUPER_ADMIN: 50,
};

const allAdminPermissions = Object.values(ADMIN_PERMISSIONS);

const permissionsByRole: Record<UserRole, readonly AdminPermission[]> = {
  USER: [],
  VIEWER: [
    ADMIN_PERMISSIONS.CONSOLE_ACCESS,
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.AUDIT_LOGS_VIEW,
    ADMIN_PERMISSIONS.REPORTS_VIEW,
  ],
  SUPPORT: [
    ADMIN_PERMISSIONS.CONSOLE_ACCESS,
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.USERS_VIEW,
    ADMIN_PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
  FINANCE: [
    ADMIN_PERMISSIONS.CONSOLE_ACCESS,
    ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    ADMIN_PERMISSIONS.USERS_VIEW,
    ADMIN_PERMISSIONS.ORDERS_VIEW,
    ADMIN_PERMISSIONS.PAYMENTS_VIEW,
    ADMIN_PERMISSIONS.PAYMENTS_REVIEW,
    ADMIN_PERMISSIONS.HENS_VIEW,
    ADMIN_PERMISSIONS.EGG_SALES_VIEW,
    ADMIN_PERMISSIONS.EGG_SALES_REVIEW,
    ADMIN_PERMISSIONS.SETTLEMENTS_VIEW,
    ADMIN_PERMISSIONS.SETTLEMENTS_RECORD,
    ADMIN_PERMISSIONS.REFERRALS_VIEW,
    ADMIN_PERMISSIONS.NOTIFICATIONS_VIEW,
    ADMIN_PERMISSIONS.REPORTS_VIEW,
  ],
  ADMIN: allAdminPermissions.filter((permission) => permission !== ADMIN_PERMISSIONS.SETTINGS_VIEW),
  SUPER_ADMIN: allAdminPermissions,
};

export const roleLabels: Record<UserRole, string> = {
  USER: "Customer",
  VIEWER: "Auditor",
  SUPPORT: "Support",
  FINANCE: "Finance",
  ADMIN: "Operations admin",
  SUPER_ADMIN: "Super admin",
};

export function hasAdminPermission(role: UserRole, permission: AdminPermission) {
  return permissionsByRole[role].includes(permission);
}

export function getAssignableRoles(actorRole: UserRole) {
  return (Object.keys(roleRank) as UserRole[]).filter((role) => canManageRole(actorRole, role));
}

export function isActiveStatus(status: UserStatus) {
  return status === "ACTIVE";
}

export function canAccessAdmin(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.CONSOLE_ACCESS);
}

export function canAccessOperations(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.CONSOLE_ACCESS);
}

export function canReviewPayments(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.PAYMENTS_REVIEW);
}

export function canReviewEggSales(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.EGG_SALES_REVIEW);
}

export function canRecordSettlements(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.SETTLEMENTS_RECORD);
}

export function canManageSaleRates(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.SALE_RATES_MANAGE);
}

export function canManageReferralRules(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.REFERRAL_RULES_MANAGE);
}

export function canRunReconciliation(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.RECONCILIATION_VIEW);
}

export function canManagePlans(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.PLANS_MANAGE);
}

export function canAdjustLedger(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.LEDGER_ADJUST);
}

export function canSuspendHenAssets(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.HENS_MANAGE);
}

export function canManageRole(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole !== "SUPER_ADMIN" && targetRole === "SUPER_ADMIN") {
    return false;
  }
  return roleRank[actorRole] > roleRank[targetRole] || actorRole === "SUPER_ADMIN";
}

export function canManageUsers(role: UserRole) {
  return hasAdminPermission(role, ADMIN_PERMISSIONS.USERS_MANAGE);
}

export function canViewOwnResource(actorId: string, resourceUserId: string) {
  return actorId === resourceUserId;
}

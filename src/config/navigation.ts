import {
  Bell,
  Banknote,
  ClipboardList,
  Egg,
  ListChecks,
  LayoutDashboard,
  PackageCheck,
  Sprout,
  User,
  Users,
  WalletCards,
} from "lucide-react";

import type { AdminPermission } from "@/server/policies/authorization";

export const publicNavigation = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Poultry Plans", href: "/#poultry-plans" },
  { label: "Sell Eggs", href: "/#sell-eggs" },
  { label: "Transparency", href: "/#transparency" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
] as const;

export const dashboardNavigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Plans", href: "/dashboard/plans", icon: ListChecks },
  { label: "Orders", href: "/dashboard/orders", icon: PackageCheck },
  { label: "Hens", href: "/dashboard/hens", icon: Sprout },
  { label: "Egg ledger", href: "/dashboard/egg-ledger", icon: Egg },
  { label: "Sell eggs", href: "/dashboard/sell-eggs", icon: Banknote },
  { label: "Egg sales", href: "/dashboard/egg-sales", icon: ClipboardList },
  { label: "Payout methods", href: "/dashboard/payout-methods", icon: WalletCards },
  { label: "Referrals", href: "/dashboard/referrals", icon: Users },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Activity", href: "/dashboard/activity", icon: ClipboardList },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
] as const;

export const adminNavigation = [
  {
    label: "Overview",
    href: "/admin",
    icon: "Home",
    group: "Workspace",
    permission: "dashboard.view",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: "Users",
    group: "Workspace",
    permission: "users.view",
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: "PackageCheck",
    group: "Workspace",
    permission: "orders.view",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: "Bell",
    group: "Workspace",
    permission: "notifications.view",
  },
  {
    label: "Payment reviews",
    href: "/admin/payment-reviews",
    icon: "CreditCard",
    group: "Reviews",
    permission: "payments.view",
  },
  {
    label: "Egg sales",
    href: "/admin/egg-sales",
    icon: "Banknote",
    group: "Reviews",
    permission: "egg_sales.view",
  },
  {
    label: "Payouts",
    href: "/admin/payouts",
    icon: "WalletCards",
    group: "Reviews",
    permission: "settlements.view",
  },
  {
    label: "Hens",
    href: "/admin/hens",
    icon: "Sprout",
    group: "Operations",
    permission: "hens.view",
  },
  {
    label: "Ledger",
    href: "/admin/ledger",
    icon: "Egg",
    group: "Operations",
    permission: "ledger.view",
  },
  {
    label: "Egg production",
    href: "/admin/egg-production",
    icon: "Egg",
    group: "Operations",
    permission: "egg_production.view",
  },
  {
    label: "Egg markets",
    href: "/admin/egg-markets",
    icon: "Banknote",
    group: "Operations",
    permission: "ledger.view",
  },
  {
    label: "Referrals",
    href: "/admin/referrals",
    icon: "Users",
    group: "Operations",
    permission: "referrals.view",
  },
  {
    label: "Plans",
    href: "/admin/plans",
    icon: "ListChecks",
    group: "Configuration",
    permission: "plans.view",
  },
  {
    label: "Payment accounts",
    href: "/admin/payment-accounts",
    icon: "ReceiptText",
    group: "Configuration",
    permission: "payment_accounts.view",
  },
  {
    label: "Sale rates",
    href: "/admin/egg-sale-rates",
    icon: "Egg",
    group: "Configuration",
    permission: "sale_rates.view",
  },
  {
    label: "Referral rules",
    href: "/admin/referral-rules",
    icon: "Users",
    group: "Configuration",
    permission: "referral_rules.view",
  },
  {
    label: "Reconciliation",
    href: "/admin/reconciliation",
    icon: "ClipboardList",
    group: "Assurance",
    permission: "reconciliation.view",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: "BarChart3",
    group: "Assurance",
    permission: "reports.view",
  },
  {
    label: "Audit logs",
    href: "/admin/audit-logs",
    icon: "ShieldCheck",
    group: "Assurance",
    permission: "audit_logs.view",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "Settings",
    group: "Assurance",
    permission: "settings.view",
  },
] as const satisfies readonly {
  label: string;
  href: string;
  icon: string;
  group: string;
  permission: AdminPermission;
}[];

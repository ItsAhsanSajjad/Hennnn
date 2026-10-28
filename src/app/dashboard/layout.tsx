import type { ReactNode } from "react";

import { dashboardNavigation } from "@/config/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell
      nav={dashboardNavigation}
      title="User dashboard"
      userLabel={`${user.username} - ${user.role}`}
      variant="user"
    >
      {children}
    </AppShell>
  );
}

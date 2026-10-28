import { CreditCard, ShieldCheck } from "lucide-react";

import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { PaymentMethodsForm } from "@/components/admin/payment-methods-form";
import { PublicContentForm } from "@/components/admin/public-content-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireAdminPermission } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utilities/format";
import { ADMIN_PERMISSIONS } from "@/server/policies/authorization";
import { getPaymentMethodSettings } from "@/server/services/payment-methods";
import { isPaybostConfigured } from "@/server/services/paybost";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdminPermission(ADMIN_PERMISSIONS.SETTINGS_VIEW);
  const settings = await prisma.appSetting.findMany({
    orderBy: { key: "asc" },
  });
  const publicContentSetting = settings.find((setting) => setting.key === "public_content");
  const publicContent =
    publicContentSetting &&
    typeof publicContentSetting.value === "object" &&
    publicContentSetting.value !== null &&
    !Array.isArray(publicContentSetting.value)
      ? publicContentSetting.value
      : {};
  const paymentMethodSettings = await getPaymentMethodSettings();
  const paybostConfigured = isPaybostConfigured();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        icon={ShieldCheck}
        eyebrow="System administration"
        title="Settings"
        description="Review protected application settings and keep your administrator account secure."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
          <p className="pak-kicker">Account security</p>
          <h2 className="mt-2 text-xl font-extrabold text-forest">Change your password</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Your current password is required. Changing it signs out any other active sessions.
          </p>
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </section>

        <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
          <p className="pak-kicker">Configuration</p>
          <h2 className="mt-2 text-xl font-extrabold text-forest">Application settings</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">
            Sensitive configuration remains read-only in this release and is recorded through
            audited administrator controls.
          </p>
          <ul className="mt-6 divide-y divide-mist border-t border-mist">
            {settings.map((setting) => (
              <li key={setting.id} className="py-4">
                <p className="font-semibold text-charcoal">{setting.key}</p>
                <p className="mt-1 text-sm text-charcoal/60">
                  Public: {setting.isPublic ? "Yes" : "No"} - Updated{" "}
                  {formatDateTime(setting.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <CreditCard aria-hidden="true" className="text-leaf" size={20} />
          <p className="pak-kicker">Payments</p>
        </div>
        <h2 className="mt-2 text-xl font-extrabold text-forest">Payment methods</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-charcoal/70">
          Turn each customer payment method on or off. Manual bank transfer needs an administrator
          to approve a screenshot; online payment auto-approves through the Paybost gateway.
        </p>
        <div className="mt-6 max-w-2xl">
          <PaymentMethodsForm
            settings={paymentMethodSettings}
            paybostConfigured={paybostConfigured}
          />
        </div>
      </section>

      <section className="rounded-lg border border-mist bg-surface p-6 shadow-sm">
        <p className="pak-kicker">Public website</p>
        <h2 className="mt-2 text-xl font-extrabold text-forest">Public content and timing</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-charcoal/70">
          Keep public wording precise. Do not publish a verification or payment timeframe unless the
          operating team can meet it.
        </p>
        <div className="mt-6 max-w-4xl">
          <PublicContentForm content={publicContent} />
        </div>
      </section>
    </div>
  );
}

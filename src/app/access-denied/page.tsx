import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="max-w-md rounded-lg border border-mist bg-surface p-8 text-center shadow-soft">
        <ShieldAlert aria-hidden="true" className="mx-auto text-danger" size={36} />
        <h1 className="mt-5 text-3xl font-black text-forest">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-charcoal/70">
          Your account does not have permission to access this area or is not active.
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center font-bold text-forest">
          Return home
        </Link>
      </div>
    </main>
  );
}

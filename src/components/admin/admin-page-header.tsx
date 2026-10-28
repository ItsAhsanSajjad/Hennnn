import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AdminPageHeader({
  icon: Icon,
  eyebrow = "Operations workspace",
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-leaf/20 bg-[radial-gradient(circle_at_92%_0%,rgba(47,208,160,0.13),transparent_46%),linear-gradient(135deg,#0e1a16,#0a1310)] p-5 sm:p-6">
      <Image
        src="/admin/welcome-egg.png"
        alt=""
        width={760}
        height={581}
        priority
        unoptimized
        className="pointer-events-none absolute -right-4 top-1/2 hidden w-40 -translate-y-1/2 object-contain opacity-80 drop-shadow-[0_0_34px_rgba(47,208,160,0.22)] md:block lg:w-48"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,19,16,0.96)_0%,rgba(10,19,16,0.82)_55%,transparent_100%)]" />
      <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-leaf/30 bg-leaf/10 text-leaf shadow-[0_0_24px_rgba(47,208,160,0.15)]">
            <Icon aria-hidden="true" size={23} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-leaf">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-black text-content sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

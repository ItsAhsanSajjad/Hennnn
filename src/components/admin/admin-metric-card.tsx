import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AdminMetricCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
  tone = "teal",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail: string;
  href?: string;
  tone?: "teal" | "amber" | "blue" | "rose";
}) {
  const tones = {
    teal: "bg-leaf/15 text-leaf",
    amber: "bg-gold/15 text-gold",
    blue: "bg-info/15 text-info",
    rose: "bg-danger/15 text-danger",
  };

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-11 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon aria-hidden="true" size={20} />
        </span>
        {href ? (
          <ArrowUpRight
            aria-hidden="true"
            className="text-faint transition-colors group-hover:text-leaf"
            size={18}
          />
        ) : null}
      </div>
      <p className="mt-5 text-3xl font-black text-content">{value}</p>
      <p className="mt-1 text-sm font-bold text-content">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </>
  );

  const className =
    "group flex min-h-[168px] flex-col rounded-2xl border border-line bg-[linear-gradient(150deg,#101a16,#0b1310)] p-5 transition-colors hover:border-leaf/35";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}

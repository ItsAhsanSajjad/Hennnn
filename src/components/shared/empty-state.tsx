import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-mist bg-surface p-6 text-center">
      <Icon aria-hidden="true" className="mx-auto text-leaf" size={28} />
      <h3 className="mt-3 text-base font-bold text-charcoal">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-charcoal/70">{message}</p>
    </div>
  );
}

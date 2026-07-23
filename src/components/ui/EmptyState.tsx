import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-mendoza-gold bg-white p-8 text-center">
      <Icon aria-hidden="true" className="mx-auto text-mendoza-blue" size={38} />
      <h2 className="mt-4 text-xl font-bold text-mendoza-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-mendoza-muted">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </section>
  );
}

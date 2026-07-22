import type { LucideIcon } from 'lucide-react';

type FeatureCardProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

export function FeatureCard({ description, icon: Icon, title }: FeatureCardProps) {
  return (
    <article className="rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mendoza-sky-soft text-mendoza-blue">
        <Icon aria-hidden="true" size={24} />
      </div>
      <h3 className="mt-5 text-lg font-bold text-mendoza-text">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-mendoza-muted">{description}</p>
    </article>
  );
}

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  backTo,
  backLabel = "Volver",
}: PageHeaderProps) {
  return (
    <header>
      {backTo && (
        <Link
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-mendoza-blue hover:underline"
          to={backTo}
        >
          <ArrowLeft aria-hidden="true" size={17} />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-mendoza-text">{title}</h1>
          {description && (
            <p className="mt-2 leading-6 text-mendoza-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}

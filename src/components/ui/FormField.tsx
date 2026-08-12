import type { ReactNode } from "react";

export function FormField({
  label,
  htmlFor,
  error,
  help,
  helpPlacement = "above",
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  helpPlacement?: "above" | "below";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-mendoza-text" htmlFor={htmlFor}>
        {label}
      </label>
      {help && helpPlacement === "above" && (
        <p className="mt-1 text-xs text-mendoza-muted">{help}</p>
      )}
      <div className="mt-2">{children}</div>
      {help && helpPlacement === "below" && (
        <p className="mt-1 text-xs text-mendoza-muted">{help}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-mendoza-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

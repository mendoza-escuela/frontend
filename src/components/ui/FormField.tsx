import type { ReactNode } from "react";

export function FormField({
  label,
  htmlFor,
  error,
  help,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-mendoza-text" htmlFor={htmlFor}>
        {label}
      </label>
      {help && <p className="mt-1 text-xs text-mendoza-muted">{help}</p>}
      <div className="mt-2">{children}</div>
      {error && (
        <p className="mt-1 text-sm text-mendoza-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

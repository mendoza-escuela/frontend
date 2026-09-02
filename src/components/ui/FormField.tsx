import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  help?: string;
  helpId?: string;
  helpPlacement?: "above" | "below";
  hideHelpWhenError?: boolean;
  required?: boolean;
  alignControl?: boolean;
  children: ReactNode;
  className?: string;
  controlClassName?: string;
  errorClassName?: string;
  helpClassName?: string;
  labelClassName?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  help,
  helpId,
  helpPlacement = "above",
  hideHelpWhenError = false,
  required = false,
  alignControl = false,
  children,
  className = "",
  controlClassName,
  errorClassName = "mt-1 text-sm font-normal text-mendoza-error",
  helpClassName = "mt-1 text-xs font-normal text-mendoza-muted",
  labelClassName = "block text-sm font-semibold text-mendoza-text",
}: FormFieldProps) {
  const rootClassName =
    `${alignControl ? "flex h-full flex-col" : ""} ${className}`.trim();
  const nestedRootClassName =
    `text-sm font-semibold text-mendoza-text ${rootClassName}`.trim();
  const resolvedControlClassName =
    controlClassName ??
    (alignControl
      ? "mt-auto pt-2"
      : "mt-2 [&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-mendoza-border [&_.field]:bg-white [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:outline-none focus-within:[&_.field]:border-mendoza-sky");
  const showHelp = Boolean(help) && !(hideHelpWhenError && error);
  const content = (
    <>
      {htmlFor ? (
        <label className={labelClassName} htmlFor={htmlFor}>
          {label}
          {required ? " *" : ""}
        </label>
      ) : (
        <span className={labelClassName}>
          {label}
          {required ? " *" : ""}
        </span>
      )}
      {showHelp && helpPlacement === "above" && (
        <span className={`block ${helpClassName}`} id={helpId}>
          {help}
        </span>
      )}
      <span className={`block ${resolvedControlClassName}`.trim()}>
        {children}
      </span>
      {showHelp && helpPlacement === "below" && (
        <span className={`block ${helpClassName}`} id={helpId}>
          {help}
        </span>
      )}
      {error && (
        <span className={`block ${errorClassName}`} role="alert">
          {error}
        </span>
      )}
    </>
  );

  return htmlFor ? (
    <div className={rootClassName}>{content}</div>
  ) : (
    <label className={nestedRootClassName}>{content}</label>
  );
}

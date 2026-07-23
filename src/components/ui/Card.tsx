import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "article" | "div";
};

export function Card({
  as: Component = "section",
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <Component
      className={`rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

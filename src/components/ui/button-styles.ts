export type ButtonVariant = "primary" | "secondary" | "outline";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-mendoza-blue text-white shadow-sm shadow-mendoza-blue/20 hover:bg-mendoza-blue-dark focus-visible:outline-mendoza-blue",
  secondary:
    "bg-mendoza-sky text-mendoza-text shadow-sm hover:bg-mendoza-sky-dark focus-visible:outline-mendoza-blue",
  outline:
    "border border-mendoza-blue bg-white text-mendoza-blue hover:bg-mendoza-blue-soft focus-visible:outline-mendoza-blue",
};

const baseClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Comparte el tratamiento visual de los botones con enlaces que representan
 * acciones de navegación, sin sacrificar la semántica propia de cada elemento.
 */
export function getButtonClassName(
  variant: ButtonVariant = "primary",
  className = "",
) {
  return `${baseClasses} ${variantClasses[variant]} ${className}`;
}

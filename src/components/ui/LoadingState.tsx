import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  className?: string;
  fullScreen?: boolean;
  label?: string;
  compact?: boolean;
  page?: boolean;
};

/**
 * Indicador de espera compartido para cargas de rutas, pantallas y contenido.
 * Conserva un texto accesible y detiene el giro si el usuario reduce movimiento.
 */
export function LoadingState({
  className = "",
  fullScreen = false,
  label = "Cargando…",
  compact = false,
  page = false,
}: LoadingStateProps) {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`${
        fullScreen
          ? "grid min-h-screen place-items-center bg-mendoza-background px-4"
          : page
            ? "grid min-h-[60vh] place-items-center px-4 text-mendoza-muted"
          : compact
            ? "flex items-center justify-center gap-2 py-2 text-mendoza-muted"
            : "flex items-center justify-center gap-3 rounded-xl border border-mendoza-border bg-white p-6 text-mendoza-muted shadow-sm"
      } ${className}`}
      role="status"
    >
      <span
        className={
          fullScreen || page
            ? "flex min-w-56 flex-col items-center gap-4 rounded-2xl border border-mendoza-border bg-white px-8 py-9 text-center text-mendoza-muted shadow-sm"
            : "contents"
        }
      >
        <span
          className={`relative grid shrink-0 place-items-center ${compact ? "size-5" : "size-10"}`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-4 border-mendoza-sky/25"
          />
          <LoaderCircle
            aria-hidden="true"
            className={`${compact ? "size-5" : "size-10"} animate-spin text-mendoza-blue motion-reduce:animate-none`}
            strokeWidth={2.5}
          />
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </span>
    </div>
  );
}

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-mendoza-border bg-white p-6 text-center text-mendoza-blue"
      role="status"
    >
      {label}
    </div>
  );
}

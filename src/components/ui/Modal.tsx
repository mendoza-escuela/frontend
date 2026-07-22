import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-mendoza-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-mendoza-blue" id={titleId}>
              {title}
            </h2>
            {description && (
              <p
                className="mt-1 text-sm text-mendoza-muted"
                id={descriptionId}
              >
                {description}
              </p>
            )}
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-lg p-2 text-mendoza-muted hover:bg-mendoza-background"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

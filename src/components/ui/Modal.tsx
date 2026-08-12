import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

type ModalSize = "md" | "lg" | "xl";

const sizeClassNames: Record<ModalSize, string> = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

let bodyScrollLockCount = 0;
let bodyOverflowBeforeLock = "";

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
  }
  bodyScrollLockCount += 1;
  document.body.style.overflow = "hidden";

  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = bodyOverflowBeforeLock;
    }
  };
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: ModalSize;
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const unlockBodyScroll = lockBodyScroll();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      unlockBodyScroll();
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <section
        className={`flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-xl sm:p-6 ${sizeClassNames[size]}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-mendoza-border pb-4">
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
        <div className="mt-5 min-h-0 overflow-y-auto overscroll-contain pr-1">
          {children}
        </div>
      </section>
    </div>
  );
}

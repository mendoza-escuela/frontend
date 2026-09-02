import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";

type ModalSize = "md" | "lg" | "xl";

const sizeClassNames: Record<ModalSize, string> = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

let bodyScrollLockCount = 0;
let bodyOverflowBeforeLock = "";

const focusableElementSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

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
  dismissible = true,
  busy = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  size?: ModalSize;
  dismissible?: boolean;
  busy?: boolean;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismissibleRef = useRef(dismissible);
  const onCloseRef = useRef(onClose);

  useLayoutEffect(() => {
    dismissibleRef.current = dismissible;
    onCloseRef.current = onClose;
    const activeElement = document.activeElement;
    if (
      !dismissible &&
      activeElement instanceof HTMLElement &&
      activeElement.matches(":disabled")
    ) {
      dialogRef.current?.focus();
    }
  }, [dismissible, onClose]);

  useEffect(() => {
    if (!open) return;
    const unlockBodyScroll = lockBodyScroll();
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;
    const focusableElements = dialog?.querySelectorAll<HTMLElement>(
      focusableElementSelector,
    );
    (focusableElements?.[0] ?? dialog)?.focus();

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (dismissibleRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const availableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableElementSelector),
      );
      if (!availableElements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = availableElements[0];
      const lastElement = availableElements[availableElements.length - 1];
      const activeElement = document.activeElement;
      if (
        event.shiftKey &&
        (activeElement === firstElement || !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement || !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      unlockBodyScroll();
      document.removeEventListener("keydown", handleDialogKeys);
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={busy || undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
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
            className="rounded-lg p-2 text-mendoza-muted hover:bg-mendoza-background disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!dismissible}
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

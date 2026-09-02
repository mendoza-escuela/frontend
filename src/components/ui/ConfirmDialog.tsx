import { TriangleAlert } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  isProcessing = false,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isProcessing?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Modal
      busy={isProcessing}
      dismissible={!isProcessing}
      onClose={onCancel}
      open={open}
      title={title}
    >
      <div className="flex gap-3 rounded-xl bg-mendoza-background p-4">
        <TriangleAlert
          aria-hidden="true"
          className={destructive ? "text-mendoza-error" : "text-mendoza-warning"}
          size={22}
        />
        <p className="text-sm leading-6 text-mendoza-text">{description}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button disabled={isProcessing} onClick={onCancel} variant="outline">
          Cancelar
        </Button>
        <Button
          className={destructive ? "bg-mendoza-error hover:bg-red-700" : ""}
          disabled={isProcessing}
          onClick={() => void onConfirm()}
        >
          {isProcessing ? "Procesando…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

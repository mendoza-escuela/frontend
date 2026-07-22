import { CircleAlert } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
      role="alert"
    >
      <CircleAlert
        aria-hidden="true"
        className="mx-auto text-mendoza-error"
        size={34}
      />
      <p className="mt-3 font-semibold text-mendoza-text">{message}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry} variant="outline">
          Reintentar
        </Button>
      )}
    </div>
  );
}

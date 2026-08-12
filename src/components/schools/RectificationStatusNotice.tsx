import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { SchoolRectificationStatus } from "../../types/admin-school";

type RectificationStatusNoticeProps = {
  status: SchoolRectificationStatus;
  className?: string;
};

/**
 * Presenta por separado la confirmación anual y la aptitud para evaluar.
 *
 * Los fallbacks mantienen una interfaz correcta durante un despliegue gradual:
 * `rectifiedAt` prueba una confirmación histórica e `isRectified` conserva la
 * semántica anterior de ficha completa.
 */
export function RectificationStatusNotice({
  status,
  className = "",
}: RectificationStatusNoticeProps) {
  const isConfirmed = status.isConfirmed ?? Boolean(status.rectifiedAt);
  const isEvaluationReady = status.isEvaluationReady ?? status.isRectified;
  const missingFields = status.missingFields ?? [];
  const needsUpdate = isConfirmed && !isEvaluationReady;
  const isReady = isConfirmed && isEvaluationReady;

  return (
    <section
      className={`${className} rounded-2xl border p-5 shadow-sm ${
        isReady
          ? "border-green-200 bg-green-50"
          : "border-amber-300 bg-amber-50"
      }`}
      role={isReady ? "status" : "alert"}
    >
      <div className="flex items-start gap-3">
        {isReady ? (
          <CheckCircle2
            aria-hidden="true"
            className="shrink-0 text-mendoza-success"
          />
        ) : (
          <AlertCircle aria-hidden="true" className="shrink-0 text-amber-700" />
        )}
        <div className="min-w-0">
          <h2 className="font-bold text-mendoza-text">
            {statusTitle(status, isConfirmed, isEvaluationReady)}
          </h2>
          <p className="mt-1 text-sm text-mendoza-muted">
            {isReady
              ? "La ficha está completa y lista para iniciar nuevas evaluaciones."
              : needsUpdate
                ? "La confirmación anual se conserva, pero faltan datos requeridos para evaluar."
                : "Revisá los datos obligatorios y confirmalos para el período vigente."}
          </p>
          {!isEvaluationReady && missingFields.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-mendoza-text">
                Datos que faltan completar:
              </p>
              <ul
                aria-label="Datos pendientes de la ficha"
                className="mt-2 flex flex-wrap gap-2"
              >
                {missingFields.map(({ code, label }) => (
                  <li
                    className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900"
                    key={code}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function statusTitle(
  status: SchoolRectificationStatus,
  isConfirmed: boolean,
  isEvaluationReady: boolean,
) {
  if (!isConfirmed) {
    return `Confirmación pendiente para ${status.periodYear}`;
  }

  const confirmation = status.rectifiedAt
    ? `Confirmada el ${formatConfirmationDate(status.rectifiedAt)}`
    : `Ficha ${status.periodYear} confirmada`;

  return isEvaluationReady
    ? `${confirmation} y lista para evaluar`
    : `${confirmation}; requiere actualización`;
}

function formatConfirmationDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Mendoza",
  }).format(new Date(value));
}

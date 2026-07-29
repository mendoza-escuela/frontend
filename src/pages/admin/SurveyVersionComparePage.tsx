import { GitCompareArrows } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { inputClassName } from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type {
  AdminSurveyDetail,
  SurveyVersionComparison,
} from "../../types/admin-survey";

const changeLabels = {
  added: "Agregado",
  removed: "Eliminado",
  modified: "Modificado",
};
const entityLabels = {
  version: "Versión",
  dimension: "Dimensión",
  section: "Sección",
  question: "Pregunta",
  option: "Opción",
};
const fieldLabels: Record<string, string> = {
  score: "puntaje",
};

export function SurveyVersionComparePage() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<AdminSurveyDetail | null>(null);
  const [fromVersionId, setFromVersionId] = useState("");
  const [toVersionId, setToVersionId] = useState("");
  const [comparison, setComparison] = useState<SurveyVersionComparison | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!surveyId) return;
    adminSurveysService
      .findOne(surveyId)
      .then((loaded) => {
        setSurvey(loaded);
        setFromVersionId(loaded.versions[1]?.id ?? "");
        setToVersionId(loaded.versions[0]?.id ?? "");
      })
      .catch((loadError) => setError(getHttpErrorMessage(loadError)))
      .finally(() => setIsLoading(false));
  }, [surveyId]);

  const compare = useCallback(async () => {
    if (!surveyId || !fromVersionId || !toVersionId) return;
    setIsComparing(true);
    setError("");
    try {
      setComparison(
        await adminSurveysService.compare(surveyId, fromVersionId, toVersionId),
      );
    } catch (compareError) {
      setError(getHttpErrorMessage(compareError));
    } finally {
      setIsComparing(false);
    }
  }, [fromVersionId, surveyId, toVersionId]);

  if (isLoading)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Cargando versiones…" />
      </main>
    );
  if (!survey)
    return (
      <main className="p-4 sm:p-8">
        <ErrorState message={error || "Cuestionario no encontrado."} />
      </main>
    );

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          backLabel="Volver al cuestionario"
          backTo={`/admin/cuestionarios/${survey.id}`}
          description="La comparación utiliza los códigos estables para detectar altas, bajas y modificaciones."
          eyebrow="Cuestionarios"
          title="Comparar versiones"
        />

        <Card className="mt-8">
          <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="text-sm font-semibold text-mendoza-text">
              Versión de origen
              <select
                className={`mt-2 ${inputClassName}`}
                onChange={(event) => setFromVersionId(event.target.value)}
                value={fromVersionId}
              >
                {survey.versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.versionNumber} · {version.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-mendoza-text">
              Versión de destino
              <select
                className={`mt-2 ${inputClassName}`}
                onChange={(event) => setToVersionId(event.target.value)}
                value={toVersionId}
              >
                {survey.versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    v{version.versionNumber} · {version.title}
                  </option>
                ))}
              </select>
            </label>
            <Button
              disabled={
                isComparing ||
                !fromVersionId ||
                !toVersionId ||
                fromVersionId === toVersionId
              }
              icon={<GitCompareArrows aria-hidden="true" size={18} />}
              onClick={() => void compare()}
            >
              {isComparing ? "Comparando…" : "Comparar"}
            </Button>
          </div>
        </Card>

        {error && (
          <div className="mt-5">
            <ErrorState message={error} />
          </div>
        )}

        {comparison && (
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <Metric label="Agregados" value={comparison.summary.added} />
              <Metric label="Eliminados" value={comparison.summary.removed} />
              <Metric label="Modificados" value={comparison.summary.modified} />
              <Metric
                label="Total de cambios"
                value={comparison.summary.total}
              />
            </div>
            {comparison.changes.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  description="Las dos versiones tienen la misma estructura y contenido configurable."
                  icon={GitCompareArrows}
                  title="No se detectaron diferencias"
                />
              </div>
            ) : (
              <Card className="mt-5 overflow-hidden p-0 sm:p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-mendoza-blue text-white">
                      <tr>
                        <th className="px-4 py-3">Cambio</th>
                        <th className="px-4 py-3">Elemento</th>
                        <th className="px-4 py-3">Ruta</th>
                        <th className="px-4 py-3">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mendoza-border">
                      {comparison.changes.map((change) => (
                        <tr
                          key={`${change.type}-${change.entityType}-${change.path}`}
                        >
                          <td className="px-4 py-3 font-semibold text-mendoza-text">
                            {changeLabels[change.type]}
                          </td>
                          <td className="px-4 py-3">
                            {entityLabels[change.entityType]}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-mendoza-muted">
                            {change.path}
                          </td>
                          <td className="px-4 py-3 text-mendoza-muted">
                            {change.changedFields.length
                              ? `Campos: ${change.changedFields
                                  .map((field) => fieldLabels[field] ?? field)
                                  .join(", ")}`
                              : change.label}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-mendoza-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-mendoza-blue">{value}</p>
    </Card>
  );
}

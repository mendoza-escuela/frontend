import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QuestionnaireRenderer } from "../../components/surveys/QuestionnaireRenderer";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { VersionStatusBadge } from "../../components/ui/StatusBadge";
import { getHttpErrorMessage } from "../../lib/http-error";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type {
  AdminSurveyDetail,
  AdminSurveyVersion,
} from "../../types/admin-survey";
import type { PublishedSurvey } from "../../types/survey";

export function SurveyVersionPreviewPage() {
  const { surveyId, versionId } = useParams();
  const [survey, setSurvey] = useState<AdminSurveyDetail | null>(null);
  const [version, setVersion] = useState<AdminSurveyVersion | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!surveyId || !versionId) return;
    Promise.all([
      adminSurveysService.findOne(surveyId),
      adminSurveysService.findVersion(surveyId, versionId),
    ])
      .then(([loadedSurvey, loadedVersion]) => {
        setSurvey(loadedSurvey);
        setVersion(loadedVersion);
      })
      .catch((loadError) => setError(getHttpErrorMessage(loadError)))
      .finally(() => setIsLoading(false));
  }, [surveyId, versionId]);

  if (isLoading)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Preparando vista previa…" />
      </main>
    );
  if (error || !survey || !version)
    return (
      <main className="p-4 sm:p-8">
        <ErrorState message={error || "Versión no encontrada."} />
      </main>
    );

  const renderable: PublishedSurvey = {
    code: survey.code,
    name: survey.name,
    description: survey.description,
    version: {
      id: version.id,
      versionNumber: version.versionNumber,
      title: version.title,
      instructions: version.instructions,
      publishedAt: version.publishedAt ?? version.createdAt,
      dimensions: version.dimensions,
    },
  };

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          backLabel="Volver al cuestionario"
          backTo={`/admin/cuestionarios/${survey.id}`}
          description="La vista utiliza el mismo renderizador que el portal de la escuela, sin guardar respuestas."
          eyebrow="Vista previa administrativa"
          title={survey.name}
        />
        <Card className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <VersionStatusBadge status={version.status} />
            <p className="font-semibold text-mendoza-text">
              Versión {version.versionNumber} · {version.title}
            </p>
          </div>
          <p className="mt-4 flex gap-2 rounded-lg bg-mendoza-background p-3 text-sm text-mendoza-muted">
            <Info aria-hidden="true" className="shrink-0" size={18} />
            Los campos están deshabilitados porque esta pantalla sólo valida la
            presentación y el recorrido.
          </p>
        </Card>
        <div className="mt-5">
          <QuestionnaireRenderer readOnly showScores survey={renderable} />
        </div>
      </div>
    </main>
  );
}

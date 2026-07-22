import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { QuestionnaireRenderer } from "../../components/surveys/QuestionnaireRenderer";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError } from "../../lib/toast";
import { surveysService } from "../../services/surveys.service";
import type { AvailableSurvey, PublishedSurvey } from "../../types/survey";

export function SchoolSurveyPage() {
  const [available, setAvailable] = useState<AvailableSurvey[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [survey, setSurvey] = useState<PublishedSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    surveysService
      .listAvailable()
      .then((surveys) => {
        setAvailable(surveys);
        if (surveys[0]) setSelectedCode(surveys[0].code);
      })
      .catch((error) => showError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCode) {
      setSurvey(null);
      return;
    }
    setIsLoading(true);
    surveysService
      .findAvailable(selectedCode)
      .then(setSurvey)
      .catch((error) => showError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [selectedCode]);

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
          Cuestionario institucional
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mendoza-text">
          Cuestionario disponible
        </h1>
        <p className="mt-2 text-mendoza-muted">
          La estructura se genera a partir de la versión publicada en el
          backend.
        </p>

        {available.length > 1 && (
          <label className="mt-6 block max-w-lg text-sm font-semibold text-mendoza-text">
            Cuestionario
            <select
              className="mt-2 w-full rounded-lg border border-mendoza-border bg-white px-3 py-2.5 outline-none focus:border-mendoza-sky focus:ring-2 focus:ring-mendoza-sky/25"
              onChange={(event) => setSelectedCode(event.target.value)}
              value={selectedCode}
            >
              {available.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name} · versión {option.versionNumber}
                </option>
              ))}
            </select>
          </label>
        )}

        {isLoading ? (
          <p className="mt-8 text-mendoza-blue">Cargando cuestionario…</p>
        ) : survey ? (
          <>
            <section className="mt-6 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-mendoza-blue">
                Versión {survey.version.versionNumber}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-mendoza-text">
                {survey.version.title}
              </h2>
              {(survey.version.instructions || survey.description) && (
                <p className="mt-3 text-sm leading-6 text-mendoza-muted">
                  {survey.version.instructions ?? survey.description}
                </p>
              )}
            </section>
            <div className="mt-5 flex gap-3 rounded-xl border border-mendoza-gold/60 bg-white p-4 text-sm leading-6 text-mendoza-muted">
              <Info aria-hidden="true" className="mt-0.5 shrink-0 text-mendoza-blue" size={19} />
              <p>
                Esta es una vista de la estructura publicada. La carga, el
                guardado de borradores y el envío se habilitarán cuando se
                definan e implementen las campañas y entregas.
              </p>
            </div>
            <div className="mt-5">
              <QuestionnaireRenderer
                key={survey.version.id}
                readOnly
                survey={survey}
              />
            </div>
          </>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-mendoza-gold bg-white p-8 text-center">
            <Info className="mx-auto text-mendoza-blue" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold text-mendoza-text">
              No hay cuestionarios publicados
            </h2>
            <p className="mt-2 text-sm text-mendoza-muted">
              Cuando el equipo administrador publique la primera versión,
              aparecerá automáticamente en este espacio.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

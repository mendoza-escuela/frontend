import axios from "axios";
import {
  AlertTriangle,
  Ban,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  School,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PreliminaryResultRadar } from "../../components/results/PreliminaryResultRadar";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { formatDateTime } from "../../lib/format";
import { schoolResultsService } from "../../services/school-results.service";
import type {
  PreliminaryResultAnswer,
  SchoolPreliminaryResult,
  SchoolPreliminaryResultList,
} from "../../types/school-result";

type ResultError = {
  kind:
    | "draft"
    | "not-found"
    | "not-generated"
    | "denied"
    | "incomplete"
    | "server";
  message: string;
};

export function SchoolResultsPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  return campaignId ? (
    <PreliminaryResultDetail campaignId={campaignId} />
  ) : (
    <PreliminaryResultHistory />
  );
}

function PreliminaryResultHistory() {
  const [history, setHistory] =
    useState<SchoolPreliminaryResultList | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setHistory(await schoolResultsService.list());
    } catch (loadError) {
      setError(resultError(loadError).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          description="Consultá las presentaciones enviadas y sus resultados históricos."
          eyebrow="Evaluación institucional"
          title="Resultado preliminar"
        />

        <div className="mt-8">
          {isLoading ? (
            <LoadingState label="Cargando resultados preliminares…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : !history?.items.length ? (
            <EmptyState
              action={
                <Link
                  className="inline-flex min-h-11 items-center rounded-lg bg-mendoza-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-mendoza-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue"
                  to="/colegio/cuestionario"
                >
                  Ir a campañas
                </Link>
              }
              description="Cuando envíes una presentación y se genere su cálculo, aparecerá en este espacio."
              icon={BarChart3}
              title="Todavía no hay resultados disponibles"
            />
          ) : (
            <section
              aria-label="Resultados preliminares disponibles"
              className="grid gap-4 md:grid-cols-2"
            >
              {history.items.map((result) => (
                <Card as="article" key={result.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-mendoza-blue">
                        Presentación enviada
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-mendoza-text">
                        {result.campaign.name}
                      </h2>
                    </div>
                    <span className="rounded-full bg-mendoza-blue-soft px-3 py-1 text-sm font-bold text-mendoza-blue">
                      {formatScore(result.generalScore)} / 100
                    </span>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-sm text-mendoza-muted">
                    <CalendarDays aria-hidden="true" size={17} />
                    Enviada el {formatDateTime(result.submittedAt)}
                  </p>
                  <Link
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-mendoza-blue px-4 py-2 text-sm font-semibold text-mendoza-blue transition hover:bg-mendoza-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue"
                    to={`/colegio/resultados/${result.campaign.id}`}
                  >
                    Ver resultado preliminar
                  </Link>
                </Card>
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function PreliminaryResultDetail({ campaignId }: { campaignId: string }) {
  const [preliminaryResult, setPreliminaryResult] =
    useState<SchoolPreliminaryResult | null>(null);
  const [error, setError] = useState<ResultError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPreliminaryResult(
        await schoolResultsService.getByCampaign(campaignId),
      );
    } catch (loadError) {
      setError(resultError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <main className="p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <LoadingState label="Cargando resultado preliminar…" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <ResultErrorView error={error} onRetry={() => void load()} />
    );
  }

  if (!preliminaryResult) {
    return (
      <ResultErrorView
        error={{
          kind: "server",
          message: "No pudimos cargar el resultado preliminar.",
        }}
        onRetry={() => void load()}
      />
    );
  }

  const mentalHealth = preliminaryResult.result.mentalHealthCritical;
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          backLabel="Volver a resultados"
          backTo="/colegio/resultados"
          description="La información corresponde al momento del envío y se presenta en modo de sólo lectura."
          eyebrow="Evaluación institucional"
          title="Resultado preliminar"
        />

        <Card className="mt-7">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-mendoza-blue">
                <School aria-hidden="true" size={18} />
                {preliminaryResult.school.name}
              </p>
              <p className="mt-1 text-sm text-mendoza-muted">
                CUE {preliminaryResult.school.cue}
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <Metadata
                  label="Campaña"
                  value={preliminaryResult.campaign.name}
                />
                <Metadata
                  label="Fecha de envío"
                  value={formatDateTime(
                    preliminaryResult.submission.submittedAt,
                  )}
                />
                <Metadata
                  label="Cuestionario"
                  value={`${preliminaryResult.survey.name} · versión ${preliminaryResult.survey.version.number}`}
                />
              </dl>
            </div>
            <div className="flex items-center justify-center rounded-2xl bg-mendoza-blue p-6 text-center text-white">
              <div>
                <p className="text-sm font-semibold text-white/80">
                  Puntaje general
                </p>
                <p className="mt-1 text-5xl font-bold">
                  {formatScore(preliminaryResult.result.generalScore)}
                </p>
                <p className="mt-1 text-sm text-white/80">sobre 100 puntos</p>
              </div>
            </div>
          </div>
        </Card>

        {mentalHealth.isCritical && (
          <section
            aria-labelledby="mental-health-alert-title"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
            role="alert"
          >
            <div className="flex gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="shrink-0 text-mendoza-error"
                size={24}
              />
              <div>
                <h2
                  className="font-bold text-mendoza-text"
                  id="mental-health-alert-title"
                >
                  Área crítica: Salud Mental y Bienestar Emocional
                </h2>
                <p className="mt-1 text-sm leading-6 text-mendoza-text">
                  El resultado preliminar de esta dimensión es{" "}
                  <strong>
                    {mentalHealth.value === null
                      ? "no disponible"
                      : `${formatScore(mentalHealth.value)} puntos`}
                  </strong>
                  . El área se considera crítica cuando el valor es menor a{" "}
                  {mentalHealth.threshold === null
                    ? "33"
                    : formatScore(mentalHealth.threshold)}
                  .
                </p>
              </div>
            </div>
          </section>
        )}

        {!preliminaryResult.dataQuality.complete && (
          <section
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
            role="status"
          >
            <p className="font-bold">Datos históricos incompletos</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {preliminaryResult.dataQuality.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}

        <Card className="mt-6">
          <PreliminaryResultRadar
            dimensions={preliminaryResult.result.dimensions}
          />
        </Card>

        <section aria-labelledby="dimensions-title" className="mt-8">
          <h2
            className="text-2xl font-bold text-mendoza-text"
            id="dimensions-title"
          >
            Resultado de las seis dimensiones
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...preliminaryResult.result.dimensions]
              .sort((left, right) => left.order - right.order)
              .map((dimension) => (
                <Card as="article" key={dimension.code}>
                  <p className="text-sm font-semibold text-mendoza-muted">
                    Dimensión {dimension.order}
                  </p>
                  <h3 className="mt-1 min-h-12 font-bold text-mendoza-text">
                    {dimension.title}
                  </h3>
                  <p className="mt-4 text-3xl font-bold text-mendoza-blue">
                    {dimension.score === null
                      ? "No disponible"
                      : `${formatScore(dimension.score)} / 100`}
                  </p>
                </Card>
              ))}
          </div>
        </section>

        <section aria-labelledby="answers-title" className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className="text-2xl font-bold text-mendoza-text"
                id="answers-title"
              >
                Respuestas enviadas
              </h2>
              <p className="mt-1 text-sm text-mendoza-muted">
                {preliminaryResult.answers.length} respuestas de{" "}
                {preliminaryResult.applicableQuestions.length} preguntas
                aplicables.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-mendoza-success">
              <CheckCircle2 aria-hidden="true" size={17} />
              Sólo lectura
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {preliminaryResult.answers.map((answer) => (
              <AnswerCard answer={answer} key={answer.id} />
            ))}
          </div>
        </section>

        <section aria-labelledby="excluded-title" className="mt-10">
          <h2
            className="text-2xl font-bold text-mendoza-text"
            id="excluded-title"
          >
            Preguntas excluidas
          </h2>
          <p className="mt-1 text-sm text-mendoza-muted">
            Estas preguntas no correspondían a la ficha escolar utilizada y no
            participaron del cálculo.
          </p>
          {preliminaryResult.excludedQuestions.length ? (
            <div className="mt-4 space-y-4">
              {preliminaryResult.excludedQuestions.map((question) => (
                <article
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
                  key={question.id}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <Ban aria-hidden="true" size={17} />
                    {question.dimension.title}
                  </p>
                  <h3 className="mt-2 font-bold text-mendoza-text">
                    {question.prompt}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-amber-950">
                    <strong>Motivo de exclusión:</strong>{" "}
                    {question.exclusion.reason}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-mendoza-border bg-white p-5 text-sm text-mendoza-muted">
              No hubo preguntas excluidas en esta presentación.
            </p>
          )}
        </section>

        <p className="mt-8 flex flex-wrap items-center gap-2 text-xs text-mendoza-muted">
          <FileClock aria-hidden="true" size={15} />
          Resultado calculado el{" "}
          {formatDateTime(preliminaryResult.calculation.calculatedAt)} a partir
          de los datos históricos del envío.
        </p>
      </div>
    </main>
  );
}

function AnswerCard({ answer }: { answer: PreliminaryResultAnswer }) {
  return (
    <Card as="article">
      <p className="flex items-center gap-2 text-sm font-semibold text-mendoza-blue">
        <ClipboardCheck aria-hidden="true" size={17} />
        {answer.dimension.title}
      </p>
      <h3 className="mt-2 font-bold text-mendoza-text">{answer.prompt}</h3>
      <dl className="mt-4 grid gap-3 rounded-xl bg-mendoza-background p-4 sm:grid-cols-[1fr_auto]">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-mendoza-muted">
            Respuesta
          </dt>
          <dd className="mt-1 text-sm font-semibold text-mendoza-text">
            {answerValue(answer)}
          </dd>
        </div>
        {answer.answer.scoreUsed !== null && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-mendoza-muted">
              Puntaje utilizado
            </dt>
            <dd className="mt-1 text-sm font-bold text-mendoza-blue">
              {formatScore(answer.answer.scoreUsed)} / 100
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}

function ResultErrorView({
  error,
  onRetry,
}: {
  error: ResultError;
  onRetry: () => void;
}) {
  const state = errorStateContent(error);
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          backLabel="Volver a resultados"
          backTo="/colegio/resultados"
          eyebrow="Evaluación institucional"
          title="Resultado preliminar"
        />
        <div className="mt-8">
          {error.kind === "server" ? (
            <ErrorState message={error.message} onRetry={onRetry} />
          ) : (
            <EmptyState
              action={
                error.kind === "draft" ? (
                  <Link
                    className="font-semibold text-mendoza-blue hover:underline"
                    to="/colegio/cuestionario"
                  >
                    Volver al cuestionario
                  </Link>
                ) : undefined
              }
              description={error.message}
              icon={state.icon}
              title={state.title}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-mendoza-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-mendoza-text">{value}</dd>
    </div>
  );
}

function answerValue(answer: PreliminaryResultAnswer) {
  if (answer.answer.optionLabel) return answer.answer.optionLabel;
  if (typeof answer.answer.value === "boolean") {
    return answer.answer.value ? "Sí" : "No";
  }
  return answer.answer.value === null || answer.answer.value === ""
    ? "Sin respuesta"
    : String(answer.answer.value);
}

function formatScore(score: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(score);
}

function resultError(error: unknown): ResultError {
  if (
    axios.isAxiosError<{
      code?: string;
      message?: string;
    }>(error)
  ) {
    const code = error.response?.data?.code;
    const message =
      error.response?.data?.message ?? "No pudimos consultar el resultado.";
    if (code === "SUBMISSION_DRAFT") return { kind: "draft", message };
    if (code === "SUBMISSION_NOT_FOUND")
      return { kind: "not-found", message };
    if (code === "PRELIMINARY_RESULT_NOT_GENERATED")
      return { kind: "not-generated", message };
    if (code === "HISTORICAL_RESULT_INCOMPLETE")
      return { kind: "incomplete", message };
    if (error.response?.status === 403) return { kind: "denied", message };
    if (error.response?.status === 404) return { kind: "not-found", message };
    return { kind: "server", message };
  }
  return {
    kind: "server",
    message: "No pudimos consultar el resultado preliminar.",
  };
}

function errorStateContent(error: ResultError) {
  if (error.kind === "draft") {
    return { title: "Presentación en borrador", icon: ClipboardCheck };
  }
  if (error.kind === "not-generated") {
    return { title: "Resultado todavía no generado", icon: FileClock };
  }
  if (error.kind === "denied") {
    return { title: "Acceso denegado", icon: Ban };
  }
  if (error.kind === "incomplete") {
    return { title: "Datos históricos incompletos", icon: AlertTriangle };
  }
  return { title: "Presentación no encontrada", icon: BarChart3 };
}

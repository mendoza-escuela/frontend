import {
  AlertCircle,
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Info,
  LockKeyhole,
  PlayCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QuestionnaireRenderer } from "../../components/surveys/QuestionnaireRenderer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { formatDateTime } from "../../lib/format";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { schoolCampaignsService } from "../../services/school-campaigns.service";
import type {
  AvailableSchoolCampaign,
  AvailableSchoolCampaignsResponse,
  SchoolSubmissionWorkspace,
  SubmissionAnswerInput,
} from "../../types/school-campaign";
import type {
  PublishedSurvey,
  QuestionnaireFormValues,
} from "../../types/survey";

export function SchoolSurveyPage() {
  const [available, setAvailable] =
    useState<AvailableSchoolCampaignsResponse | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [workspace, setWorkspace] =
    useState<SchoolSubmissionWorkspace | null>(null);
  const [pendingSubmission, setPendingSubmission] =
    useState<QuestionnaireFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceReloadKey, setWorkspaceReloadKey] = useState(0);
  const [selectedExpiredDraftId, setSelectedExpiredDraftId] = useState("");
  const [expiredWorkspace, setExpiredWorkspace] =
    useState<SchoolSubmissionWorkspace | null>(null);
  const [expiredWorkspaceError, setExpiredWorkspaceError] = useState("");
  const [isOpeningExpiredDraft, setIsOpeningExpiredDraft] = useState(false);
  const activeWorkspaceRequestId = useRef(0);
  const expiredWorkspaceRequestId = useRef(0);

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await schoolCampaignsService.list();
      setAvailable(response);
      setSelectedCampaignId((current) =>
        response.items.some((campaign) => campaign.id === current)
          ? current
          : (response.items[0]?.id ?? ""),
      );
    } catch (loadError) {
      setError(getHttpErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const selectedCampaign = useMemo(
    () =>
      available?.items.find(
        (campaign) => campaign.id === selectedCampaignId,
      ) ?? null,
    [available, selectedCampaignId],
  );

  useEffect(() => {
    const requestId = ++activeWorkspaceRequestId.current;
    setIsOpening(false);
    setWorkspace(null);
    setWorkspaceError("");
    if (!selectedCampaign) return;
    expiredWorkspaceRequestId.current += 1;
    setSelectedExpiredDraftId("");
    setExpiredWorkspace(null);
    setExpiredWorkspaceError("");
    if (!selectedCampaign.submission) return;
    let active = true;
    setIsOpening(true);
    schoolCampaignsService
      .workspace(selectedCampaign.id)
      .then((response) => {
        if (active && requestId === activeWorkspaceRequestId.current)
          setWorkspace(response);
      })
      .catch((loadError) => {
        if (active && requestId === activeWorkspaceRequestId.current)
          setWorkspaceError(getHttpErrorMessage(loadError));
      })
      .finally(() => {
        if (active && requestId === activeWorkspaceRequestId.current)
          setIsOpening(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCampaign, workspaceReloadKey]);

  const openCampaign = async () => {
    if (!selectedCampaign) return;
    const requestId = ++activeWorkspaceRequestId.current;
    expiredWorkspaceRequestId.current += 1;
    setSelectedExpiredDraftId("");
    setExpiredWorkspace(null);
    setExpiredWorkspaceError("");
    setIsOpening(true);
    try {
      const hasSubmission = Boolean(selectedCampaign.submission);
      const response =
        hasSubmission
          ? await schoolCampaignsService.workspace(selectedCampaign.id)
          : await schoolCampaignsService.start(selectedCampaign.id);
      if (requestId === activeWorkspaceRequestId.current)
        setWorkspace(response);
      if (!hasSubmission && requestId === activeWorkspaceRequestId.current)
        await loadCampaigns();
    } catch (openError) {
      if (requestId === activeWorkspaceRequestId.current)
        showError(getHttpErrorMessage(openError));
    } finally {
      if (requestId === activeWorkspaceRequestId.current) setIsOpening(false);
    }
  };

  const openExpiredDraft = async (campaignId: string) => {
    activeWorkspaceRequestId.current += 1;
    const requestId = ++expiredWorkspaceRequestId.current;
    setIsOpening(false);
    setWorkspace(null);
    setWorkspaceError("");
    setSelectedExpiredDraftId(campaignId);
    setExpiredWorkspace(null);
    setExpiredWorkspaceError("");
    setIsOpeningExpiredDraft(true);
    try {
      const response = await schoolCampaignsService.workspace(campaignId);
      if (requestId === expiredWorkspaceRequestId.current)
        setExpiredWorkspace(response);
    } catch (loadError) {
      if (requestId === expiredWorkspaceRequestId.current)
        setExpiredWorkspaceError(getHttpErrorMessage(loadError));
    } finally {
      if (requestId === expiredWorkspaceRequestId.current)
        setIsOpeningExpiredDraft(false);
    }
  };

  const saveDraft = useCallback(
    async (values: QuestionnaireFormValues) => {
      if (!workspace) return;
      const saved = await schoolCampaignsService.saveDraft(
        workspace.campaign.id,
        formValuesToAnswers(workspace.survey, values),
      );
      setWorkspace(saved);
    },
    [workspace],
  );

  const confirmSubmission = async () => {
    if (!workspace || !pendingSubmission) return;
    setIsSubmitting(true);
    try {
      await schoolCampaignsService.saveDraft(
        workspace.campaign.id,
        formValuesToAnswers(workspace.survey, pendingSubmission),
      );
      const submitted = await schoolCampaignsService.submit(
        workspace.campaign.id,
      );
      setWorkspace(submitted);
      setPendingSubmission(null);
      showSuccess("La presentación fue enviada correctamente.");
      await loadCampaigns();
    } catch (submitError) {
      showError(getHttpErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Buscando etapas activas…" />
      </main>
    );

  if (error)
    return (
      <main className="p-4 sm:p-8">
        <ErrorState message={error} onRetry={() => void loadCampaigns()} />
      </main>
    );

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
          Evaluación institucional
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mendoza-text">
          Etapas disponibles
        </h1>
        <p className="mt-2 text-mendoza-muted">
          Seleccioná una etapa para iniciar o continuar la presentación de tu
          establecimiento.
        </p>

        {!available?.items.length ? (
          <section className="mt-8 rounded-2xl border border-dashed border-mendoza-gold bg-white p-8 text-center">
            <CalendarDays
              aria-hidden="true"
              className="mx-auto text-mendoza-blue"
              size={38}
            />
            <h2 className="mt-4 text-xl font-bold text-mendoza-text">
              No hay etapas abiertas
            </h2>
            <p className="mt-2 text-sm text-mendoza-muted">
              Las etapas aparecerán aquí cuando estén activas y dentro de su
              período de carga.
            </p>
          </section>
        ) : (
          <>
            {available.items.length > 1 && (
              <div className="mt-6 max-w-xl">
                <SearchableSelect
                  allLabel="Seleccionar etapa"
                  label="Etapa"
                  onChange={setSelectedCampaignId}
                  options={available.items.map((campaign) => ({
                    value: campaign.id,
                    label: campaign.sequenceOrder
                      ? `${campaign.sequenceOrder}. ${campaign.name}`
                      : campaign.name,
                  }))}
                  value={selectedCampaignId}
                />
              </div>
            )}

            {selectedCampaign && (
              <CampaignIntroduction
                campaign={selectedCampaign}
                isOpening={isOpening}
                onOpen={() => void openCampaign()}
                rectificationPeriod={available.rectification.periodYear}
                schoolActive={available.school.isActive}
                workspace={workspace}
              />
            )}

            {isOpening && !workspace ? (
              <div className="mt-6">
                <LoadingState label="Preparando presentación…" />
              </div>
            ) : workspaceError ? (
              <div className="mt-6">
                <ErrorState
                  message={workspaceError}
                  onRetry={() => setWorkspaceReloadKey((current) => current + 1)}
                />
              </div>
            ) : (
              workspace && (
                <div className="mt-6">
                  <ApplicabilityNotice workspace={workspace} />
                  {workspace.survey.version.dimensions.length ? (
                    <QuestionnaireRenderer
                      defaultValues={workspace.answers}
                      key={workspace.submission.id}
                      onSaveDraft={
                        workspace.submission.editable ? saveDraft : undefined
                      }
                      onSubmit={(answers) => setPendingSubmission(answers)}
                      readOnly={!workspace.submission.editable}
                      submitDisabled={!workspace.submission.canSubmit}
                      submitDisabledReason={
                        workspace.applicability.status === "incomplete"
                          ? "Completá la ficha escolar antes de enviar."
                          : undefined
                      }
                      submitLabel="Enviar presentación"
                      survey={workspace.survey}
                      validateOnSectionChange={false}
                    />
                  ) : (
                    <Card>
                      <Info
                        aria-hidden="true"
                        className="text-mendoza-blue"
                        size={24}
                      />
                      <h2 className="mt-3 text-lg font-bold text-mendoza-text">
                        No hay preguntas aplicables
                      </h2>
                      <p className="mt-2 text-sm text-mendoza-muted">
                        Las reglas del cuestionario excluyeron todas las
                        preguntas para la ficha rectificada de esta
                        presentación.
                      </p>
                      {workspace.submission.canSubmit && (
                        <div className="mt-5 flex justify-end">
                          <Button onClick={() => setPendingSubmission({})}>
                            Enviar presentación
                          </Button>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              )
            )}
          </>
        )}

        <ExpiredDraftsSection
          campaigns={available?.expiredDrafts ?? []}
          isOpening={isOpeningExpiredDraft}
          onOpen={(campaignId) => void openExpiredDraft(campaignId)}
          selectedCampaignId={selectedExpiredDraftId}
          workspace={expiredWorkspace}
          workspaceError={expiredWorkspaceError}
        />
      </div>

      <ConfirmDialog
        confirmLabel="Enviar presentación"
        description="Después del envío las respuestas quedarán bloqueadas y no podrán modificarse. Verificá la información antes de continuar."
        isProcessing={isSubmitting}
        onCancel={() => setPendingSubmission(null)}
        onConfirm={confirmSubmission}
        open={Boolean(pendingSubmission)}
        title="¿Confirmar el envío definitivo?"
      />
    </main>
  );
}

function ExpiredDraftsSection({
  campaigns,
  selectedCampaignId,
  workspace,
  workspaceError,
  isOpening,
  onOpen,
}: {
  campaigns: AvailableSchoolCampaign[];
  selectedCampaignId: string;
  workspace: SchoolSubmissionWorkspace | null;
  workspaceError: string;
  isOpening: boolean;
  onOpen: (campaignId: string) => void;
}) {
  if (!campaigns.length) return null;

  return (
    <section aria-labelledby="expired-drafts-title" className="mt-10">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-mendoza-gold/20 p-2.5 text-mendoza-blue">
          <Archive aria-hidden="true" size={22} />
        </span>
        <div>
          <h2
            className="text-2xl font-bold text-mendoza-text"
            id="expired-drafts-title"
          >
            Borradores vencidos
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-mendoza-muted">
            Estas etapas ya finalizaron. Podés consultar las respuestas que
            quedaron guardadas, pero no modificarlas ni enviarlas.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {campaigns.map((campaign) => {
          const selected = campaign.id === selectedCampaignId;
          const progress = campaign.submission?.progress;
          return (
            <article
              className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${
                selected
                  ? "border-mendoza-blue ring-2 ring-mendoza-blue/10"
                  : "border-mendoza-border"
              }`}
              key={campaign.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-mendoza-background px-3 py-1 text-xs font-bold text-mendoza-muted">
                      Vencida · sólo lectura
                    </span>
                    <span className="text-xs font-semibold text-mendoza-muted">
                      {campaign.type === "annual"
                        ? "Etapa anual"
                        : "Etapa semestral"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-mendoza-text">
                    {campaign.name}
                  </h3>
                  <p className="mt-2 text-sm text-mendoza-muted">
                    Período: {formatDateTime(campaign.startsAt)} al{" "}
                    {formatDateTime(campaign.endsAt)}
                  </p>
                </div>

                <Button
                  aria-expanded={selected && Boolean(workspace)}
                  disabled={isOpening && selected}
                  icon={<Eye aria-hidden="true" size={18} />}
                  onClick={() => onOpen(campaign.id)}
                  variant="outline"
                >
                  {isOpening && selected
                    ? "Abriendo…"
                    : "Ver en solo lectura"}
                </Button>
              </div>

              <dl className="mt-5 grid gap-4 border-t border-mendoza-border pt-4 sm:grid-cols-2">
                <Detail
                  icon={CheckCircle2}
                  label="Progreso guardado"
                  value={
                    progress
                      ? `${progress.answered}/${progress.total} respuestas (${progress.percentage}%)`
                      : "Sin respuestas guardadas"
                  }
                />
                <Detail
                  icon={Clock3}
                  label="Último guardado"
                  value={formatDateTime(campaign.submission?.lastSavedAt)}
                />
              </dl>

              {progress && (
                <div className="mt-4">
                  <div
                    aria-label={`${progress.percentage}% del borrador completado`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={progress.percentage}
                    className="h-2 overflow-hidden rounded-full bg-mendoza-background"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-mendoza-gold"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {selected && isOpening && !workspace && (
                <div className="mt-5">
                  <LoadingState label="Cargando borrador vencido…" />
                </div>
              )}

              {selected && workspaceError && (
                <div className="mt-5">
                  <ErrorState
                    message={workspaceError}
                    onRetry={() => onOpen(campaign.id)}
                  />
                </div>
              )}

              {selected && workspace && (
                <div className="mt-6 border-t border-mendoza-border pt-6">
                  <div
                    className="mb-4 flex gap-3 rounded-xl border border-mendoza-gold/50 bg-mendoza-gold/10 p-4 text-sm text-mendoza-text"
                    role="status"
                  >
                    <LockKeyhole
                      aria-hidden="true"
                      className="shrink-0 text-mendoza-blue"
                      size={20}
                    />
                    <div>
                      <h4 className="font-bold">Vista de sólo lectura</h4>
                      <p className="mt-1 text-mendoza-muted">
                        El plazo de esta etapa terminó. Las respuestas se
                        conservan como historial y no pueden modificarse ni
                        enviarse.
                      </p>
                    </div>
                  </div>
                  <ApplicabilityNotice historical workspace={workspace} />
                  {workspace.survey.version.dimensions.length ? (
                    <QuestionnaireRenderer
                      defaultValues={workspace.answers}
                      key={workspace.submission.id}
                      readOnly
                      survey={workspace.survey}
                    />
                  ) : (
                    <Card>
                      <Info
                        aria-hidden="true"
                        className="text-mendoza-blue"
                        size={24}
                      />
                      <h4 className="mt-3 text-lg font-bold text-mendoza-text">
                        No hay preguntas para mostrar
                      </h4>
                      <p className="mt-2 text-sm text-mendoza-muted">
                        El borrador no contiene preguntas aplicables en su
                        versión histórica.
                      </p>
                    </Card>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ApplicabilityNotice({
  workspace,
  historical = false,
}: {
  workspace: SchoolSubmissionWorkspace;
  historical?: boolean;
}) {
  if (workspace.applicability.status === "incomplete") {
    return (
      <section
        className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        role="alert"
      >
        <div className="flex gap-3">
          <AlertCircle aria-hidden="true" className="shrink-0" size={20} />
          <div>
            <h2 className="font-bold">
              {historical
                ? "El borrador quedó con datos escolares incompletos"
                : "Faltan datos en la ficha escolar"}
            </h2>
            {historical ? (
              <p className="mt-1">
                Se conserva tal como estaba al vencer y no puede regularizarse
                desde esta vista. Datos faltantes:{" "}
                {workspace.applicability.missingFields
                  .map(({ label }) => label)
                  .join(", ")}
                .
              </p>
            ) : (
              <>
                <p className="mt-1">
                  Para determinar qué preguntas corresponden, completá:{" "}
                  {workspace.applicability.missingFields
                    .map(({ label }) => label)
                    .join(", ")}
                  .
                </p>
                <Link
                  className="mt-3 inline-flex font-semibold text-mendoza-blue hover:underline"
                  to="/colegio/establecimiento"
                >
                  Ir a la rectificación escolar
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }
  if (!workspace.applicability.excluded.length) return null;
  return (
    <p className="mb-4 flex gap-2 rounded-xl bg-mendoza-blue-soft p-4 text-sm text-mendoza-blue">
      <Info aria-hidden="true" className="shrink-0" size={19} />
      {workspace.applicability.excluded.length}{" "}
      {workspace.applicability.excluded.length === 1
        ? "pregunta fue excluida"
        : "preguntas fueron excluidas"}{" "}
      automáticamente según la ficha escolar.
    </p>
  );
}

function CampaignIntroduction({
  campaign,
  workspace,
  isOpening,
  schoolActive,
  rectificationPeriod,
  onOpen,
}: {
  campaign: AvailableSchoolCampaign;
  workspace: SchoolSubmissionWorkspace | null;
  isOpening: boolean;
  schoolActive: boolean;
  rectificationPeriod: number;
  onOpen: () => void;
}) {
  const submitted =
    workspace?.submission.status === "submitted" ||
    campaign.submission?.status === "submitted";
  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-mendoza-blue">
            <CalendarDays aria-hidden="true" size={18} />
            {campaign.type === "annual" ? "Etapa anual" : "Etapa semestral"}
            {campaign.workflowCycle && campaign.sequenceOrder && (
              <span>· {campaign.workflowCycle} · Paso {campaign.sequenceOrder}</span>
            )}
          </div>
          <h2 className="mt-2 text-2xl font-bold text-mendoza-text">
            {campaign.name}
          </h2>
          {campaign.description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-mendoza-muted">
              {campaign.description}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            submitted
              ? "bg-green-50 text-mendoza-success"
              : campaign.submission
                ? "bg-amber-50 text-amber-800"
                : "bg-mendoza-blue-soft text-mendoza-blue"
          }`}
        >
          {submitted
            ? "Enviada"
            : campaign.workflowStatus === "locked"
              ? "Bloqueada"
              : campaign.submission
              ? "Borrador iniciado"
              : "Sin iniciar"}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 border-y border-mendoza-border py-4 sm:grid-cols-3">
        <Detail
          icon={Clock3}
          label="Cierre"
          value={formatDateTime(campaign.endsAt)}
        />
        <Detail
          icon={Info}
          label="Cuestionario"
          value={`${campaign.surveyVersion.survey.name} · versión ${campaign.surveyVersion.versionNumber}`}
        />
        <Detail
          icon={CheckCircle2}
          label="Progreso"
          value={
            campaign.submission
              ? `${campaign.submission.progress.answered}/${campaign.submission.progress.total} respuestas`
              : "Todavía no iniciado"
          }
        />
      </dl>

      {workspace?.submission.blockingReason && (
        <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle aria-hidden="true" className="shrink-0" size={19} />
          {workspace.submission.blockingReason}
        </div>
      )}

      {!workspace && campaign.blockingReason && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <span className="flex gap-3">
            <AlertCircle aria-hidden="true" className="shrink-0" size={19} />
            {campaign.blockingReason}
          </span>
          {schoolActive && !campaign.blockedBy && (
            <Link
              className="font-semibold text-mendoza-blue hover:underline"
              to="/colegio/establecimiento"
            >
              Rectificar ficha {rectificationPeriod}
            </Link>
          )}
        </div>
      )}

      {!workspace && !campaign.submission && (
        <div className="mt-5 flex justify-end">
          <Button
            disabled={!campaign.canStart || isOpening}
            icon={<PlayCircle aria-hidden="true" size={18} />}
            onClick={onOpen}
          >
            {isOpening ? "Preparando…" : "Comenzar evaluación"}
          </Button>
        </div>
      )}

      {!workspace && campaign.submission?.status === "draft" && (
        <div className="mt-5 flex justify-end">
          <Button
            disabled={!campaign.canStart || isOpening}
            icon={<PlayCircle aria-hidden="true" size={18} />}
            onClick={onOpen}
          >
            {isOpening ? "Abriendo…" : "Continuar evaluación"}
          </Button>
        </div>
      )}

      {submitted && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-green-50 p-3 text-sm text-mendoza-success">
          <p className="flex gap-2">
            <CheckCircle2 aria-hidden="true" className="shrink-0" size={18} />
            La presentación fue enviada y las respuestas quedaron protegidas.
          </p>
          <Link
            className="font-semibold text-mendoza-blue hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue"
            to={`/colegio/resultados/${campaign.id}`}
          >
            Ver resultado preliminar
          </Link>
        </div>
      )}
    </Card>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Info;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-bold uppercase text-mendoza-muted">
        <Icon aria-hidden="true" size={15} />
        {label}
      </dt>
      <dd className="mt-1 text-sm text-mendoza-text">{value}</dd>
    </div>
  );
}

function formValuesToAnswers(
  survey: PublishedSurvey,
  values: QuestionnaireFormValues,
): SubmissionAnswerInput[] {
  return survey.version.dimensions.flatMap((dimension) =>
    dimension.sections.flatMap((section) =>
      section.questions.flatMap((question): SubmissionAnswerInput[] => {
        const value = values[question.id];
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        )
          return [];
        if (question.type === "single_choice")
          return [{ questionId: question.id, optionId: String(value) }];
        if (question.type === "number")
          return [{ questionId: question.id, value: Number(value) }];
        if (question.type === "multiple_choice")
          return [];
        return [{ questionId: question.id, value: String(value) }];
      }),
    ),
  );
}

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  PlayCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QuestionnaireRenderer } from "../../components/surveys/QuestionnaireRenderer";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { inputClassName } from "../../components/ui/form-styles";
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
    setWorkspace(null);
    setWorkspaceError("");
    if (!selectedCampaign?.submission) return;
    let active = true;
    setIsOpening(true);
    schoolCampaignsService
      .workspace(selectedCampaign.id)
      .then((response) => {
        if (active) setWorkspace(response);
      })
      .catch((loadError) => {
        if (active) setWorkspaceError(getHttpErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setIsOpening(false);
      });
    return () => {
      active = false;
    };
  }, [
    selectedCampaign?.id,
    selectedCampaign?.submission,
    workspaceReloadKey,
  ]);

  const openCampaign = async () => {
    if (!selectedCampaign) return;
    setIsOpening(true);
    try {
      setWorkspace(await schoolCampaignsService.start(selectedCampaign.id));
      await loadCampaigns();
    } catch (openError) {
      showError(getHttpErrorMessage(openError));
    } finally {
      setIsOpening(false);
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
        <LoadingState label="Buscando campañas activas…" />
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
          Campañas disponibles
        </h1>
        <p className="mt-2 text-mendoza-muted">
          Seleccioná una campaña para iniciar o continuar la presentación de tu
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
              No hay campañas abiertas
            </h2>
            <p className="mt-2 text-sm text-mendoza-muted">
              Las campañas aparecerán aquí cuando estén activas y dentro de su
              período de carga.
            </p>
          </section>
        ) : (
          <>
            {available.items.length > 1 && (
              <label className="mt-6 block max-w-xl text-sm font-semibold text-mendoza-text">
                Campaña
                <select
                  className={`${inputClassName} mt-2`}
                  onChange={(event) =>
                    setSelectedCampaignId(event.target.value)
                  }
                  value={selectedCampaignId}
                >
                  {available.items.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </label>
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
                  <QuestionnaireRenderer
                    defaultValues={workspace.answers}
                    key={workspace.submission.id}
                    onSaveDraft={
                      workspace.submission.editable ? saveDraft : undefined
                    }
                    onSubmit={(answers) => setPendingSubmission(answers)}
                    readOnly={!workspace.submission.editable}
                    submitLabel="Enviar presentación"
                    survey={workspace.survey}
                    validateOnSectionChange={false}
                  />
                </div>
              )
            )}
          </>
        )}
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
            {campaign.type === "annual" ? "Campaña anual" : "Campaña semestral"}
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

      {!workspace && !campaign.submission && campaign.blockingReason && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <span className="flex gap-3">
            <AlertCircle aria-hidden="true" className="shrink-0" size={19} />
            {campaign.blockingReason}
          </span>
          {schoolActive && (
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

      {submitted && (
        <p className="mt-4 flex gap-2 rounded-lg bg-green-50 p-3 text-sm text-mendoza-success">
          <CheckCircle2 aria-hidden="true" className="shrink-0" size={18} />
          La presentación fue enviada y las respuestas quedaron protegidas.
        </p>
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

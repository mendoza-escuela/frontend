import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  Archive,
  ClipboardCopy,
  Eye,
  GitCompareArrows,
  FileSpreadsheet,
  Pencil,
  Plus,
  Send,
  Settings2,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  ActiveStatusBadge,
  VersionStatusBadge,
} from "../../components/ui/StatusBadge";
import { inputClassName } from "../../components/ui/form-styles";
import { formatDateTime } from "../../lib/format";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type {
  AdminSurveyDetail,
  SurveyStructureValidation,
  SurveyVersionSummary,
} from "../../types/admin-survey";

const createVersionSchema = z.object({
  title: z.string().trim().min(1, "Ingresá un título.").max(255),
  instructions: z.string().max(10000),
  origin: z.string(),
});

type CreateVersionForm = z.infer<typeof createVersionSchema>;
type PendingAction =
  | {
      type: "publish";
      version: SurveyVersionSummary;
      validation: SurveyStructureValidation;
    }
  | { type: "archive"; version: SurveyVersionSummary }
  | { type: "delete"; version: SurveyVersionSummary }
  | null;

export function SurveyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<AdminSurveyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateVersionForm>({
    resolver: zodResolver(createVersionSchema),
    defaultValues: {
      title: "",
      instructions: "",
      origin: "template:official_dimensions",
    },
  });

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError("");
    try {
      setSurvey(await adminSurveysService.findOne(id));
    } catch (loadError) {
      setError(getHttpErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openNewVersion = (source?: SurveyVersionSummary) => {
    reset({
      title: source ? `Copia de ${source.title}` : "",
      instructions: "",
      origin: source ? `version:${source.id}` : "template:official_dimensions",
    });
    setVersionModalOpen(true);
  };

  const createVersion = handleSubmit(async (values) => {
    if (!id) return;
    try {
      const sourceVersionId = values.origin.startsWith("version:")
        ? values.origin.slice("version:".length)
        : undefined;
      const template = sourceVersionId
        ? undefined
        : values.origin === "template:blank"
          ? ("blank" as const)
          : ("official_dimensions" as const);
      const created = await adminSurveysService.createVersion(id, {
        title: values.title,
        instructions: values.instructions || undefined,
        sourceVersionId,
        template,
      });
      showSuccess(
        sourceVersionId
          ? "Nueva versión creada a partir de la seleccionada."
          : template === "official_dimensions"
            ? "Versión creada con las seis dimensiones oficiales."
            : "Versión borrador vacía creada.",
      );
      setVersionModalOpen(false);
      await load();
      navigate(`/admin/cuestionarios/${id}/versiones/${created.id}/editar`);
    } catch (createError) {
      showError(getHttpErrorMessage(createError));
    }
  });

  const confirmAction = async () => {
    if (!id || !pendingAction) return;
    setIsProcessing(true);
    try {
      if (pendingAction.type === "publish") {
        await adminSurveysService.publishVersion(id, pendingAction.version.id);
        showSuccess(publicationSuccessMessage(pendingAction.validation));
      } else if (pendingAction.type === "archive") {
        await adminSurveysService.archiveVersion(id, pendingAction.version.id);
        showSuccess("La versión fue archivada y queda disponible para consulta.");
      } else {
        await adminSurveysService.removeVersion(id, pendingAction.version.id);
        showSuccess("La versión borrador fue eliminada.");
      }
      setPendingAction(null);
      await load();
    } catch (actionError) {
      showError(getHttpErrorMessage(actionError));
    } finally {
      setIsProcessing(false);
    }
  };

  const preparePublication = async (version: SurveyVersionSummary) => {
    if (!id) return;
    setIsValidating(true);
    try {
      const validation = await adminSurveysService.validateVersion(
        id,
        version.id,
      );
      if (validation.valid) {
        setPendingAction({ type: "publish", version, validation });
      } else {
        setValidationErrors(validation.errors);
      }
    } catch (validationError) {
      showError(getHttpErrorMessage(validationError));
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Cargando cuestionario…" />
      </main>
    );
  if (error || !survey)
    return (
      <main className="p-4 sm:p-8">
        <ErrorState message={error || "Cuestionario no encontrado."} />
      </main>
    );

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          actions={
            <>
              {survey.versions.length >= 2 && (
                <Button
                  icon={<GitCompareArrows aria-hidden="true" size={18} />}
                  onClick={() =>
                    navigate(`/admin/cuestionarios/${survey.id}/comparar`)
                  }
                  variant="outline"
                >
                  Comparar versiones
                </Button>
              )}
              <Button
                icon={<FileSpreadsheet aria-hidden="true" size={18} />}
                onClick={() =>
                  navigate(`/admin/cuestionarios/${survey.id}/importar`)
                }
                variant="outline"
              >
                Importar planilla
              </Button>
              <Button
                icon={<Plus aria-hidden="true" size={18} />}
                onClick={() => openNewVersion()}
              >
                Nueva versión
              </Button>
            </>
          }
          backLabel="Volver a cuestionarios"
          backTo="/admin/cuestionarios"
          description={survey.description ?? "Sin descripción."}
          eyebrow="Cuestionario"
          title={survey.name}
        />

        <Card className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ActiveStatusBadge isActive={survey.isActive} />
                <span className="font-mono text-xs text-mendoza-muted">
                  {survey.code}
                </span>
              </div>
              <p className="mt-3 text-sm text-mendoza-muted">
                Actualizado {formatDateTime(survey.updatedAt)}
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
              to={`/admin/cuestionarios/${survey.id}/editar`}
            >
              <Pencil aria-hidden="true" size={16} /> Editar definición
            </Link>
          </div>
        </Card>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-mendoza-text">Versiones</h2>
          {survey.versions.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                action={
                  <Button onClick={() => openNewVersion()}>
                    Crear versión
                  </Button>
                }
                description="La primera versión se crea como borrador y puede editarse antes de publicar."
                title="El cuestionario todavía no tiene versiones"
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {survey.versions.map((version) => (
                <Card as="article" key={version.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <VersionStatusBadge status={version.status} />
                        <span className="text-sm font-bold text-mendoza-blue">
                          Versión {version.versionNumber}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-mendoza-text">
                        {version.title}
                      </h3>
                      <p className="mt-2 text-sm text-mendoza-muted">
                        {version.publishedAt
                          ? `Publicada ${formatDateTime(version.publishedAt)}`
                          : `Actualizada ${formatDateTime(version.updatedAt)}`}
                      </p>
                    </div>
                    {version.counts && (
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                        {Object.entries(version.counts).map(
                          ([label, value]) => (
                            <div key={label}>
                              <dt className="capitalize text-mendoza-muted">
                                {label}
                              </dt>
                              <dd className="font-bold text-mendoza-text">
                                {value}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    )}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-mendoza-border pt-4">
                    {version.status === "draft" && (
                      <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-mendoza-blue px-3 text-sm font-semibold text-white hover:bg-mendoza-blue-dark"
                        to={`/admin/cuestionarios/${survey.id}/versiones/${version.id}/editar`}
                      >
                        <Pencil aria-hidden="true" size={16} /> Editar
                        estructura
                      </Link>
                    )}
                    <Link
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
                      to={`/admin/cuestionarios/${survey.id}/versiones/${version.id}/vista-previa`}
                    >
                      <Eye aria-hidden="true" size={16} /> Vista previa
                    </Link>
                    <Link
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
                      to={`/admin/cuestionarios/${survey.id}/versiones/${version.id}/reglas`}
                    >
                      <Settings2 aria-hidden="true" size={16} /> Reglas
                    </Link>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
                      onClick={() => openNewVersion(version)}
                      type="button"
                    >
                      <ClipboardCopy aria-hidden="true" size={16} /> Clonar
                    </button>
                    {version.status === "draft" && (
                      <>
                        <button
                          disabled={isValidating}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-success hover:bg-green-50"
                          onClick={() => void preparePublication(version)}
                          type="button"
                        >
                          <Send aria-hidden="true" size={16} /> Publicar
                        </button>
                        <button
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-error hover:bg-red-50"
                          onClick={() =>
                            setPendingAction({ type: "delete", version })
                          }
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={16} /> Eliminar
                        </button>
                      </>
                    )}
                    {version.status === "published" && (
                      <button
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-muted hover:bg-mendoza-blue-soft"
                        onClick={() =>
                          setPendingAction({ type: "archive", version })
                        }
                        type="button"
                      >
                        <Archive aria-hidden="true" size={16} /> Archivar
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Card className="mt-8">
          <div className="flex items-center gap-3 text-mendoza-blue">
            <Activity aria-hidden="true" />
            <h2 className="text-xl font-bold">Actividad reciente</h2>
          </div>
          {survey.audits.length === 0 ? (
            <p className="mt-4 text-sm text-mendoza-muted">
              Todavía no hay actividad registrada.
            </p>
          ) : (
            <ol className="mt-5 space-y-4">
              {survey.audits.map((audit) => (
                <li
                  className="border-l-2 border-mendoza-sky pl-4"
                  key={audit.id}
                >
                  <p className="font-semibold text-mendoza-text">
                    {auditLabel(audit.action)}
                  </p>
                  <p className="mt-1 text-sm text-mendoza-muted">
                    {audit.actor
                      ? `${audit.actor.firstName} ${audit.actor.lastName}`
                      : "Sistema"}{" "}
                    · {formatDateTime(audit.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Modal
        description="Podés iniciar con las seis dimensiones oficiales, crear una versión vacía o copiar una estructura existente."
        onClose={() => setVersionModalOpen(false)}
        open={versionModalOpen}
        title="Nueva versión borrador"
      >
        <form className="space-y-5" noValidate onSubmit={createVersion}>
          <FormField
            error={errors.title?.message}
            htmlFor="version-title"
            label="Título"
          >
            <input
              {...register("title")}
              className={inputClassName}
              id="version-title"
            />
          </FormField>
          <FormField
            error={errors.instructions?.message}
            help="Si clonás una versión y dejás este campo vacío, se conservarán sus instrucciones."
            htmlFor="version-instructions"
            label="Instrucciones"
          >
            <textarea
              {...register("instructions")}
              className={inputClassName}
              id="version-instructions"
              rows={4}
            />
          </FormField>
          <FormField
            help="La plantilla oficial incorpora nombres, descripciones y orden; las secciones y preguntas se cargan después."
            htmlFor="version-origin"
            label="Estructura inicial"
          >
            <select
              {...register("origin")}
              className={inputClassName}
              id="version-origin"
            >
              <option value="template:official_dimensions">
                Plantilla oficial · 6 dimensiones
              </option>
              <option value="template:blank">Versión vacía</option>
              {survey.versions.map((version) => (
                <option key={version.id} value={`version:${version.id}`}>
                  Copiar versión {version.versionNumber} · {version.title}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-3 border-t border-mendoza-border pt-5">
            <Button
              onClick={() => setVersionModalOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creando…" : "Crear versión"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel={
          pendingAction?.type === "publish"
            ? "Publicar versión"
            : pendingAction?.type === "archive"
              ? "Archivar versión"
              : "Eliminar"
        }
        description={
          pendingAction?.type === "publish"
            ? publicationConfirmationDescription(pendingAction.validation)
            : pendingAction?.type === "archive"
              ? "No podrá usarse para nuevas evaluaciones, pero seguirá disponible para consultas históricas y clonación."
              : "Esta acción eliminará definitivamente el borrador y su estructura."
        }
        destructive={pendingAction?.type === "delete"}
        isProcessing={isProcessing}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
        open={Boolean(pendingAction)}
        title={
          pendingAction?.type === "publish"
            ? "¿Publicar esta versión?"
            : pendingAction?.type === "archive"
              ? "¿Archivar esta versión?"
              : "¿Eliminar este borrador?"
        }
      />

      <Modal
        description="El backend encontró problemas en la estructura o, si usa códigos institucionales, en el perfil oficial. Corregilos en el borrador antes de intentar publicarlo nuevamente."
        onClose={() => setValidationErrors([])}
        open={validationErrors.length > 0}
        title="La versión todavía no puede publicarse"
      >
        <ul className="space-y-3 text-sm text-mendoza-text">
          {validationErrors.map((message) => (
            <li
              className="rounded-lg border-l-4 border-mendoza-error bg-red-50 p-3"
              key={message}
            >
              {message}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setValidationErrors([])}>Entendido</Button>
        </div>
      </Modal>
    </main>
  );
}

const auditLabels: Record<string, string> = {
  SURVEY_CREATED: "Cuestionario creado",
  SURVEY_UPDATED: "Definición actualizada",
  SURVEY_VERSION_CREATED: "Versión borrador creada",
  SURVEY_VERSION_IMPORTED: "Versión importada desde planilla",
  SURVEY_VERSION_CLONED: "Versión clonada",
  SURVEY_VERSION_UPDATED: "Estructura de versión actualizada",
  SURVEY_VERSION_PUBLISHED: "Versión publicada",
  SURVEY_VERSION_DELETED: "Versión borrador eliminada",
};

function auditLabel(action: string) {
  return auditLabels[action] ?? action;
}

function publicationConfirmationDescription(
  validation: SurveyStructureValidation,
) {
  if (validation.evaluable)
    return "La estructura cumple el perfil institucional de evaluación. Al publicarla quedará inmutable y podrá ofrecerse para nuevas etapas escolares mientras el cuestionario esté activo; para realizar cambios posteriores deberás clonarla.";

  const reasons = validation.evaluationErrors.join(" ");
  return `La estructura es publicable, pero no quedará disponible para etapas escolares${
    reasons ? `: ${reasons}` : "."
  } Al publicarla quedará inmutable; para realizar cambios posteriores deberás clonarla.`;
}

function publicationSuccessMessage(validation: SurveyStructureValidation) {
  if (validation.evaluable)
    return "Versión institucional publicada e inmutable. Podrá ofrecerse para nuevas etapas mientras el cuestionario esté activo.";
  if (validation.profile === "generic")
    return "Versión genérica publicada e inmutable. No estará disponible para etapas escolares.";
  return "Versión publicada e inmutable, pero no quedó habilitada para etapas escolares.";
}

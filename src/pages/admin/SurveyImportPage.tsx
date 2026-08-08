import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Download, FileSpreadsheet, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { inputClassName } from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type {
  AdminSurveyDetail,
  SurveyImportPreview,
} from "../../types/admin-survey";

const importSchema = z.object({
  title: z.string().trim().min(1, "Ingresá un título.").max(255),
  instructions: z.string().max(10000),
});

type ImportForm = z.infer<typeof importSchema>;

export function SurveyImportPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<AdminSurveyDetail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SurveyImportPreview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ImportForm>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      title: "Cuestionario institucional importado",
      instructions: "",
    },
  });

  useEffect(() => {
    if (!surveyId) return;
    adminSurveysService
      .findOne(surveyId)
      .then(setSurvey)
      .catch((error) => setLoadError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [surveyId]);

  const previewFile = async () => {
    if (!surveyId || !file)
      return showError("Seleccioná un archivo CSV o XLSX.");
    setIsValidating(true);
    try {
      setPreview(await adminSurveysService.previewImport(surveyId, file));
    } catch (error) {
      setPreview(null);
      showError(getHttpErrorMessage(error));
    } finally {
      setIsValidating(false);
    }
  };

  const importVersion = handleSubmit(async (values) => {
    if (!surveyId || !file || !preview?.canImport) return;
    try {
      const version = await adminSurveysService.importVersion(surveyId, file, {
        title: values.title,
        instructions: values.instructions || undefined,
      });
      showSuccess(`Se creó la versión ${version.versionNumber} como borrador.`);
      navigate(
        `/admin/cuestionarios/${surveyId}/versiones/${version.id}/editar`,
        { replace: true },
      );
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });

  if (isLoading)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Preparando importación…" />
      </main>
    );
  if (loadError || !survey)
    return (
      <main className="p-4 sm:p-8">
        <ErrorState message={loadError || "Cuestionario no encontrado."} />
      </main>
    );

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          actions={
            <>
              <Button
                icon={<Download aria-hidden="true" size={18} />}
                onClick={() =>
                  void adminSurveysService.downloadImportTemplate("xlsx")
                }
                variant="outline"
              >
                Plantilla Excel
              </Button>
              <Button
                icon={<Download aria-hidden="true" size={18} />}
                onClick={() =>
                  void adminSurveysService.downloadImportTemplate("csv")
                }
                variant="outline"
              >
                Plantilla CSV
              </Button>
            </>
          }
          backLabel="Volver al cuestionario"
          backTo={`/admin/cuestionarios/${survey.id}`}
          description="La planilla se valida completa antes de crear una versión nueva. La vista previa no guarda datos."
          eyebrow={survey.name}
          title="Importar cuestionario"
        />

        <Card className="mt-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-mendoza-sky bg-mendoza-sky/5 p-8 text-center">
              <FileSpreadsheet
                aria-hidden="true"
                className="text-mendoza-blue"
                size={42}
              />
              <span className="mt-3 break-all font-semibold text-mendoza-text">
                {file?.name ?? "Seleccionar archivo"}
              </span>
              <span className="mt-1 text-sm text-mendoza-muted">
                CSV o Excel XLSX · máximo 5 MB
              </span>
              <input
                accept=".csv,.xlsx"
                className="sr-only"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPreview(null);
                }}
                type="file"
              />
            </label>
            <div className="rounded-xl bg-mendoza-background p-5 text-sm text-mendoza-text">
              <h2 className="font-bold text-mendoza-blue">
                Política de importación
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Se utilizan las seis dimensiones oficiales.</li>
                <li>Cada pregunta admite una única respuesta.</li>
                <li>No se admiten “Otro” ni “No aplica”.</li>
                <li>
                  La importación es total: ninguna fila se guarda con errores.
                </li>
                <li>Siempre se crea una versión nueva en estado borrador.</li>
              </ul>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              disabled={!file || isValidating}
              icon={<Upload aria-hidden="true" size={18} />}
              onClick={() => void previewFile()}
            >
              {isValidating ? "Validando…" : "Validar y previsualizar"}
            </Button>
          </div>
        </Card>

        {preview && (
          <section className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Filas" value={preview.totalRows} />
              <Metric label="Dimensiones" value={preview.counts.dimensions} />
              <Metric label="Secciones" value={preview.counts.sections} />
              <Metric label="Preguntas" value={preview.counts.questions} />
              <Metric label="Opciones" value={preview.counts.options} />
            </div>
            <Card className="mt-4">
              <h2 className="text-lg font-bold text-mendoza-text">
                Resumen de creación
              </h2>
              <p className="mt-2 text-sm text-mendoza-muted">
                {preview.summary}
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold">Dimensiones detectadas</dt>
                  <dd className="text-sm text-mendoza-muted">
                    {preview.detectedDimensions
                      .map(({ title }) => title)
                      .join(", ") || "Ninguna"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Secciones detectadas</dt>
                  <dd className="text-sm text-mendoza-muted">
                    {preview.detectedSections
                      .map(({ title }) => title)
                      .join(", ") || "Ninguna"}
                  </dd>
                </div>
              </dl>
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-mendoza-blue">
                  Ver opciones agrupadas por pregunta
                </summary>
                <ul className="mt-2 space-y-2 text-sm">
                  {preview.groupedQuestions.map((question) => (
                    <li key={question.code}>
                      <strong>{question.code}</strong>:{" "}
                      {question.options
                        .map(({ label, score }) => `${label} (${score ?? "sin puntaje"})`)
                        .join(", ")}
                    </li>
                  ))}
                </ul>
              </details>
            </Card>

            {preview.errorCount > 0 && (
              <div className="mt-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <AlertTriangle
                  aria-hidden="true"
                  className="shrink-0"
                  size={20}
                />
                <p>
                  Hay {preview.errorCount} filas con errores. No se creará
                  ninguna versión hasta corregir toda la planilla.
                </p>
              </div>
            )}

            <PreviewTable preview={preview} />

            <Card className="mt-5">
              <form
                className="grid gap-5 lg:grid-cols-2"
                noValidate
                onSubmit={importVersion}
              >
                <FormField
                  error={errors.title?.message}
                  htmlFor="import-title"
                  label="Título de la versión"
                >
                  <input
                    {...register("title")}
                    className={inputClassName}
                    id="import-title"
                  />
                </FormField>
                <FormField
                  error={errors.instructions?.message}
                  htmlFor="import-instructions"
                  label="Instrucciones"
                >
                  <textarea
                    {...register("instructions")}
                    className={inputClassName}
                    id="import-instructions"
                    rows={3}
                  />
                </FormField>
                <div className="flex justify-end lg:col-span-2">
                  <Button
                    disabled={!preview.canImport || isSubmitting}
                    type="submit"
                  >
                    {isSubmitting
                      ? "Creando borrador…"
                      : "Crear versión borrador"}
                  </Button>
                </div>
              </form>
            </Card>
          </section>
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

function PreviewTable({ preview }: { preview: SurveyImportPreview }) {
  return (
    <div className="mt-4 max-h-[36rem] overflow-auto rounded-xl border border-mendoza-border bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-mendoza-blue text-white">
          <tr>
            {[
              "Fila",
              "Dimensión",
              "Pregunta",
              "Opción",
              "Puntaje",
              "Validación",
            ].map((header) => (
              <th className="px-3 py-3" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-mendoza-border">
          {preview.rows.map((row) => (
            <tr
              className={row.errors.length ? "bg-red-50" : ""}
              key={`${row.line}-${row.optionCode}`}
            >
              <td className="px-3 py-3">{row.line}</td>
              <td className="px-3 py-3 font-mono text-xs">
                {row.dimensionCode || "—"}
              </td>
              <td className="max-w-sm px-3 py-3">
                <span className="font-mono text-xs text-mendoza-muted">
                  {row.questionCode || "—"}
                </span>
                <span className="mt-1 block">{row.question || "—"}</span>
              </td>
              <td className="px-3 py-3">{row.option || "—"}</td>
              <td className="px-3 py-3">{row.score ?? "—"}</td>
              <td
                className={
                  row.errors.length
                    ? "max-w-md px-3 py-3 text-mendoza-error"
                    : "px-3 py-3 font-semibold text-green-700"
                }
              >
                {row.errors.length ? row.errors.join(" ") : "Fila válida"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

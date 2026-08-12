import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { adminCampaignsService } from "../../services/admin-campaigns.service";
import type {
  PublishedSurveyVersionOption,
} from "../../types/admin-campaign";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Ingresá al menos 3 caracteres.")
      .max(255, "Ingresá hasta 255 caracteres."),
    description: z.string().max(2000, "Ingresá hasta 2000 caracteres."),
    type: z.enum(["annual", "semiannual"]),
    surveyVersionId: z.string().min(1, "Seleccioná una versión publicada."),
    startDate: z
      .string()
      .regex(datePattern, "Ingresá una fecha de inicio válida."),
    endDate: z
      .string()
      .regex(datePattern, "Ingresá una fecha de cierre válida."),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "La fecha de cierre debe ser igual o posterior al inicio.",
    path: ["endDate"],
  });

type CampaignForm = z.infer<typeof schema>;

export function CampaignFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [versions, setVersions] = useState<PublishedSurveyVersionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      type: "annual",
      surveyVersionId: "",
      startDate: "",
      endDate: "",
    },
  });

  useEffect(() => {
    Promise.all([
      adminCampaignsService.publishedVersions(),
      id ? adminCampaignsService.findOne(id) : Promise.resolve(null),
    ])
      .then(([availableVersions, campaign]) => {
        setVersions(availableVersions);
        if (campaign) {
          reset({
            name: campaign.name,
            description: campaign.description ?? "",
            type: campaign.type,
            surveyVersionId: campaign.surveyVersion.id,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
          });
        }
      })
      .catch((error) => setLoadError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [id, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const campaign = id
        ? await adminCampaignsService.update(id, values)
        : await adminCampaignsService.create(values);
      showSuccess(isEditing ? "Etapa actualizada." : "Etapa creada.");
      navigate(`/admin/campanas/${campaign.id}/escuelas`, { replace: true });
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          backLabel="Volver a etapas"
          backTo="/admin/campanas"
          description="La etapa se crea como borrador. Al activarla, su período y la versión del cuestionario quedan protegidos."
          eyebrow="Etapas"
          title={isEditing ? "Editar etapa" : "Nueva etapa"}
        />

        <div className="mt-8">
          {isLoading ? (
            <LoadingState label="Cargando configuración…" />
          ) : loadError ? (
            <ErrorState message={loadError} />
          ) : versions.length === 0 ? (
            <Card className="text-center">
              <CalendarClock
                aria-hidden="true"
                className="mx-auto text-mendoza-blue"
                size={36}
              />
              <h2 className="mt-4 text-xl font-bold text-mendoza-text">
                No hay versiones publicadas
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-mendoza-muted">
                Publicá una versión de cuestionario antes de crear la etapa.
                Los borradores no pueden utilizarse para evaluar escuelas.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-mendoza-blue px-4 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
                to="/admin/cuestionarios"
              >
                Ir a cuestionarios
              </Link>
            </Card>
          ) : (
            <Card>
              <form
                className="grid gap-5 sm:grid-cols-2"
                noValidate
                onSubmit={submit}
              >
                <FormField
                  className="sm:col-span-2"
                  error={errors.name?.message}
                  htmlFor="name"
                  label="Nombre de la etapa"
                >
                  <input
                    {...register("name")}
                    className={inputClassName}
                    id="name"
                    placeholder="Diagnóstico anual 2026"
                  />
                </FormField>

                <FormField
                  error={errors.type?.message}
                  htmlFor="type"
                  label="Periodicidad"
                >
                  <select
                    {...register("type")}
                    className={inputClassName}
                    id="type"
                  >
                    <option value="annual">Anual</option>
                    <option value="semiannual">Semestral</option>
                  </select>
                </FormField>

                <FormField
                  error={errors.surveyVersionId?.message}
                  help="Sólo se muestran versiones publicadas de cuestionarios activos."
                  htmlFor="surveyVersionId"
                  label="Versión del cuestionario"
                >
                  <select
                    {...register("surveyVersionId")}
                    className={inputClassName}
                    id="surveyVersionId"
                  >
                    <option value="">Seleccionar versión</option>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.surveyName} · versión {version.versionNumber} ·{" "}
                        {version.versionTitle}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  error={errors.startDate?.message}
                  htmlFor="startDate"
                  label="Fecha de inicio"
                >
                  <input
                    {...register("startDate")}
                    className={inputClassName}
                    id="startDate"
                    type="date"
                  />
                </FormField>

                <FormField
                  error={errors.endDate?.message}
                  help="El cierre se almacena a las 23:59:59 de esta fecha, hora de Mendoza."
                  htmlFor="endDate"
                  label="Fecha de cierre"
                >
                  <input
                    {...register("endDate")}
                    className={inputClassName}
                    id="endDate"
                    type="date"
                  />
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  error={errors.description?.message}
                  htmlFor="description"
                  label="Descripción"
                >
                  <textarea
                    {...register("description")}
                    className={inputClassName}
                    id="description"
                    rows={5}
                  />
                </FormField>

                <div className="flex justify-end gap-3 border-t border-mendoza-border pt-5 sm:col-span-2">
                  <Button
                    onClick={() => navigate("/admin/campanas")}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    icon={<Save aria-hidden="true" size={18} />}
                    type="submit"
                  >
                    {isSubmitting ? "Guardando…" : "Guardar borrador"}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

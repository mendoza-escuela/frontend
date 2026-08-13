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
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { inputClassName } from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminCampaignsService } from "../../services/admin-campaigns.service";
import type {
  CampaignWorkflowOption,
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
    workflowCycle: z.string().trim().max(120, "Ingresá hasta 120 caracteres."),
    sequenceOrder: z.string(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "La fecha de cierre debe ser igual o posterior al inicio.",
    path: ["endDate"],
  })
  .superRefine((values, context) => {
    const hasCycle = Boolean(values.workflowCycle);
    const hasOrder = Boolean(values.sequenceOrder);
    if (hasCycle !== hasOrder) {
      context.addIssue({
        code: "custom",
        message: "Indicá el recorrido y el orden, o dejá ambos vacíos.",
        path: hasCycle ? ["sequenceOrder"] : ["workflowCycle"],
      });
    }
    if (hasOrder) {
      const order = Number(values.sequenceOrder);
      if (!Number.isInteger(order) || order < 1 || order > 100)
        context.addIssue({
          code: "custom",
          message: "El orden debe ser un entero entre 1 y 100.",
          path: ["sequenceOrder"],
        });
    }
  });

type CampaignForm = z.infer<typeof schema>;

export function CampaignFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [versions, setVersions] = useState<PublishedSurveyVersionOption[]>([]);
  const [workflows, setWorkflows] = useState<CampaignWorkflowOption[]>([]);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
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
      workflowCycle: "",
      sequenceOrder: "",
    },
  });
  const workflowCycle = watch("workflowCycle");
  const surveyVersionId = watch("surveyVersionId");
  const campaignType = watch("type");
  const selectedWorkflow = workflows.some(
    ({ name }) => name === workflowCycle,
  )
    ? workflowCycle
    : workflowCycle || creatingWorkflow
      ? "__new__"
      : "";

  const selectWorkflow = (value: string) => {
    if (!value || value === "__new__") {
      setCreatingWorkflow(value === "__new__");
      setValue("workflowCycle", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("sequenceOrder", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    setCreatingWorkflow(false);
    const workflow = workflows.find(({ name }) => name === value);
    setValue("workflowCycle", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (workflow)
      setValue("sequenceOrder", String(workflow.lastSequenceOrder + 1), {
        shouldDirty: true,
        shouldValidate: true,
      });
  };

  useEffect(() => {
    Promise.all([
      adminCampaignsService.publishedVersions(),
      adminCampaignsService.workflowOptions(),
      id ? adminCampaignsService.findOne(id) : Promise.resolve(null),
    ])
      .then(([availableVersions, availableWorkflows, campaign]) => {
        setVersions(availableVersions);
        setWorkflows(availableWorkflows);
        if (campaign) {
          reset({
            name: campaign.name,
            description: campaign.description ?? "",
            type: campaign.type,
            surveyVersionId: campaign.surveyVersion.id,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            workflowCycle: campaign.workflowCycle ?? "",
            sequenceOrder: campaign.sequenceOrder?.toString() ?? "",
          });
        }
      })
      .catch((error) => setLoadError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [id, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const input = {
        ...values,
        workflowCycle: values.workflowCycle || null,
        sequenceOrder: values.sequenceOrder
          ? Number(values.sequenceOrder)
          : null,
      };
      const campaign = id
        ? await adminCampaignsService.update(id, input)
        : await adminCampaignsService.create(input);
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
                <div>
                  <SearchableSelect
                    allLabel="Etapa independiente"
                    label="Recorrido de etapas"
                    onChange={selectWorkflow}
                    options={[
                      ...workflows.map((workflow) => ({
                        value: workflow.name,
                        label: `${workflow.name} · último paso ${workflow.lastSequenceOrder}`,
                      })),
                      {
                        value: "__new__",
                        label: "Crear un recorrido nuevo",
                      },
                    ]}
                    selectedLabel={
                      selectedWorkflow === "__new__"
                        ? "Crear un recorrido nuevo"
                        : undefined
                    }
                    value={selectedWorkflow}
                  />
                  <p className="mt-2 text-xs leading-5 text-mendoza-muted">
                    Al elegir uno existente se sugiere automáticamente el
                    siguiente orden.
                  </p>
                </div>

                <FormField
                  error={errors.workflowCycle?.message}
                  help="Podés escribir un nombre nuevo aunque no aparezca en la lista."
                  helpPlacement="below"
                  htmlFor="workflowCycle"
                  label="Nombre del recorrido"
                >
                  <input
                    {...register("workflowCycle")}
                    className={inputClassName}
                    id="workflowCycle"
                    placeholder="Programa 2026"
                  />
                </FormField>

                <FormField
                  className="sm:col-span-2"
                  error={errors.sequenceOrder?.message}
                  help="Los colegios deben enviar las etapas anteriores que tengan asignadas."
                  helpPlacement="below"
                  htmlFor="sequenceOrder"
                  label="Orden dentro del recorrido"
                >
                  <input
                    {...register("sequenceOrder")}
                    className={inputClassName}
                    id="sequenceOrder"
                    inputMode="numeric"
                    max={100}
                    min={1}
                    placeholder="1"
                    type="number"
                  />
                </FormField>

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

                <SearchableSelect
                  allowEmpty={false}
                  error={errors.type?.message}
                  label="Periodicidad"
                  onChange={(value) =>
                    setValue("type", value as CampaignForm["type"], {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  options={[
                    { value: "annual", label: "Anual" },
                    { value: "semiannual", label: "Semestral" },
                  ]}
                  value={campaignType}
                />

                <div>
                  <SearchableSelect
                    allLabel="Seleccionar versión"
                    error={errors.surveyVersionId?.message}
                    label="Versión del cuestionario"
                    onChange={(value) =>
                      setValue("surveyVersionId", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    options={versions.map((version) => ({
                      value: version.id,
                      label: `${version.surveyName} · versión ${version.versionNumber} · ${version.versionTitle}`,
                    }))}
                    value={surveyVersionId}
                  />
                  <p className="mt-2 text-xs leading-5 text-mendoza-muted">
                    Sólo se muestran versiones publicadas de cuestionarios
                    activos.
                  </p>
                </div>

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
                  helpPlacement="below"
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

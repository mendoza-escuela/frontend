import { zodResolver } from "@hookform/resolvers/zod";
import {
  Archive,
  CheckCircle2,
  Copy,
  Pencil,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { formatDateTime } from "../../lib/format";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { evaluationConfigurationsService } from "../../services/evaluation-configurations.service";
import type {
  EvaluationConfiguration,
  EvaluationConfigurationInput,
} from "../../types/evaluation-configuration";

const rangeSchema = z.object({
  stars: z
    .number("Ingresá una cantidad de estrellas válida.")
    .int("La cantidad de estrellas debe ser un número entero.")
    .min(1, "El mínimo es 1 estrella.")
    .max(5, "El máximo es 5 estrellas."),
  lowerBound: z
    .number("Ingresá un límite inferior válido.")
    .min(0, "El límite inferior no puede ser menor a 0.")
    .max(100, "El límite inferior no puede superar 100."),
  upperBound: z
    .number("Ingresá un límite superior válido.")
    .min(0, "El límite superior no puede ser menor a 0.")
    .max(100, "El límite superior no puede superar 100."),
  lowerInclusive: z.boolean(),
  upperInclusive: z.boolean(),
  order: z
    .number("Ingresá un orden válido.")
    .int("El orden debe ser un número entero.")
    .min(1, "El orden mínimo es 1.")
    .max(5, "El orden máximo es 5."),
});
const schema = z
  .object({
    versionCode: z
      .string()
      .trim()
      .min(1, "Ingresá el código de versión.")
      .max(50, "El código de versión admite hasta 50 caracteres."),
    name: z
      .string()
      .trim()
      .min(1, "Ingresá el nombre de la configuración.")
      .max(160, "El nombre admite hasta 160 caracteres."),
    description: z
      .string()
      .max(2000, "La descripción admite hasta 2000 caracteres.")
      .optional(),
    mentalHealthCriticalThreshold: z
      .number("Ingresá un umbral válido.")
      .min(0, "El umbral no puede ser menor a 0.")
      .max(100, "El umbral no puede superar 100."),
    mentalHealthMaxStars: z
      .number("Ingresá un máximo de estrellas válido.")
      .int("El máximo de estrellas debe ser un número entero.")
      .min(1, "El mínimo permitido es 1 estrella.")
      .max(5, "El máximo permitido es 5 estrellas."),
    starRanges: z
      .array(rangeSchema)
      .length(5, "Deben definirse exactamente cinco rangos."),
  })
  .superRefine((value, context) => {
    const ranges = [...value.starRanges].sort((a, b) => a.order - b.order);
    ranges.forEach((range, index) => {
      const previous = ranges[index - 1];
      if (
        range.lowerBound > range.upperBound ||
        (previous &&
          (previous.upperBound !== range.lowerBound ||
            previous.upperInclusive === range.lowerInclusive))
      )
        context.addIssue({
          code: "custom",
          path: ["starRanges", index],
          message:
            "Los rangos deben cubrir 0–100 sin huecos ni superposiciones.",
        });
    });
  });
const defaults: EvaluationConfigurationInput = {
  versionCode: "",
  name: "",
  description: "",
  mentalHealthCriticalThreshold: 33,
  mentalHealthMaxStars: 4,
  starRanges: [1, 2, 3, 4, 5].map((stars, index) => ({
    stars,
    order: stars,
    lowerBound: index * 20,
    upperBound: stars * 20,
    lowerInclusive: stars === 1,
    upperInclusive: true,
  })),
};

export function EvaluationConfigurationsPage() {
  const [items, setItems] = useState<EvaluationConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<EvaluationConfiguration | null>(null);
  const [activate, setActivate] = useState<EvaluationConfiguration | null>(
    null,
  );
  const form = useForm<EvaluationConfigurationInput>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const { fields } = useFieldArray({
    control: form.control,
    name: "starRanges",
  });
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await evaluationConfigurationsService.list());
    } catch (reason) {
      setError(getHttpErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const edit = (configuration?: EvaluationConfiguration) => {
    setEditing(configuration ?? null);
    form.reset(
      configuration
        ? {
            versionCode: configuration.versionCode,
            name: configuration.name,
            description: configuration.description ?? "",
            mentalHealthCriticalThreshold: Number(
              configuration.mentalHealthCriticalThreshold,
            ),
            mentalHealthMaxStars: configuration.mentalHealthMaxStars,
            starRanges: configuration.starRanges.map((range) => ({
              ...range,
              lowerBound: Number(range.lowerBound),
              upperBound: Number(range.upperBound),
            })),
          }
        : defaults,
    );
  };
  const submit = form.handleSubmit(async (value) => {
    try {
      if (editing)
        await evaluationConfigurationsService.update(editing.id, value);
      else await evaluationConfigurationsService.create(value);
      showSuccess(
        editing ? "Borrador actualizado." : "Configuración creada en borrador.",
      );
      edit();
      await load();
    } catch (reason) {
      showError(getHttpErrorMessage(reason));
    }
  });
  const action = async (run: () => Promise<unknown>, message: string) => {
    try {
      await run();
      showSuccess(message);
      await load();
    } catch (reason) {
      showError(getHttpErrorMessage(reason));
    }
  };
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Motor de evaluación"
          title="Configuraciones de evaluación"
          description="Versiones inmutables de rangos, umbrales y límites de certificación."
        />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section aria-label="Historial de configuraciones">
            {loading ? (
              <LoadingState label="Cargando configuraciones…" />
            ) : error ? (
              <ErrorState message={error} onRetry={() => void load()} />
            ) : !items.length ? (
              <EmptyState
                icon={Settings2}
                title="No hay configuraciones"
                description="Creá la primera versión del algoritmo."
              />
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card as="article" key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-mendoza-text">
                            {item.versionCode} · {item.name}
                          </h2>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "active" ? "bg-green-50 text-mendoza-success" : item.status === "draft" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-mendoza-muted">
                          Creada {formatDateTime(item.createdAt)} por{" "}
                          {person(item.createdBy)}
                        </p>
                        {item.activatedAt && (
                          <p className="text-sm text-mendoza-muted">
                            Activada {formatDateTime(item.activatedAt)} por{" "}
                            {person(item.activatedBy)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.status === "draft" && (
                          <>
                            <Button
                              icon={<Pencil size={16} />}
                              variant="outline"
                              onClick={() => edit(item)}
                            >
                              Editar
                            </Button>
                            <Button
                              icon={<CheckCircle2 size={16} />}
                              onClick={() => setActivate(item)}
                            >
                              Activar
                            </Button>
                            <Button
                              icon={<ShieldCheck size={16} />}
                              variant="outline"
                              onClick={() =>
                                void action(
                                  () =>
                                    evaluationConfigurationsService.validate(
                                      item.id,
                                    ),
                                  "La configuración es válida.",
                                )
                              }
                            >
                              Validar
                            </Button>
                            <Button
                              icon={<Archive size={16} />}
                              variant="outline"
                              onClick={() =>
                                void action(
                                  () =>
                                    evaluationConfigurationsService.archive(
                                      item.id,
                                    ),
                                  "Configuración archivada.",
                                )
                              }
                            >
                              Archivar
                            </Button>
                          </>
                        )}
                        <Button
                          icon={<Copy size={16} />}
                          variant="outline"
                          onClick={() =>
                            void action(
                              () =>
                                evaluationConfigurationsService.clone(
                                  item.id,
                                  `${item.versionCode}-copia-${Date.now()}`,
                                ),
                              "Nueva versión creada en borrador.",
                            )
                          }
                        >
                          Clonar
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {[...item.starRanges]
                        .sort((a, b) => a.order - b.order)
                        .map((range) => (
                          <div
                            className="rounded-lg bg-mendoza-background p-2 text-center text-xs"
                            key={range.stars}
                          >
                            <strong className="block text-mendoza-blue">
                              {range.stars} ★
                            </strong>
                            {range.lowerInclusive ? "[" : "("}
                            {Number(range.lowerBound)}–
                            {Number(range.upperBound)}
                            {range.upperInclusive ? "]" : ")"}
                          </div>
                        ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
          <Card as="section">
            <h2 className="text-xl font-bold text-mendoza-text">
              {editing
                ? `Editar ${editing.versionCode}`
                : "Nueva configuración"}
            </h2>
            {editing?.status !== "draft" && editing ? (
              <p className="mt-2 text-sm text-mendoza-error">
                Las versiones activas o archivadas son inmutables.
              </p>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={submit}>
                <Field
                  label="Código de versión"
                  error={form.formState.errors.versionCode?.message}
                >
                  <input className="field" {...form.register("versionCode")} />
                </Field>
                <Field
                  label="Nombre"
                  error={form.formState.errors.name?.message}
                >
                  <input className="field" {...form.register("name")} />
                </Field>
                <Field label="Descripción">
                  <textarea
                    className="field"
                    rows={2}
                    {...form.register("description")}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Umbral Salud Mental">
                    <input
                      className="field"
                      type="number"
                      step="0.0001"
                      {...form.register("mentalHealthCriticalThreshold", {
                        valueAsNumber: true,
                      })}
                    />
                  </Field>
                  <Field label="Máximo con criticidad">
                    <input
                      className="field"
                      type="number"
                      {...form.register("mentalHealthMaxStars", {
                        valueAsNumber: true,
                      })}
                    />
                  </Field>
                </div>
                <fieldset>
                  <legend className="font-semibold text-mendoza-text">
                    Rangos de estrellas
                  </legend>
                  <div className="mt-2 space-y-2">
                    {fields.map((field, index) => (
                      <div
                        className="grid grid-cols-[3rem_1fr_1fr] items-center gap-2 lg:grid-cols-[3rem_1fr_1fr_auto_auto]"
                        key={field.id}
                      >
                        <span className="font-bold text-mendoza-gold">
                          {index + 1} ★
                        </span>
                        <input
                          aria-label={`Límite inferior ${index + 1} estrellas`}
                          className="field"
                          type="number"
                          step="0.0001"
                          {...form.register(`starRanges.${index}.lowerBound`, {
                            valueAsNumber: true,
                          })}
                        />
                        <input
                          aria-label={`Límite superior ${index + 1} estrellas`}
                          className="field"
                          type="number"
                          step="0.0001"
                          {...form.register(`starRanges.${index}.upperBound`, {
                            valueAsNumber: true,
                          })}
                        />
                        <label className="flex items-center gap-1 text-xs text-mendoza-muted">
                          <input
                            type="checkbox"
                            {...form.register(
                              `starRanges.${index}.lowerInclusive`,
                            )}
                          />
                          Incluye mínimo
                        </label>
                        <label className="flex items-center gap-1 text-xs text-mendoza-muted">
                          <input
                            type="checkbox"
                            {...form.register(
                              `starRanges.${index}.upperInclusive`,
                            )}
                          />
                          Incluye máximo
                        </label>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.starRanges && (
                    <p className="mt-1 text-sm text-mendoza-error">
                      Revisá la cobertura y los límites de los rangos.
                    </p>
                  )}
                </fieldset>
                <div className="flex gap-2">
                  <Button disabled={form.formState.isSubmitting} type="submit">
                    {form.formState.isSubmitting
                      ? "Guardando…"
                      : "Guardar borrador"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => edit()}
                  >
                    Limpiar
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={!!activate}
        title="Activar configuración"
        description="La configuración activa actual será archivada. La nueva versión quedará inmutable y se usará en los próximos envíos."
        confirmLabel="Activar versión"
        onCancel={() => setActivate(null)}
        onConfirm={() => {
          if (activate)
            void action(
              () => evaluationConfigurationsService.activate(activate.id),
              "Configuración activada.",
            );
          setActivate(null);
        }}
      />
    </main>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-mendoza-text">
      {label}
      {children}
      {error && <span className="text-mendoza-error">{error}</span>}
    </label>
  );
}
const statusLabel = (status: string) =>
  status === "active"
    ? "Activa"
    : status === "draft"
      ? "Borrador"
      : "Archivada";
const person = (user: { firstName: string; lastName: string } | null) =>
  user ? `${user.firstName} ${user.lastName}` : "Sistema";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  Copy,
  FileText,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField as Field } from "../../components/ui/FormField";
import { LoadingState } from "../../components/ui/LoadingState";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { checkboxClassName, inputClassName } from "../../components/ui/form-styles";
import { formatDateTime } from "../../lib/format";
import { getHttpErrorDetails, getHttpErrorMessage } from "../../lib/http-error";
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
    .int("El límite inferior debe ser un número entero.")
    .min(0, "El límite inferior no puede ser menor a 0.")
    .max(100, "El límite inferior no puede superar 100."),
  upperBound: z
    .number("Ingresá un límite superior válido.")
    .int("El límite superior debe ser un número entero.")
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
      .int("El umbral debe ser un número entero.")
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
  const [showOnlyCurrent, setShowOnlyCurrent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<EvaluationConfiguration | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [discardChanges, setDiscardChanges] = useState(false);
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
  const isEditorDirty = form.formState.isDirty;
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
  const openEditor = (configuration?: EvaluationConfiguration) => {
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
    setEditorOpen(true);
  };
  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    form.reset(defaults);
  };
  const requestCloseEditor = () => {
    if (isEditorDirty) {
      setDiscardChanges(true);
      return;
    }
    closeEditor();
  };
  const submit = form.handleSubmit(async (value) => {
    try {
      if (editing)
        await evaluationConfigurationsService.update(editing.id, value);
      else await evaluationConfigurationsService.create(value);
      showSuccess(
        editing ? "Borrador actualizado." : "Configuración creada en borrador.",
      );
      closeEditor();
      await load();
    } catch (reason) {
      const details = getHttpErrorDetails(reason);
      if (
        details?.code === "EVALUATION_VERSION_CODE_CONFLICT" &&
        details.field === "versionCode"
      ) {
        form.setError("versionCode", {
          type: "server",
          message: details.message,
        });
        form.setFocus("versionCode");
        showError(details.message);
        return;
      }
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
  const cloneAndEdit = async (configuration: EvaluationConfiguration) => {
    try {
      const clone = await evaluationConfigurationsService.clone(
        configuration.id,
        `${configuration.versionCode}-copia-${Date.now()}`,
      );
      showSuccess("Nueva versión creada en borrador.");
      await load();
      openEditor(clone);
    } catch (reason) {
      showError(getHttpErrorMessage(reason));
    }
  };
  const visibleItems = showOnlyCurrent
    ? items.filter(({ status }) => status !== "archived")
    : items;
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Motor de evaluación"
          title="Configuraciones de evaluación"
          description="Versiones inmutables de rangos, umbrales y límites de certificación."
          actions={
            <Button
              icon={<Plus aria-hidden="true" size={18} />}
              onClick={() => openEditor()}
            >
              Nueva configuración
            </Button>
          }
        />
        <ConfigurationOverview items={items} loading={loading} />
        <div className="mt-6">
          <section aria-label="Historial de configuraciones">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-mendoza-blue">Historial versionado</p><h2 className="mt-1 text-2xl font-bold text-mendoza-text">Versiones configuradas</h2><p className="mt-1 text-sm text-mendoza-muted">Consultá, validá o cloná las reglas sin alterar versiones ya utilizadas.</p></div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-mendoza-border bg-white px-3 py-2 shadow-sm">
                  <span className="text-right">
                    <span className="block text-sm font-semibold text-mendoza-text">
                      Solo activas y borradores
                    </span>
                    <span className="block text-xs text-mendoza-muted">
                      {showOnlyCurrent
                        ? "Las archivadas están ocultas"
                        : "Las archivadas están visibles"}
                    </span>
                  </span>
                  <button
                    aria-checked={showOnlyCurrent}
                    aria-label="Mostrar solo configuraciones activas y borradores"
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue ${showOnlyCurrent ? "bg-mendoza-blue" : "bg-slate-300"}`}
                    onClick={() => setShowOnlyCurrent((current) => !current)}
                    role="switch"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${showOnlyCurrent ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <span className="rounded-full border border-mendoza-border bg-white px-3 py-1.5 text-xs font-bold text-mendoza-muted">
                  {visibleItems.length}
                  {showOnlyCurrent && visibleItems.length !== items.length
                    ? ` de ${items.length}`
                    : ""}{" "}
                  {items.length === 1 ? "versión" : "versiones"}
                </span>
              </div>
            </div>
            {loading ? (
              <LoadingState label="Cargando configuraciones…" />
            ) : error ? (
              <ErrorState message={error} onRetry={() => void load()} />
            ) : !items.length ? (
              <EmptyState
                icon={Settings2}
                title="No hay configuraciones"
                description="Creá la primera versión del algoritmo."
                action={
                  <Button
                    icon={<Plus aria-hidden="true" size={18} />}
                    onClick={() => openEditor()}
                  >
                    Crear configuración
                  </Button>
                }
              />
            ) : !visibleItems.length ? (
              <EmptyState
                icon={Settings2}
                title="No hay versiones activas ni borradores"
                description="Desactivá el filtro para consultar las configuraciones archivadas."
              />
            ) : (
              <div className="space-y-4">
                {visibleItems.map((item) => (
                  <Card as="article" className={`overflow-hidden border-l-4 transition-shadow hover:shadow-md ${item.status === "active" ? "border-l-mendoza-success" : item.status === "draft" ? "border-l-mendoza-gold" : "border-l-slate-300"}`} key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
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
                      <div className="flex w-full flex-wrap gap-2 border-t border-mendoza-border pt-4 sm:w-auto sm:border-0 sm:pt-0">
                        {item.status === "draft" && (
                          <>
                            <Button
                              icon={<Pencil size={16} />}
                              variant="outline"
                              onClick={() => openEditor(item)}
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
                          onClick={() => void cloneAndEdit(item)}
                        >
                          Clonar
                        </Button>
                      </div>
                    </div>
                    {item.description && <p className="mt-4 rounded-xl bg-mendoza-background px-4 py-3 text-sm leading-6 text-mendoza-muted">{item.description}</p>}
                    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl border border-mendoza-border px-3 py-2.5"><AlertTriangle aria-hidden="true" className="shrink-0 text-mendoza-gold" size={18} /><div><dt className="text-xs font-semibold text-mendoza-muted">Umbral de Salud Mental</dt><dd className="font-bold text-mendoza-text">Menor a {Number(item.mentalHealthCriticalThreshold)} puntos</dd></div></div>
                      <div className="flex items-center gap-3 rounded-xl border border-mendoza-border px-3 py-2.5"><ShieldCheck aria-hidden="true" className="shrink-0 text-mendoza-blue" size={18} /><div><dt className="text-xs font-semibold text-mendoza-muted">Tope con criticidad</dt><dd className="font-bold text-mendoza-text">{item.mentalHealthMaxStars} estrellas</dd></div></div>
                    </dl>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={`Rangos de estrellas de ${item.versionCode}`}>
                      {[...item.starRanges]
                        .sort((a, b) => a.order - b.order)
                        .map((range) => (
                          <div
                            className="rounded-xl border border-mendoza-border bg-gradient-to-b from-white to-mendoza-background p-2.5 text-center text-xs"
                            key={range.stars}
                          >
                            <strong className="mb-1 block text-sm text-mendoza-gold">
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
        </div>
        <Modal
          description="Definí una versión auditable. Se podrá modificar únicamente mientras sea borrador."
          onClose={requestCloseEditor}
          open={editorOpen}
          size="lg"
          title={editing ? `Editar ${editing.versionCode}` : "Nueva configuración"}
        >
          {editing?.status !== "draft" && editing ? (
            <p className="text-sm text-mendoza-error">
              Las versiones activas o archivadas son inmutables.
            </p>
          ) : (
            <form className="space-y-6" onSubmit={submit}>
                <section aria-labelledby="configuration-identity-title" className="space-y-4 rounded-2xl bg-mendoza-background/70 p-4">
                  <div className="flex items-center gap-2"><FileText aria-hidden="true" className="text-mendoza-blue" size={19} /><h3 className="font-bold text-mendoza-text" id="configuration-identity-title">Identificación de la versión</h3></div>
                <Field
                  className="grid gap-1.5"
                  controlClassName=""
                  label="Código de versión"
                  error={form.formState.errors.versionCode?.message}
                >
                  <input className={inputClassName} placeholder="Ej.: v2.1.0" {...form.register("versionCode")} />
                </Field>
                <Field
                  className="grid gap-1.5"
                  controlClassName=""
                  label="Nombre"
                  error={form.formState.errors.name?.message}
                >
                  <input className={inputClassName} placeholder="Nombre descriptivo de la configuración" {...form.register("name")} />
                </Field>
                <Field
                  className="grid gap-1.5"
                  controlClassName=""
                  error={form.formState.errors.description?.message}
                  help="Opcional · hasta 2000 caracteres"
                  helpPlacement="below"
                  hideHelpWhenError
                  label="Descripción"
                >
                  <textarea
                    className={inputClassName}
                    placeholder="Explicá brevemente qué cambia en esta versión…"
                    rows={3}
                    {...form.register("description")}
                  />
                </Field>
                </section>
                <section aria-labelledby="critical-rule-title" className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="mb-1 flex items-center gap-2"><AlertTriangle aria-hidden="true" className="text-amber-700" size={19} /><h3 className="font-bold text-mendoza-text" id="critical-rule-title">Regla de criticidad</h3></div>
                  <p className="mb-4 text-sm leading-5 text-mendoza-muted">Si Salud Mental queda por debajo del umbral, las estrellas finales no podrán superar el máximo definido.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    className="grid gap-1.5"
                    controlClassName=""
                    error={form.formState.errors.mentalHealthCriticalThreshold?.message}
                    help="Puntaje entero de 0 a 100"
                    helpPlacement="below"
                    hideHelpWhenError
                    label="Umbral Salud Mental"
                  >
                    <input
                      className={inputClassName}
                      inputMode="numeric"
                      max="100"
                      min="0"
                      onKeyDown={preventNonIntegerKey}
                      onPaste={preventNonIntegerPaste}
                      type="number"
                      step="1"
                      {...form.register("mentalHealthCriticalThreshold", {
                        valueAsNumber: true,
                      })}
                    />
                  </Field>
                  <StarRatingField
                    control={form.control}
                    error={form.formState.errors.mentalHealthMaxStars?.message}
                  />
                </div>
                </section>
                <fieldset className="rounded-2xl border border-mendoza-border p-4">
                  <legend className="px-2 font-bold text-mendoza-text">
                    Rangos de estrellas
                  </legend>
                  <p className="mb-4 text-sm leading-5 text-mendoza-muted">Definí la cobertura completa de 0 a 100 y qué extremo pertenece a cada rango.</p>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        className="rounded-xl border border-mendoza-border bg-mendoza-background/50 p-3"
                        key={field.id}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3"><span className="font-bold text-mendoza-gold">{index + 1} ★</span><span className="text-xs font-semibold text-mendoza-muted">Rango {index + 1} de 5</span></div>
                        <div className="grid grid-cols-2 gap-3">
                        <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-mendoza-muted">Desde
                          <input
                            aria-label={`Límite inferior ${index + 1} estrellas`}
                            className={inputClassName}
                            inputMode="numeric"
                            max="100"
                            min="0"
                            onKeyDown={preventNonIntegerKey}
                            onPaste={preventNonIntegerPaste}
                            type="number"
                            step="1"
                            {...form.register(`starRanges.${index}.lowerBound`, {
                              valueAsNumber: true,
                            })}
                          />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-mendoza-muted">Hasta
                          <input
                            aria-label={`Límite superior ${index + 1} estrellas`}
                            className={inputClassName}
                            inputMode="numeric"
                            max="100"
                            min="0"
                            onKeyDown={preventNonIntegerKey}
                            onPaste={preventNonIntegerPaste}
                            type="number"
                            step="1"
                            {...form.register(`starRanges.${index}.upperBound`, {
                              valueAsNumber: true,
                            })}
                          />
                        </label>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-mendoza-border bg-white px-3 text-xs text-mendoza-muted transition hover:border-mendoza-sky">
                          <input
                            className={checkboxClassName}
                            type="checkbox"
                            {...form.register(
                              `starRanges.${index}.lowerInclusive`,
                            )}
                          />
                          Incluye mínimo
                        </label>
                        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-mendoza-border bg-white px-3 text-xs text-mendoza-muted transition hover:border-mendoza-sky">
                          <input
                            className={checkboxClassName}
                            type="checkbox"
                            {...form.register(
                              `starRanges.${index}.upperInclusive`,
                            )}
                          />
                          Incluye máximo
                        </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.starRanges && (
                    <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-mendoza-error" role="alert">
                      Revisá la cobertura y los límites de los rangos.
                    </p>
                  )}
                </fieldset>
                <div className="flex flex-col-reverse gap-2 border-t border-mendoza-border pt-5 sm:flex-row sm:justify-end">
                  <Button className="sm:min-w-44" disabled={form.formState.isSubmitting} type="submit">
                    {form.formState.isSubmitting
                      ? "Guardando…"
                      : "Guardar borrador"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestCloseEditor}
                  >
                    Cancelar
                  </Button>
                </div>
            </form>
          )}
        </Modal>
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
      <ConfirmDialog
        destructive
        open={discardChanges}
        title="Descartar cambios"
        description="Hay cambios sin guardar en la configuración. Si cerrás el editor, se perderán."
        confirmLabel="Descartar"
        onCancel={() => setDiscardChanges(false)}
        onConfirm={() => {
          setDiscardChanges(false);
          closeEditor();
        }}
      />
    </main>
  );
}

function ConfigurationOverview({ items, loading }: { items: EvaluationConfiguration[]; loading: boolean }) {
  const active = items.find(({ status }) => status === "active");
  const summaries = [
    { label: "Versión activa", value: active?.versionCode ?? (loading ? "…" : "Sin activar"), detail: active ? active.name : "Todavía no hay una regla vigente", icon: CheckCircle2, tone: "text-mendoza-success bg-green-50" },
    { label: "Borradores", value: loading ? "…" : String(items.filter(({ status }) => status === "draft").length), detail: "Versiones que todavía pueden editarse", icon: Pencil, tone: "text-amber-700 bg-amber-50" },
    { label: "Versiones archivadas", value: loading ? "…" : String(items.filter(({ status }) => status === "archived").length), detail: "Histórico inmutable disponible", icon: Archive, tone: "text-slate-600 bg-slate-100" },
    { label: "Última activación", value: active?.activatedAt ? formatDateTime(active.activatedAt) : (loading ? "…" : "No disponible"), detail: active ? `Responsable: ${person(active.activatedBy)}` : "Se mostrará al activar una versión", icon: CalendarDays, tone: "text-mendoza-blue bg-mendoza-blue/5" },
  ];
  return <section aria-label="Resumen de configuraciones" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summaries.map(({ label, value, detail, icon: Icon, tone }) => <Card as="article" className="relative overflow-hidden" key={label}><div className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon aria-hidden="true" size={20} /></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-mendoza-muted">{label}</p><p className="mt-1 truncate text-xl font-bold text-mendoza-text" title={value}>{value}</p><p className="mt-1 text-xs leading-5 text-mendoza-muted">{detail}</p></Card>)}</section>;
}

function StarRatingField({
  control,
  error,
}: {
  control: Control<EvaluationConfigurationInput>;
  error?: string;
}) {
  const errorId = "mental-health-max-stars-error";
  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)}>
      <legend className="text-sm font-semibold text-mendoza-text">
        Máximo con criticidad
      </legend>
      <Controller
        control={control}
        name="mentalHealthMaxStars"
        render={({ field }) => (
          <div className="mt-1.5 rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1" role="radiogroup">
              {[1, 2, 3, 4, 5].map((stars) => {
                const selected = stars <= field.value;
                return (
                  <label
                    className="group relative cursor-pointer rounded-lg p-1.5 transition hover:scale-110 focus-within:ring-4 focus-within:ring-mendoza-gold/25 motion-reduce:hover:scale-100"
                    key={stars}
                    title={`${stars} ${stars === 1 ? "estrella" : "estrellas"}`}
                  >
                    <input
                      checked={field.value === stars}
                      className="sr-only"
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={() => field.onChange(stars)}
                      ref={field.ref}
                      type="radio"
                      value={stars}
                    />
                    <Star
                      aria-hidden="true"
                      className={`size-8 transition-colors ${selected ? "text-mendoza-gold" : "text-slate-300 group-hover:text-mendoza-gold/60"}`}
                      fill={selected ? "currentColor" : "none"}
                      strokeWidth={1.8}
                    />
                    <span className="sr-only">
                      {stars} {stars === 1 ? "estrella" : "estrellas"}
                    </span>
                  </label>
                );
              })}
            </div>
            <p aria-live="polite" className="mt-1 text-xs font-semibold text-mendoza-muted">
              {field.value} de 5 estrellas
            </p>
          </div>
        )}
      />
      {error && (
        <p className="mt-2 text-sm font-normal text-mendoza-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const invalidIntegerKeys = new Set(["-", "+", ".", ",", "e", "E"]);

function preventNonIntegerKey(event: KeyboardEvent<HTMLInputElement>) {
  if (invalidIntegerKeys.has(event.key)) event.preventDefault();
}

function preventNonIntegerPaste(event: ClipboardEvent<HTMLInputElement>) {
  if (!/^\d+$/.test(event.clipboardData.getData("text").trim()))
    event.preventDefault();
}

const statusLabel = (status: string) =>
  status === "active"
    ? "Activa"
    : status === "draft"
      ? "Borrador"
      : "Archivada";
const person = (user: { firstName: string; lastName: string } | null) =>
  user ? `${user.firstName} ${user.lastName}` : "Sistema";

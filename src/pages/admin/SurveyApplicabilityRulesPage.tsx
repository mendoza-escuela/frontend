import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Eye,
  GitBranch,
  ListChecks,
  PlayCircle,
  Save,
  SquareCheckBig,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { QuestionCombobox } from "../../components/surveys/QuestionCombobox";
import { SchoolCombobox } from "../../components/users/SchoolCombobox";
import { inputClassName } from "../../components/ui/form-styles";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { SearchableMultiSelect } from "../../components/ui/SearchableMultiSelect";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type {
  ApplicabilityDecision,
  AdminSurveyVersion,
  ApplicabilityMetadata,
  ApplicabilityRule,
} from "../../types/admin-survey";
import type { SchoolOption } from "../../types/admin-user";

const schema = z.object({
  groupOperator: z.enum(["all", "any"]),
  action: z.enum(["show", "omit"]),
  defaultAction: z.enum(["show", "omit"]),
  conditions: z
    .array(
      z.object({
        feature: z.string().min(1, "Seleccioná una característica."),
        operator: z.string().min(1, "Seleccioná un operador."),
        expectedValue: z.string().min(1, "Ingresá o seleccioná un valor."),
      }),
    )
    .min(1, "Agregá al menos una condición."),
});
type FormValues = z.infer<typeof schema>;

export function SurveyApplicabilityRulesPage() {
  const { surveyId, versionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [version, setVersion] = useState<AdminSurveyVersion | null>(null);
  const [metadata, setMetadata] = useState<ApplicabilityMetadata | null>(null);
  const [rules, setRules] = useState<ApplicabilityRule[]>([]);
  const [questionId, setQuestionId] = useState("");
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">(
    "single",
  );
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [previewSchool, setPreviewSchool] = useState<SchoolOption | null>(null);
  const [preview, setPreview] = useState<ApplicabilityDecision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const resetQuestionKey = useRef("");
  const requestedQuestionId = searchParams.get("questionId");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      groupOperator: "all",
      action: "omit",
      defaultAction: "show",
      conditions: [
        { feature: "has_kiosk", operator: "equals", expectedValue: "true" },
      ],
    },
  });
  const conditionFields = useFieldArray({
    control: form.control,
    name: "conditions",
  });
  const conditions = form.watch("conditions");

  const ruleCountByQuestion = useMemo(() => {
    const counts = new Map<string, number>();
    rules.forEach((rule) =>
      counts.set(rule.questionId, (counts.get(rule.questionId) ?? 0) + 1),
    );
    return counts;
  }, [rules]);
  const questions = useMemo(
    () =>
      version?.dimensions.flatMap((dimension) =>
        dimension.sections.flatMap((section) =>
          section.questions.map((question) => ({
            value: question.id,
            code: question.code,
            prompt: question.prompt,
            groupLabel: dimension.title,
            ruleCount: ruleCountByQuestion.get(question.id) ?? 0,
          })),
        ),
      ) ?? [],
    [ruleCountByQuestion, version],
  );
  const selectedRules = useMemo(
    () =>
      rules
        .filter((rule) => rule.questionId === questionId)
        .sort((left, right) => left.order - right.order),
    [questionId, rules],
  );
  const readonly = version?.status !== "draft";
  const selectedQuestionIndex = questions.findIndex(
    ({ value }) => value === questionId,
  );
  const selectedQuestion = questions[selectedQuestionIndex] ?? null;

  const load = useCallback(async () => {
    if (!surveyId || !versionId) return;
    setIsLoading(true);
    setError("");
    try {
      const [loadedVersion, loadedMetadata, loadedRules] = await Promise.all([
        adminSurveysService.findVersion(surveyId, versionId),
        adminSurveysService.applicabilityMetadata(),
        adminSurveysService.listApplicabilityRules(surveyId, versionId),
      ]);
      setVersion(loadedVersion);
      setMetadata(loadedMetadata);
      setRules(loadedRules);
    } catch (loadError) {
      setError(getHttpErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, versionId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (isLoading || !version) return;
    const requestedExists = questions.some(
      ({ value }) => value === requestedQuestionId,
    );
    const nextQuestionId =
      requestedExists && requestedQuestionId
        ? requestedQuestionId
        : (questions[0]?.value ?? "");

    setQuestionId(nextQuestionId);
    setSelectedQuestionIds((current) =>
      current.length ? current : nextQuestionId ? [nextQuestionId] : [],
    );
    if (nextQuestionId && requestedQuestionId !== nextQuestionId)
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("questionId", nextQuestionId);
          return next;
        },
        { replace: true },
      );
  }, [isLoading, questions, requestedQuestionId, setSearchParams, version]);

  useEffect(() => {
    if (isLoading || !questionId) return;
    const nextResetKey = `${versionId ?? ""}:${questionId}`;
    if (resetQuestionKey.current === nextResetKey) return;
    resetQuestionKey.current = nextResetKey;
    const nextRules = rules
      .filter((rule) => rule.questionId === questionId)
      .sort((left, right) => left.order - right.order);
    setEditingRuleId(null);
    setPreview(null);
    form.reset({
      groupOperator: "all",
      action: "omit",
      defaultAction: nextRules[0]?.defaultAction ?? "show",
      conditions: [
        { feature: "has_kiosk", operator: "equals", expectedValue: "true" },
      ],
    });
  }, [form, isLoading, questionId, rules, versionId]);

  const resetNew = () => {
    setEditingRuleId(null);
    form.reset({
      groupOperator: "all",
      action: "omit",
      defaultAction: selectedRules[0]?.defaultAction ?? "show",
      conditions: [
        { feature: "has_kiosk", operator: "equals", expectedValue: "true" },
      ],
    });
  };

  const selectQuestion = (nextQuestionId: string) => {
    if (!nextQuestionId || nextQuestionId === questionId) return;
    setQuestionId(nextQuestionId);
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("questionId", nextQuestionId);
        return next;
      },
      { replace: true },
    );
  };

  const changeSelectionMode = (mode: "single" | "multiple") => {
    setSelectionMode(mode);
    const primaryQuestionId = questionId || questions[0]?.value || "";
    setSelectedQuestionIds(primaryQuestionId ? [primaryQuestionId] : []);
    if (mode === "single" || editingRuleId) resetNew();
  };

  const edit = (rule: ApplicabilityRule) => {
    setEditingRuleId(rule.id);
    form.reset({
      groupOperator: rule.groupOperator,
      action: rule.action,
      defaultAction: rule.defaultAction,
      conditions: rule.conditions.map((condition) => ({
        feature: condition.feature,
        operator: condition.operator,
        expectedValue: Array.isArray(condition.expectedValue)
          ? condition.expectedValue.join(", ")
          : String(condition.expectedValue),
      })),
    });
  };

  const save = form.handleSubmit(async (values) => {
    if (!surveyId || !versionId || !questionId || !metadata) return;
    const input = {
      groupOperator: values.groupOperator,
      action: values.action,
      defaultAction: values.defaultAction,
      order: editingRuleId
        ? (selectedRules.find((rule) => rule.id === editingRuleId)?.order ?? 0)
        : selectedRules.length,
      conditions: values.conditions.map((condition, order) => {
        const feature = metadata.features.find(
          ({ key }) => key === condition.feature,
        );
        const raw = condition.expectedValue.trim();
        return {
          feature: condition.feature,
          operator: condition.operator,
          expectedValue:
            feature?.type === "boolean"
              ? raw === "true"
              : feature?.type === "number"
                ? Number(raw)
                : condition.operator === "in" ||
                    condition.operator === "contains_any" ||
                    condition.operator === "contains_all"
                  ? raw
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                  : raw,
          order,
        };
      }),
    };
    try {
      if (editingRuleId)
        await adminSurveysService.updateApplicabilityRule(
          surveyId,
          versionId,
          questionId,
          editingRuleId,
          input,
        );
      else
        if (selectionMode === "multiple") {
          if (selectedQuestionIds.length < 2) {
            showError("Seleccioná al menos dos preguntas para aplicar la regla.");
            return;
          }
          await adminSurveysService.createApplicabilityRuleBulk(
            surveyId,
            versionId,
            selectedQuestionIds,
            input,
          );
        } else
          await adminSurveysService.createApplicabilityRule(
            surveyId,
            versionId,
            questionId,
            input,
          );
      showSuccess(
        editingRuleId
          ? "Regla actualizada."
          : selectionMode === "multiple"
            ? `Regla aplicada a ${selectedQuestionIds.length} preguntas.`
            : "Regla creada.",
      );
      resetNew();
      setRules(
        await adminSurveysService.listApplicabilityRules(surveyId, versionId),
      );
    } catch (saveError) {
      showError(getHttpErrorMessage(saveError));
    }
  });

  const remove = async (rule: ApplicabilityRule) => {
    if (!surveyId || !versionId) return;
    try {
      await adminSurveysService.removeApplicabilityRule(
        surveyId,
        versionId,
        rule.questionId,
        rule.id,
      );
      setRules((current) => current.filter(({ id }) => id !== rule.id));
      resetNew();
      showSuccess("Regla eliminada.");
    } catch (removeError) {
      showError(getHttpErrorMessage(removeError));
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!surveyId || !versionId) return;
    const target = index + direction;
    if (target < 0 || target >= selectedRules.length) return;
    const ordered = [...selectedRules];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    try {
      const updated = await adminSurveysService.reorderApplicabilityRules(
        surveyId,
        versionId,
        questionId,
        ordered.map(({ id }) => id),
      );
      setRules((current) => [
        ...current.filter((rule) => rule.questionId !== questionId),
        ...updated,
      ]);
    } catch (moveError) {
      showError(getHttpErrorMessage(moveError));
    }
  };

  const runPreview = async () => {
    if (!surveyId || !versionId || !questionId || !previewSchool) return;
    try {
      const decision = await adminSurveysService.previewApplicability(
        surveyId,
        versionId,
        questionId,
        previewSchool.id,
      );
      setPreview(decision);
    } catch (previewError) {
      showError(getHttpErrorMessage(previewError));
    }
  };

  if (isLoading)
    return <LoadingState label="Cargando reglas de aplicabilidad…" />;
  if (error || !version || !metadata)
    return <ErrorState message={error || "Versión no encontrada."} />;

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          backLabel="Volver al cuestionario"
          backTo={`/admin/cuestionarios/${surveyId}`}
          description="Definí cuándo una pregunta debe mostrarse u omitirse según las características de cada colegio."
          eyebrow={`Versión ${version.versionNumber} · ${version.status}`}
          title="Reglas de aplicabilidad"
        />
        {readonly && (
          <Card className="mt-6 border-mendoza-gold bg-amber-50">
            <p className="font-semibold text-mendoza-text">
              Esta versión es de solo lectura. Para modificar reglas, clonala y
              trabajá sobre el nuevo borrador.
            </p>
          </Card>
        )}

        <section
          aria-label="Cómo configurar reglas"
          className="mt-6 rounded-2xl border border-mendoza-sky/40 bg-mendoza-blue-soft/50 p-5"
        >
          <div className="flex items-start gap-3">
            <GitBranch
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-mendoza-blue"
              size={22}
            />
            <div>
              <h2 className="font-bold text-mendoza-blue">
                Configurá la pregunta en cuatro pasos
              </h2>
              <p className="mt-1 text-sm leading-6 text-mendoza-muted">
                Elegí una pregunta, agregá sus reglas en orden de prioridad y
                probá el resultado con un colegio antes de terminar.
              </p>
            </div>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "1",
                "Elegir pregunta",
                "Seleccioná qué pregunta querés controlar.",
              ],
              [
                "2",
                "Revisar prioridad",
                "La primera regla que coincide define el resultado.",
              ],
              ["3", "Definir regla", "Indicá cuándo se muestra u omite."],
              [
                "4",
                "Probar",
                "Comprobá el comportamiento con un colegio real.",
              ],
            ].map(([number, title, description]) => (
              <li className="rounded-xl bg-white p-3 shadow-sm" key={number}>
                <span className="grid size-7 place-items-center rounded-full bg-mendoza-blue text-xs font-bold text-white">
                  {number}
                </span>
                <strong className="mt-2 block text-sm text-mendoza-text">
                  {title}
                </strong>
                <span className="mt-1 block text-xs leading-5 text-mendoza-muted">
                  {description}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <Card className="mt-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-mendoza-blue text-sm font-bold text-white">
              1
            </span>
            <div>
              <h2 className="font-bold text-mendoza-text">
                Elegí las preguntas
              </h2>
              <p className="text-sm text-mendoza-muted">
                Trabajá sobre una pregunta o aplicá una nueva regla a varias.
              </p>
            </div>
          </div>
          {!readonly && !editingRuleId && (
            <div
              aria-label="Modo de selección"
              className="mb-4 grid gap-2 rounded-xl bg-mendoza-background p-1.5 sm:inline-grid sm:grid-cols-2"
              role="group"
            >
              <button
                aria-pressed={selectionMode === "single"}
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${selectionMode === "single" ? "bg-white text-mendoza-blue shadow-sm" : "text-mendoza-muted hover:bg-white/60"}`}
                onClick={() => changeSelectionMode("single")}
                type="button"
              >
                Una pregunta
              </button>
              <button
                aria-pressed={selectionMode === "multiple"}
                className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${selectionMode === "multiple" ? "bg-white text-mendoza-blue shadow-sm" : "text-mendoza-muted hover:bg-white/60"}`}
                onClick={() => changeSelectionMode("multiple")}
                type="button"
              >
                Varias preguntas
              </button>
            </div>
          )}
          {selectionMode === "multiple" && !editingRuleId ? (
            <>
              <SearchableMultiSelect
                allLabel="Seleccionar preguntas"
                label="Preguntas que recibirán la regla"
                onChange={setSelectedQuestionIds}
                options={questions.map((question) => ({
                  value: question.value,
                  label: `${question.code} · ${question.prompt}`,
                }))}
                values={selectedQuestionIds}
              />
              <p className="mt-2 text-xs leading-5 text-mendoza-muted">
                La regla se agregará al final de la prioridad de cada pregunta
                seleccionada. Las reglas existentes no se reemplazan.
              </p>
            </>
          ) : (
            <QuestionCombobox
              label="Pregunta"
              onChange={selectQuestion}
              options={questions}
              value={questionId}
            />
          )}
          {selectionMode === "single" && selectedQuestion && (
            <div
              aria-label="Pregunta seleccionada"
              className="mt-4 rounded-xl border border-mendoza-border bg-mendoza-background/60 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-full bg-mendoza-blue px-2.5 py-1 text-xs font-bold text-white">
                    {selectedQuestion.code}
                  </span>
                  <span className="text-sm font-semibold text-mendoza-blue">
                    {selectedQuestion.groupLabel}
                  </span>
                </div>
                <span className="text-xs font-semibold text-mendoza-muted">
                  Pregunta {selectedQuestionIndex + 1} de {questions.length}
                </span>
              </div>
              <p className="mt-3 text-base leading-7 text-mendoza-text">
                {selectedQuestion.prompt}
              </p>
              <div className="mt-4 flex flex-col gap-3 border-t border-mendoza-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-mendoza-muted">
                  {selectedQuestion.ruleCount === 0
                    ? "Sin reglas configuradas"
                    : `${selectedQuestion.ruleCount} ${selectedQuestion.ruleCount === 1 ? "regla configurada" : "reglas configuradas"}`}
                </span>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button
                    disabled={selectedQuestionIndex <= 0}
                    icon={<ChevronLeft aria-hidden="true" size={17} />}
                    onClick={() =>
                      selectQuestion(
                        questions[selectedQuestionIndex - 1]?.value ?? "",
                      )
                    }
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <Button
                    disabled={
                      selectedQuestionIndex < 0 ||
                      selectedQuestionIndex >= questions.length - 1
                    }
                    icon={<ChevronRight aria-hidden="true" size={17} />}
                    onClick={() =>
                      selectQuestion(
                        questions[selectedQuestionIndex + 1]?.value ?? "",
                      )
                    }
                    variant="outline"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mendoza-blue text-sm font-bold text-white">
                2
              </span>
              <div>
                <h2 className="text-xl font-bold">Prioridad de las reglas</h2>
                <p className="mt-1 text-sm leading-5 text-mendoza-muted">
                  Se evalúan de arriba hacia abajo. Cuando una coincide, las
                  siguientes ya no se aplican.
                </p>
              </div>
            </div>
            {selectionMode === "multiple" && !editingRuleId ? (
              <div className="mt-4">
                <EmptyState
                  description="La nueva regla se agregará a cada pregunta marcada sin reemplazar ni reordenar sus reglas actuales. Para revisar o editar prioridades, volvé al modo de una pregunta."
                  icon={SquareCheckBig}
                  title="Aplicación a varias preguntas"
                />
              </div>
            ) : !selectedRules.length ? (
              <div className="mt-4">
                <EmptyState
                  description="Creá la primera regla en el panel siguiente. Mientras no haya reglas, esta pregunta se mostrará para todos los colegios."
                  icon={ListChecks}
                  title="Esta pregunta todavía no tiene reglas"
                />
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-xl border border-mendoza-sky/40 bg-mendoza-blue-soft/40 p-3 text-sm text-mendoza-text">
                  Si ninguna regla coincide, la pregunta se{" "}
                  <strong>
                    {selectedRules[0].defaultAction === "show"
                      ? "mostrará"
                      : "omitirá"}
                  </strong>
                  .
                </div>
                <ol className="mt-4 space-y-3">
                  {selectedRules.map((rule, index) => (
                    <li
                      className={`rounded-xl border border-l-4 bg-white p-4 shadow-sm ${rule.action === "show" ? "border-l-mendoza-success" : "border-l-mendoza-gold"}`}
                      key={rule.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-mendoza-background px-2.5 py-1 text-xs font-bold text-mendoza-muted">
                          Prioridad {index + 1}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${rule.action === "show" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}
                        >
                          {rule.action === "show"
                            ? "Mostrar pregunta"
                            : "Omitir pregunta"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-mendoza-text">
                        Cuando{" "}
                        {rule.groupOperator === "all"
                          ? "todas"
                          : "al menos una"}{" "}
                        de estas condiciones se cumpla:
                      </p>
                      <ul className="mt-2 space-y-2">
                        {rule.conditions.map((condition, conditionIndex) => (
                          <li
                            className="flex gap-2 rounded-lg bg-mendoza-background/70 p-2.5 text-sm text-mendoza-text"
                            key={condition.id ?? `${rule.id}-${conditionIndex}`}
                          >
                            <span className="font-bold text-mendoza-blue">
                              {conditionIndex === 0
                                ? "SI"
                                : rule.groupOperator === "all"
                                  ? "Y"
                                  : "O"}
                            </span>
                            <span>{conditionText(condition, metadata)}</span>
                          </li>
                        ))}
                      </ul>
                      {!readonly && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-mendoza-border pt-3">
                          <Button onClick={() => edit(rule)} variant="outline">
                            Editar
                          </Button>
                          <Button
                            disabled={index === 0}
                            icon={<ArrowUp size={16} />}
                            onClick={() => void move(index, -1)}
                            variant="outline"
                          >
                            Subir
                          </Button>
                          <Button
                            disabled={index === selectedRules.length - 1}
                            icon={<ArrowDown size={16} />}
                            onClick={() => void move(index, 1)}
                            variant="outline"
                          >
                            Bajar
                          </Button>
                          <Button
                            icon={<Trash2 size={16} />}
                            onClick={() => void remove(rule)}
                            variant="outline"
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </Card>

          {!readonly && (
            <Card>
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mendoza-blue text-sm font-bold text-white">
                  3
                </span>
                <div>
                  <h2 className="text-xl font-bold">
                    {editingRuleId
                      ? "Editar esta regla"
                      : "Definí una nueva regla"}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-mendoza-muted">
                    {selectionMode === "multiple" && !editingRuleId
                      ? `La regla se aplicará a ${selectedQuestionIds.length} preguntas seleccionadas.`
                      : "Completá la frase: “Cuando se cumpla esto, entonces…”"}
                  </p>
                </div>
              </div>
              <form className="mt-4 space-y-4" onSubmit={save}>
                <div className="grid gap-4 rounded-xl border border-mendoza-sky/40 bg-mendoza-blue-soft/30 p-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <RuleSelect
                        label="Entonces"
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        options={actionOptions}
                        value={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="defaultAction"
                    render={({ field }) => (
                      <RuleSelect
                        label="Si ninguna regla coincide"
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        options={actionOptions}
                        value={field.value}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={form.control}
                  name="groupOperator"
                  render={({ field }) => (
                    <RuleSelect
                      label="Para aplicar la regla deben cumplirse"
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      options={[
                        { value: "all", label: "Todas las condiciones" },
                        { value: "any", label: "Al menos una condición" },
                      ]}
                      value={field.value}
                    />
                  )}
                />
                {conditionFields.fields.map((field, index) => {
                  const feature = metadata.features.find(
                    ({ key }) => key === conditions[index]?.feature,
                  );
                  return (
                    <fieldset
                      className="rounded-xl border border-mendoza-border bg-mendoza-background/40 p-4"
                      key={field.id}
                    >
                      <legend className="px-2 font-semibold text-mendoza-blue">
                        Cuando · condición {index + 1}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Controller
                          control={form.control}
                          name={`conditions.${index}.feature`}
                          render={({ field: featureField }) => (
                            <RuleSelect
                              label="Característica"
                              onBlur={featureField.onBlur}
                              onChange={(value) => {
                                featureField.onChange(value);
                                const next = metadata.features.find(
                                  ({ key }) => key === value,
                                );
                                form.setValue(
                                  `conditions.${index}.operator`,
                                  next?.operators[0] ?? "",
                                );
                                form.setValue(
                                  `conditions.${index}.expectedValue`,
                                  next?.type === "boolean" ? "true" : "",
                                );
                              }}
                              options={metadata.features.map((option) => ({
                                value: option.key,
                                label: option.label,
                              }))}
                              value={featureField.value}
                            />
                          )}
                        />
                        <Controller
                          control={form.control}
                          name={`conditions.${index}.operator`}
                          render={({ field: operatorField }) => (
                            <RuleSelect
                              label="Operador"
                              onBlur={operatorField.onBlur}
                              onChange={operatorField.onChange}
                              options={(feature?.operators ?? []).map(
                                (operator) => ({
                                  value: operator,
                                  label:
                                    metadata.operators.find(
                                      ({ key }) => key === operator,
                                    )?.label ?? operator,
                                }),
                              )}
                              value={operatorField.value}
                            />
                          )}
                        />
                        {feature?.allowedValues ? (
                          <Controller
                            control={form.control}
                            name={`conditions.${index}.expectedValue`}
                            render={({ field: valueField }) => (
                              <RuleSelect
                                label="Valor"
                                onBlur={valueField.onBlur}
                                onChange={valueField.onChange}
                                options={feature.allowedValues!.map(
                                  (option) => ({
                                    value: String(option.value),
                                    label: option.label,
                                  }),
                                )}
                                value={valueField.value}
                              />
                            )}
                          />
                        ) : (
                          <label className="text-sm font-semibold">
                            Valor
                            <input
                              className={`${inputClassName} mt-1`}
                              placeholder="Separá múltiples valores con comas"
                              type={
                                feature?.type === "number" ? "number" : "text"
                              }
                              {...form.register(
                                `conditions.${index}.expectedValue`,
                              )}
                            />
                          </label>
                        )}
                      </div>
                      {conditionFields.fields.length > 1 && (
                        <button
                          className="mt-3 text-sm font-semibold text-mendoza-error"
                          onClick={() => conditionFields.remove(index)}
                          type="button"
                        >
                          Eliminar condición
                        </button>
                      )}
                    </fieldset>
                  );
                })}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mendoza-border pt-4">
                  <Button
                    icon={<CirclePlus size={16} />}
                    onClick={() =>
                      conditionFields.append({
                        feature: "has_kiosk",
                        operator: "equals",
                        expectedValue: "true",
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    Agregar condición
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    {editingRuleId && (
                      <Button
                        onClick={resetNew}
                        type="button"
                        variant="outline"
                      >
                        Cancelar edición
                      </Button>
                    )}
                    <Button
                      disabled={
                        selectionMode === "multiple" &&
                        selectedQuestionIds.length < 2
                      }
                      icon={
                        selectionMode === "multiple" ? (
                          <SquareCheckBig size={16} />
                        ) : (
                          <Save size={16} />
                        )
                      }
                      type="submit"
                    >
                      {editingRuleId
                        ? "Guardar cambios"
                        : selectionMode === "multiple"
                          ? `Aplicar a ${selectedQuestionIds.length} preguntas`
                          : "Guardar regla"}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}
        </div>

        <Card className="mt-6">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mendoza-blue text-sm font-bold text-white">
              4
            </span>
            <div>
              <h2 className="text-xl font-bold">Probá el resultado</h2>
              <p className="mt-1 text-sm leading-5 text-mendoza-muted">
                Seleccioná un colegio para comprobar si la pregunta se mostrará
                u omitirá con sus datos actuales.
              </p>
            </div>
          </div>
          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <SchoolCombobox
              label="Colegio de prueba"
              onChange={(school) => {
                setPreviewSchool(school);
                setPreview(null);
              }}
              placeholder="Buscar por CUE, número o nombre…"
              selectedSchool={previewSchool}
            />
            <Button
              disabled={!previewSchool}
              icon={<PlayCircle size={17} />}
              onClick={() => void runPreview()}
            >
              Probar regla
            </Button>
          </div>
          {preview && (
            <div
              className={`mt-4 rounded-xl border p-4 ${
                preview.status === "applicable"
                  ? "border-green-200 bg-green-50 text-green-900"
                  : preview.status === "excluded"
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-mendoza-sky bg-mendoza-blue-soft text-mendoza-blue"
              }`}
              role="status"
            >
              <div className="flex items-center gap-2 font-bold">
                <Eye aria-hidden="true" size={18} />
                {preview.status === "applicable"
                  ? "La pregunta se mostrará"
                  : preview.status === "excluded"
                    ? "La pregunta se omitirá"
                    : "Faltan datos para decidir"}
              </div>
              <p className="mt-1 text-sm leading-6">{preview.explanation}</p>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

const actionOptions = [
  { value: "show", label: "Mostrar la pregunta" },
  { value: "omit", label: "Omitir la pregunta" },
];

function conditionText(
  condition: ApplicabilityRule["conditions"][number],
  metadata: ApplicabilityMetadata,
) {
  const feature = metadata.features.find(
    ({ key }) => key === condition.feature,
  );
  const operator = metadata.operators.find(
    ({ key }) => key === condition.operator,
  );
  const rawValues = Array.isArray(condition.expectedValue)
    ? condition.expectedValue
    : [condition.expectedValue];
  const values = rawValues.map((value) => {
    const allowed = feature?.allowedValues?.find(
      (option) => String(option.value) === String(value),
    );
    if (allowed) return allowed.label;
    if (value === true || value === "true") return "Sí";
    if (value === false || value === "false") return "No";
    return String(value);
  });

  return `${feature?.label ?? condition.feature} ${(operator?.label ?? condition.operator).toLocaleLowerCase("es-AR")} ${values.join(", ")}`;
}

function RuleSelect({
  label,
  value,
  options,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <SearchableSelect
      allLabel="Seleccioná una opción"
      disabled={!options.length}
      label={label}
      onBlur={onBlur}
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}

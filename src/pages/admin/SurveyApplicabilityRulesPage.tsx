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
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
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
import { getHttpErrorDetails, getHttpErrorMessage } from "../../lib/http-error";
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
        expectedValue: z
          .string()
          .trim()
          .min(1, "Ingresá o seleccioná un valor."),
      }),
    )
    .min(1, "Agregá al menos una condición."),
});
type FormValues = z.infer<typeof schema>;
type ApplicabilityRuleInput = Omit<
  ApplicabilityRule,
  "id" | "questionId" | "question"
>;

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
  const [isRuleMutationPending, setIsRuleMutationPending] = useState(false);
  const [error, setError] = useState("");
  const [editConflict, setEditConflict] = useState("");
  const resetQuestionKey = useRef("");
  const ruleMutationPendingRef = useRef(false);
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
  const watchedGroupOperator = useWatch({
    control: form.control,
    name: "groupOperator",
  });
  const watchedAction = useWatch({ control: form.control, name: "action" });
  const watchedDefaultAction = useWatch({
    control: form.control,
    name: "defaultAction",
  });
  const conditions =
    useWatch({ control: form.control, name: "conditions" }) ?? [];
  const formValues: FormValues = {
    groupOperator: watchedGroupOperator ?? "all",
    action: watchedAction ?? "omit",
    defaultAction: watchedDefaultAction ?? "show",
    conditions,
  };

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
  const selectedQuestionIdSet = new Set(selectedQuestionIds);
  const selectedQuestions = questions.filter(({ value }) =>
    selectedQuestionIdSet.has(value),
  );
  const comparableDraft =
    metadata && isComparableRuleDraft(formValues)
      ? toApplicabilityRuleInput(formValues, metadata, 0)
      : null;
  const selectedRuleStatusByQuestion = new Map(
    comparableDraft
      ? selectedQuestions.map((question) => [
          question.value,
          applicabilityRuleStatus(question.value, comparableDraft, rules),
        ])
      : [],
  );
  const duplicateSelectedQuestions = comparableDraft
    ? selectedQuestions.filter(
        ({ value }) => selectedRuleStatusByQuestion.get(value)?.duplicate,
      )
    : [];
  const duplicateQuestionIds = new Set(
    duplicateSelectedQuestions.map(({ value }) => value),
  );
  const defaultActionConflictQuestions = comparableDraft
    ? selectedQuestions.filter(
        ({ value }) =>
          selectedRuleStatusByQuestion.get(value)?.defaultActionConflict,
      )
    : [];
  const contradictorySelectedQuestions = comparableDraft
    ? selectedQuestions.filter(
        ({ value }) => selectedRuleStatusByQuestion.get(value)?.contradictory,
      )
    : [];
  const questionsToReceiveRule = selectedQuestions.filter(
    ({ value }) => !duplicateQuestionIds.has(value),
  );
  const selectedQuestionsWithRules = selectedQuestions.filter(
    ({ ruleCount }) => ruleCount > 0,
  );
  const selectedExistingRuleCount = selectedQuestions.reduce(
    (total, { ruleCount }) => total + ruleCount,
    0,
  );
  const multipleSubmitBlocked =
    selectionMode === "multiple" &&
    (!comparableDraft ||
      selectedQuestionIds.length < 2 ||
      questionsToReceiveRule.length === 0 ||
      defaultActionConflictQuestions.length > 0 ||
      contradictorySelectedQuestions.length > 0);

  const load = useCallback(async () => {
    if (!surveyId || !versionId) return;
    setIsLoading(true);
    setError("");
    try {
      const [loadedVersion, loadedMetadata, ruleSnapshot] = await Promise.all([
        adminSurveysService.findVersion(surveyId, versionId),
        adminSurveysService.applicabilityMetadata(),
        adminSurveysService.listApplicabilityRules(surveyId, versionId),
      ]);
      setVersion({
        ...loadedVersion,
        updatedAt: ruleSnapshot.versionUpdatedAt,
      });
      setMetadata(loadedMetadata);
      setRules(ruleSnapshot.rules);
      setEditConflict("");
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
    setSelectedQuestionIds((current) => {
      const validQuestionIds = new Set(questions.map(({ value }) => value));
      const retained = current.filter((id) => validQuestionIds.has(id));
      const next = retained.length
        ? retained
        : nextQuestionId
          ? [nextQuestionId]
          : [];
      return sameStringArray(current, next) ? current : next;
    });
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

  const acceptVersionRevision = (updatedAt: string) => {
    setVersion((current) => (current ? { ...current, updatedAt } : current));
    setEditConflict("");
  };

  const handleMutationError = (mutationError: unknown) => {
    const details = getHttpErrorDetails(mutationError);
    if (details?.code === "SURVEY_VERSION_EDIT_CONFLICT") {
      setEditConflict(details.message);
      showError(details.message);
      return;
    }
    showError(getHttpErrorMessage(mutationError));
  };

  const loadLatestVersion = () => {
    resetQuestionKey.current = "";
    void load();
  };

  const beginRuleMutation = () => {
    if (ruleMutationPendingRef.current) return false;
    ruleMutationPendingRef.current = true;
    setIsRuleMutationPending(true);
    return true;
  };

  const finishRuleMutation = () => {
    ruleMutationPendingRef.current = false;
    setIsRuleMutationPending(false);
  };

  const saveValues = async (values: FormValues) => {
    if (!surveyId || !versionId || !questionId || !metadata || !version) return;
    const input = toApplicabilityRuleInput(
      values,
      metadata,
      editingRuleId
        ? (selectedRules.find((rule) => rule.id === editingRuleId)?.order ?? 0)
        : nextRuleOrder(selectedRules),
    );
    let successMessage = "Regla creada.";
    try {
      if (editingRuleId) {
        const mutation = await adminSurveysService.updateApplicabilityRule(
          surveyId,
          versionId,
          questionId,
          editingRuleId,
          input,
          version.updatedAt,
        );
        setRules((current) =>
          current.map((rule) =>
            rule.id === mutation.rule.id ? mutation.rule : rule,
          ),
        );
        acceptVersionRevision(mutation.versionUpdatedAt);
        successMessage = "Regla actualizada.";
      } else if (selectionMode === "multiple") {
        if (selectedQuestionIds.length < 2) {
          showError("Seleccioná al menos dos preguntas para aplicar la regla.");
          return;
        }
        const selected = questions.filter(({ value }) =>
          selectedQuestionIds.includes(value),
        );
        const statusByQuestion = new Map(
          selected.map((question) => [
            question.value,
            applicabilityRuleStatus(question.value, input, rules),
          ]),
        );
        const defaultActionConflicts = selected.filter(
          ({ value }) => statusByQuestion.get(value)?.defaultActionConflict,
        );
        if (defaultActionConflicts.length) {
          showError(
            `No se aplicó la regla: ${questionCodes(defaultActionConflicts)} ya ${defaultActionConflicts.length === 1 ? "usa" : "usan"} otra acción predeterminada. Revisá ${defaultActionConflicts.length === 1 ? "esa pregunta" : "esas preguntas"} en modo individual.`,
          );
          return;
        }
        const contradictions = selected.filter(
          ({ value }) => statusByQuestion.get(value)?.contradictory,
        );
        if (contradictions.length) {
          showError(
            `No se aplicó la regla: ${questionCodes(contradictions)} ya ${contradictions.length === 1 ? "tiene" : "tienen"} las mismas condiciones con una acción opuesta. Revisá ${contradictions.length === 1 ? "esa pregunta" : "esas preguntas"} en modo individual.`,
          );
          return;
        }
        const duplicates = selected.filter(
          ({ value }) => statusByQuestion.get(value)?.duplicate,
        );
        const duplicateIds = new Set(duplicates.map(({ value }) => value));
        const targetQuestions = selected.filter(
          ({ value }) => !duplicateIds.has(value),
        );
        if (!targetQuestions.length) {
          showError(
            `No se crearon duplicados: ${questionCodes(duplicates)} ya ${duplicates.length === 1 ? "tiene" : "tienen"} esta regla.`,
          );
          return;
        }
        if (targetQuestions.length === 1) {
          const target = targetQuestions[0]!;
          const mutation = await adminSurveysService.createApplicabilityRule(
            surveyId,
            versionId,
            target.value,
            {
              ...input,
              order: nextRuleOrder(
                rules.filter(
                  ({ questionId: ruleQuestionId }) =>
                    ruleQuestionId === target.value,
                ),
              ),
            },
            version.updatedAt,
          );
          setRules((current) => [...current, mutation.rule]);
          acceptVersionRevision(mutation.versionUpdatedAt);
        } else {
          const mutation =
            await adminSurveysService.createApplicabilityRuleBulk(
              surveyId,
              versionId,
              targetQuestions.map(({ value }) => value),
              input,
              version.updatedAt,
            );
          setRules((current) => [...current, ...mutation.rules]);
          acceptVersionRevision(mutation.versionUpdatedAt);
        }
        successMessage = `Regla aplicada a ${formatQuestionCount(targetQuestions.length)}${duplicates.length ? `; ${formatQuestionCount(duplicates.length)} ya ${duplicates.length === 1 ? "la tenía y no se duplicó" : "la tenían y no se duplicaron"}` : ""}.`;
      } else {
        const mutation = await adminSurveysService.createApplicabilityRule(
          surveyId,
          versionId,
          questionId,
          input,
          version.updatedAt,
        );
        setRules((current) => [...current, mutation.rule]);
        acceptVersionRevision(mutation.versionUpdatedAt);
      }
      showSuccess(successMessage);
      resetNew();
    } catch (saveError) {
      handleMutationError(saveError);
    }
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    if (!beginRuleMutation()) {
      event.preventDefault();
      return;
    }
    void form.handleSubmit(saveValues)(event).finally(finishRuleMutation);
  };

  const remove = async (rule: ApplicabilityRule) => {
    if (!surveyId || !versionId || !version || !beginRuleMutation()) return;
    try {
      const mutation = await adminSurveysService.removeApplicabilityRule(
        surveyId,
        versionId,
        rule.questionId,
        rule.id,
        version.updatedAt,
      );
      setRules((current) => current.filter(({ id }) => id !== rule.id));
      acceptVersionRevision(mutation.versionUpdatedAt);
      resetNew();
      showSuccess("Regla eliminada.");
    } catch (removeError) {
      handleMutationError(removeError);
    } finally {
      finishRuleMutation();
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!surveyId || !versionId || !version) return;
    const target = index + direction;
    if (target < 0 || target >= selectedRules.length || !beginRuleMutation())
      return;
    const ordered = [...selectedRules];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    try {
      const updated = await adminSurveysService.reorderApplicabilityRules(
        surveyId,
        versionId,
        questionId,
        ordered.map(({ id }) => id),
        version.updatedAt,
      );
      setRules((current) => [
        ...current.filter((rule) => rule.questionId !== questionId),
        ...updated.rules,
      ]);
      acceptVersionRevision(updated.versionUpdatedAt);
    } catch (moveError) {
      handleMutationError(moveError);
    } finally {
      finishRuleMutation();
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
        <fieldset
          className="m-0 min-w-0 border-0 p-0"
          disabled={isRuleMutationPending}
        >
          {readonly && (
            <Card className="mt-6 border-mendoza-gold bg-amber-50">
              <p className="font-semibold text-mendoza-text">
                Esta versión es de solo lectura. Para modificar reglas, clonala
                y trabajá sobre el nuevo borrador.
              </p>
            </Card>
          )}
          {editConflict && (
            <Card className="mt-6 border-mendoza-error bg-red-50" role="alert">
              <p className="font-bold text-mendoza-error">
                No se sobrescribieron cambios más recientes
              </p>
              <p className="mt-1 text-sm leading-6 text-mendoza-text">
                {editConflict} La regla que estabas editando sigue en el
                formulario. Para continuar, cargá la versión actual y revisá los
                cambios antes de volver a guardar.
              </p>
              <Button
                className="mt-4"
                onClick={loadLatestVersion}
                variant="outline"
              >
                Descartar mi edición y cargar la versión actual
              </Button>
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
                    badge: formatRuleCount(question.ruleCount),
                    highlighted: question.ruleCount > 0,
                    label: `${question.code} · ${question.prompt}`,
                  }))}
                  values={selectedQuestionIds}
                />
                <p className="mt-2 text-xs leading-5 text-mendoza-muted">
                  La regla se agregará al final de la prioridad de cada pregunta
                  seleccionada. Las reglas existentes no se reemplazan.
                </p>
                <section
                  aria-label="Resumen antes de aplicar"
                  className="mt-4 rounded-xl border border-mendoza-border bg-mendoza-background/50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-mendoza-text">
                        Resumen antes de aplicar
                      </h3>
                      <p
                        aria-live="polite"
                        className="mt-1 text-sm text-mendoza-muted"
                      >
                        {formatQuestionCount(selectedQuestions.length)}{" "}
                        {selectedQuestions.length === 1
                          ? "seleccionada"
                          : "seleccionadas"}{" "}
                        · {selectedExistingRuleCount}{" "}
                        {selectedExistingRuleCount === 1 ? "regla" : "reglas"}{" "}
                        {selectedExistingRuleCount === 1
                          ? "existente"
                          : "existentes"}{" "}
                        en{" "}
                        {formatQuestionCount(selectedQuestionsWithRules.length)}
                        .
                      </p>
                    </div>
                    <span className="rounded-full bg-mendoza-blue-soft px-3 py-1 text-xs font-bold text-mendoza-blue">
                      {!comparableDraft
                        ? "Completá la regla"
                        : defaultActionConflictQuestions.length > 0 ||
                            contradictorySelectedQuestions.length > 0
                          ? "Aplicación bloqueada"
                          : `${formatQuestionCount(questionsToReceiveRule.length)} recibirán la regla`}
                    </span>
                  </div>
                  <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                    {selectedQuestions.map((question) => {
                      const isDuplicate = duplicateQuestionIds.has(
                        question.value,
                      );
                      const hasDefaultConflict =
                        defaultActionConflictQuestions.some(
                          ({ value }) => value === question.value,
                        );
                      const hasContradiction =
                        contradictorySelectedQuestions.some(
                          ({ value }) => value === question.value,
                        );
                      return (
                        <li
                          className={selectedQuestionSummaryClass(
                            question.ruleCount,
                            hasDefaultConflict || hasContradiction,
                          )}
                          key={question.value}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-mendoza-blue">
                              {question.code}
                            </span>
                            <span className="line-clamp-2 text-sm text-mendoza-text">
                              {question.prompt}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-mendoza-muted">
                              {formatRuleCount(question.ruleCount)}
                            </span>
                            {isDuplicate && (
                              <span className="text-xs font-bold text-amber-900">
                                Ya tiene esta regla
                              </span>
                            )}
                            {hasDefaultConflict && (
                              <span className="text-xs font-bold text-mendoza-error">
                                Acción predeterminada incompatible
                              </span>
                            )}
                            {hasContradiction && (
                              <span className="text-xs font-bold text-mendoza-error">
                                Acción opuesta para las mismas condiciones
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {duplicateSelectedQuestions.length > 0 && (
                    <p
                      className="mt-3 rounded-lg border border-mendoza-gold/60 bg-amber-50 p-3 text-sm font-semibold text-amber-950"
                      role="status"
                    >
                      {questionCodes(duplicateSelectedQuestions)} ya{" "}
                      {duplicateSelectedQuestions.length === 1
                        ? "tiene"
                        : "tienen"}{" "}
                      una regla equivalente. Se{" "}
                      {duplicateSelectedQuestions.length === 1
                        ? "omitirá"
                        : "omitirán"}{" "}
                      para no crear duplicados.
                    </p>
                  )}
                  {defaultActionConflictQuestions.length > 0 && (
                    <p
                      className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-mendoza-error"
                      role="alert"
                    >
                      {questionCodes(defaultActionConflictQuestions)} ya{" "}
                      {defaultActionConflictQuestions.length === 1
                        ? "usa"
                        : "usan"}{" "}
                      otra acción predeterminada. Revisá{" "}
                      {defaultActionConflictQuestions.length === 1
                        ? "esa pregunta"
                        : "esas preguntas"}{" "}
                      en modo individual antes de continuar.
                    </p>
                  )}
                  {contradictorySelectedQuestions.length > 0 && (
                    <p
                      className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-mendoza-error"
                      role="alert"
                    >
                      {questionCodes(contradictorySelectedQuestions)} ya{" "}
                      {contradictorySelectedQuestions.length === 1
                        ? "tiene"
                        : "tienen"}{" "}
                      las mismas condiciones con una acción opuesta. Revisá{" "}
                      {contradictorySelectedQuestions.length === 1
                        ? "esa pregunta"
                        : "esas preguntas"}{" "}
                      en modo individual antes de continuar.
                    </p>
                  )}
                </section>
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
                              key={
                                condition.id ?? `${rule.id}-${conditionIndex}`
                              }
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
                            <Button
                              onClick={() => edit(rule)}
                              variant="outline"
                            >
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
                        ? !comparableDraft
                          ? "Completá todas las condiciones para calcular el impacto."
                          : defaultActionConflictQuestions.length > 0 ||
                              contradictorySelectedQuestions.length > 0
                            ? "Resolvé las reglas incompatibles antes de aplicar."
                            : `La regla se aplicará a ${formatQuestionCount(questionsToReceiveRule.length)}; las equivalentes se omitirán.`
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
                        disabled={multipleSubmitBlocked}
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
                            ? `Aplicar a ${formatQuestionCount(questionsToReceiveRule.length)}`
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
                  Seleccioná un colegio para comprobar si la pregunta se
                  mostrará u omitirá con sus datos actuales.
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
        </fieldset>
      </div>
    </main>
  );
}

const actionOptions = [
  { value: "show", label: "Mostrar la pregunta" },
  { value: "omit", label: "Omitir la pregunta" },
];

function isComparableRuleDraft(values: FormValues) {
  return (
    values.conditions.length > 0 &&
    values.conditions.every(({ feature, operator, expectedValue }) =>
      Boolean(feature.trim() && operator.trim() && expectedValue.trim()),
    )
  );
}

function toApplicabilityRuleInput(
  values: FormValues,
  metadata: ApplicabilityMetadata,
  order: number,
): ApplicabilityRuleInput {
  return {
    groupOperator: values.groupOperator,
    action: values.action,
    defaultAction: values.defaultAction,
    order,
    conditions: values.conditions.map((condition, conditionOrder) => {
      const feature = metadata.features.find(
        ({ key }) => key === condition.feature,
      );
      const rawValue = condition.expectedValue.trim();
      return {
        feature: condition.feature,
        operator: condition.operator,
        expectedValue:
          feature?.type === "boolean"
            ? rawValue === "true"
            : feature?.type === "number"
              ? Number(rawValue)
              : isSetOperator(condition.operator)
                ? rawValue
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                : rawValue,
        order: conditionOrder,
      };
    }),
  };
}

/**
 * Clasifica una regla nueva frente a las reglas de una pregunta para evitar
 * duplicados y contradicciones antes de una aplicación múltiple.
 */
function applicabilityRuleStatus(
  questionId: string,
  draft: ApplicabilityRuleInput,
  rules: ApplicabilityRule[],
) {
  const questionRules = rules.filter((rule) => rule.questionId === questionId);
  const draftPredicate = applicabilityRulePredicateSignature(draft);
  return {
    defaultActionConflict: questionRules.some(
      (rule) => rule.defaultAction !== draft.defaultAction,
    ),
    contradictory: questionRules.some(
      (rule) =>
        applicabilityRulePredicateSignature(rule) === draftPredicate &&
        rule.action !== draft.action,
    ),
    duplicate: questionRules.some((rule) =>
      areApplicabilityRulesEquivalent(rule, draft),
    ),
  };
}

function areApplicabilityRulesEquivalent(
  left: ApplicabilityRule | ApplicabilityRuleInput,
  right: ApplicabilityRule | ApplicabilityRuleInput,
) {
  return applicabilityRuleSignature(left) === applicabilityRuleSignature(right);
}

function applicabilityRuleSignature(
  rule: ApplicabilityRule | ApplicabilityRuleInput,
) {
  return JSON.stringify({
    predicate: applicabilityRulePredicateSignature(rule),
    action: rule.action,
    defaultAction: rule.defaultAction,
  });
}

function applicabilityRulePredicateSignature(
  rule: ApplicabilityRule | ApplicabilityRuleInput,
) {
  const conditions = [
    ...new Set(
      rule.conditions.map(({ feature, operator, expectedValue }) =>
        JSON.stringify({
          feature,
          operator,
          expectedValue: canonicalExpectedValue(expectedValue, operator),
        }),
      ),
    ),
  ].sort();

  return JSON.stringify({ groupOperator: rule.groupOperator, conditions });
}

function canonicalExpectedValue(
  value: ApplicabilityRule["conditions"][number]["expectedValue"],
  operator: string,
) {
  if (!Array.isArray(value) || !isSetOperator(operator)) return value;
  return [...new Set(value)].sort((left, right) =>
    left.localeCompare(right, "es-AR"),
  );
}

function isSetOperator(operator: string) {
  return ["in", "contains_any", "contains_all"].includes(operator);
}

function nextRuleOrder(questionRules: ApplicabilityRule[]) {
  return questionRules.length
    ? Math.max(...questionRules.map(({ order }) => order)) + 1
    : 0;
}

function sameStringArray(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function formatRuleCount(count: number) {
  return `${count} ${count === 1 ? "regla" : "reglas"}`;
}

function formatQuestionCount(count: number) {
  return `${count} ${count === 1 ? "pregunta" : "preguntas"}`;
}

function questionCodes(questions: Array<{ code: string }>) {
  return questions.map(({ code }) => code).join(", ");
}

function selectedQuestionSummaryClass(
  ruleCount: number,
  hasDefaultConflict: boolean,
) {
  const stateClass = hasDefaultConflict
    ? "border-red-300 bg-red-50"
    : ruleCount > 0
      ? "border-mendoza-gold/60 bg-amber-50"
      : "border-mendoza-border bg-white";
  return `flex items-start justify-between gap-3 rounded-lg border p-3 ${stateClass}`;
}

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

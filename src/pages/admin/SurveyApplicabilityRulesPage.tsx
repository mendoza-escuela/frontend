import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  CirclePlus,
  Eye,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { inputClassName } from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type {
  AdminSurveyVersion,
  ApplicabilityMetadata,
  ApplicabilityRule,
} from "../../types/admin-survey";

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
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [preview, setPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      groupOperator: "all",
      action: "omit",
      defaultAction: "show",
      conditions: [{ feature: "has_kiosk", operator: "equals", expectedValue: "true" }],
    },
  });
  const conditionFields = useFieldArray({
    control: form.control,
    name: "conditions",
  });
  const conditions = form.watch("conditions");

  const questions = useMemo(
    () =>
      version?.dimensions.flatMap((dimension) =>
        dimension.sections.flatMap((section) =>
          section.questions.map((question) => ({
            id: question.id,
            label: `${question.code} — ${question.prompt}`,
          })),
        ),
      ) ?? [],
    [version],
  );
  const selectedRules = useMemo(
    () =>
      rules
        .filter((rule) => rule.questionId === questionId)
        .sort((left, right) => left.order - right.order),
    [questionId, rules],
  );
  const readonly = version?.status !== "draft";

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
      const firstQuestion =
        loadedVersion.dimensions[0]?.sections[0]?.questions[0]?.id ?? "";
      const requestedQuestionId = searchParams.get("questionId");
      const requestedExists = loadedVersion.dimensions.some((dimension) =>
        dimension.sections.some((section) =>
          section.questions.some(
            (question) => question.id === requestedQuestionId,
          ),
        ),
      );
      setQuestionId((current) =>
        current ||
        (requestedExists && requestedQuestionId
          ? requestedQuestionId
          : firstQuestion),
      );
    } catch (loadError) {
      setError(getHttpErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, surveyId, versionId]);

  useEffect(() => {
    void load();
  }, [load]);

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
        await adminSurveysService.createApplicabilityRule(
          surveyId,
          versionId,
          questionId,
          input,
        );
      showSuccess(editingRuleId ? "Regla actualizada." : "Regla creada.");
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
    if (!surveyId || !versionId || !questionId || !schoolId) return;
    try {
      const decision = await adminSurveysService.previewApplicability(
        surveyId,
        versionId,
        questionId,
        schoolId,
      );
      setPreview(decision.explanation);
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
          description={metadata.resolution}
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

        <Card className="mt-6">
          <label className="block text-sm font-semibold" htmlFor="question">
            Pregunta
          </label>
          <select
            className={`${inputClassName} mt-2`}
            id="question"
            onChange={(event) => {
              setQuestionId(event.target.value);
              setSearchParams({ questionId: event.target.value });
              resetNew();
            }}
            value={questionId}
          >
            {questions.map((question) => (
              <option key={question.id} value={question.id}>
                {question.label}
              </option>
            ))}
          </select>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <h2 className="text-xl font-bold">Reglas configuradas</h2>
            {!selectedRules.length ? (
              <div className="mt-4">
                <EmptyState
                  description="Sin reglas, la pregunta se muestra de forma predeterminada."
                  title="No hay reglas"
                />
              </div>
            ) : (
              <ol className="mt-4 space-y-3">
                {selectedRules.map((rule, index) => (
                  <li className="rounded-xl border p-4" key={rule.id}>
                    <p className="font-semibold">
                      {index + 1}. {rule.action === "show" ? "Mostrar" : "Omitir"} si{" "}
                      {rule.groupOperator === "all" ? "todas" : "alguna"} de las
                      condiciones coincide
                    </p>
                    <ul className="mt-2 text-sm text-mendoza-muted">
                      {rule.conditions.map((condition) => (
                        <li key={condition.id}>
                          {condition.feature} {condition.operator}{" "}
                          {String(condition.expectedValue)}
                        </li>
                      ))}
                    </ul>
                    {!readonly && (
                      <div className="mt-3 flex gap-2">
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
            )}
          </Card>

          {!readonly && (
            <Card>
              <h2 className="text-xl font-bold">
                {editingRuleId ? "Editar regla" : "Nueva regla"}
              </h2>
              <form className="mt-4 space-y-4" onSubmit={save}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select label="Coincidencia" registration={form.register("groupOperator")}>
                    <option value="all">Todas (AND)</option>
                    <option value="any">Alguna (OR)</option>
                  </Select>
                  <Select label="Acción" registration={form.register("action")}>
                    <option value="show">Mostrar</option>
                    <option value="omit">Omitir</option>
                  </Select>
                  <Select label="Si ninguna coincide" registration={form.register("defaultAction")}>
                    <option value="show">Mostrar</option>
                    <option value="omit">Omitir</option>
                  </Select>
                </div>
                {conditionFields.fields.map((field, index) => {
                  const feature = metadata.features.find(
                    ({ key }) => key === conditions[index]?.feature,
                  );
                  return (
                    <fieldset className="rounded-xl border p-4" key={field.id}>
                      <legend className="px-2 font-semibold">
                        Condición {index + 1}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Select
                          label="Característica"
                          registration={form.register(`conditions.${index}.feature`, {
                            onChange: (event) => {
                              const next = metadata.features.find(
                                ({ key }) => key === event.target.value,
                              );
                              form.setValue(
                                `conditions.${index}.operator`,
                                next?.operators[0] ?? "",
                              );
                              form.setValue(
                                `conditions.${index}.expectedValue`,
                                next?.type === "boolean" ? "true" : "",
                              );
                            },
                          })}
                        >
                          {metadata.features.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                        <Select
                          label="Operador"
                          registration={form.register(`conditions.${index}.operator`)}
                        >
                          {feature?.operators.map((operator) => (
                            <option key={operator} value={operator}>
                              {metadata.operators.find(({ key }) => key === operator)?.label ??
                                operator}
                            </option>
                          ))}
                        </Select>
                        <label className="text-sm font-semibold">
                          Valor
                          {feature?.allowedValues ? (
                            <select
                              className={`${inputClassName} mt-1`}
                              {...form.register(`conditions.${index}.expectedValue`)}
                            >
                              {feature.allowedValues.map((option) => (
                                <option key={String(option.value)} value={String(option.value)}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className={`${inputClassName} mt-1`}
                              placeholder="Separá múltiples valores con comas"
                              type={feature?.type === "number" ? "number" : "text"}
                              {...form.register(`conditions.${index}.expectedValue`)}
                            />
                          )}
                        </label>
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
                <div className="flex flex-wrap gap-2">
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
                  <Button icon={<Save size={16} />} type="submit">
                    Guardar regla
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        <Card className="mt-6">
          <h2 className="text-xl font-bold">Previsualizar para una escuela</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Identificador de escuela"
              className={inputClassName}
              onChange={(event) => setSchoolId(event.target.value)}
              placeholder="UUID de la escuela"
              value={schoolId}
            />
            <Button icon={<Eye size={16} />} onClick={() => void runPreview()}>
              Evaluar
            </Button>
          </div>
          {preview && <p className="mt-3 rounded-lg bg-mendoza-blue-soft p-3">{preview}</p>}
        </Card>
      </div>
    </main>
  );
}

function Select({
  label,
  registration,
  children,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  children: ReactNode;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select className={`${inputClassName} mt-1`} {...registration}>
        {children}
      </select>
    </label>
  );
}

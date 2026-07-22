import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  CirclePlus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormField } from "../../components/ui/FormField";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  checkboxClassName,
  inputClassName,
} from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type { AdminSurveyVersion } from "../../types/admin-survey";
import type { SurveyQuestionType } from "../../types/survey";

const codeSchema = z
  .string()
  .trim()
  .min(1, "El código es obligatorio.")
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/, "Formato de código inválido.");
const optionalNumber = z.preprocess(
  (value) => (value === "" || Number.isNaN(value) ? undefined : value),
  z.number().optional(),
);
const optionalNonNegativeInteger = z.preprocess(
  (value) => (value === "" || Number.isNaN(value) ? undefined : value),
  z.number().int().min(0).max(10000).optional(),
);
const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || Number.isNaN(value) ? undefined : value),
  z.number().int().min(1).max(10000).optional(),
);
const optionalMaxSelections = z.preprocess(
  (value) => (value === "" || Number.isNaN(value) ? undefined : value),
  z.number().int().min(1).max(500).optional(),
);
const optionSchema = z.object({
  value: codeSchema,
  label: z.string().trim().min(1, "La etiqueta es obligatoria.").max(500),
  helpText: z.string().max(2000).optional().nullable(),
});
const questionSchema = z.object({
  code: codeSchema,
  type: z.enum([
    "single_choice",
    "multiple_choice",
    "boolean",
    "short_text",
    "long_text",
    "number",
    "date",
  ]),
  prompt: z.string().trim().min(1, "La pregunta es obligatoria.").max(5000),
  helpText: z.string().max(5000).optional().nullable(),
  required: z.boolean(),
  validation: z.object({
    min: optionalNumber,
    max: optionalNumber,
    minLength: optionalNonNegativeInteger,
    maxLength: optionalPositiveInteger,
    maxSelections: optionalMaxSelections,
    placeholder: z.string().max(255).optional(),
  }),
  options: z.array(optionSchema).max(500),
});
const sectionSchema = z.object({
  code: codeSchema,
  title: z.string().trim().min(1, "El título es obligatorio.").max(255),
  description: z.string().max(5000).optional().nullable(),
  questions: z.array(questionSchema).max(300),
});
const dimensionSchema = z.object({
  code: codeSchema,
  title: z.string().trim().min(1, "El título es obligatorio.").max(255),
  description: z.string().max(5000).optional().nullable(),
  sections: z.array(sectionSchema).max(100),
});
const editorSchema = z.object({
  title: z.string().trim().min(1, "Ingresá un título.").max(255),
  instructions: z.string().max(10000),
  dimensions: z.array(dimensionSchema).max(50),
});

type EditorForm = z.infer<typeof editorSchema>;

const emptyQuestion = (): EditorForm["dimensions"][number]["sections"][number]["questions"][number] => ({
  code: "",
  type: "boolean",
  prompt: "",
  helpText: "",
  required: false,
  validation: {
    min: undefined,
    max: undefined,
    minLength: undefined,
    maxLength: undefined,
    maxSelections: undefined,
    placeholder: "",
  },
  options: [],
});

export function SurveyVersionEditorPage() {
  const { surveyId, versionId } = useParams();
  const [version, setVersion] = useState<AdminSurveyVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditorForm>({
    resolver: zodResolver(editorSchema),
    defaultValues: { title: "", instructions: "", dimensions: [] },
  });
  const dimensions = watch("dimensions");

  useEffect(() => {
    if (!surveyId || !versionId) return;
    adminSurveysService
      .findVersion(surveyId, versionId)
      .then((loaded) => {
        setVersion(loaded);
        reset(toEditorForm(loaded));
      })
      .catch((error) => setLoadError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [reset, surveyId, versionId]);

  const updateDimensions = (next: EditorForm["dimensions"]) =>
    setValue("dimensions", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

  const submit = handleSubmit(async (values) => {
    if (!surveyId || !versionId) return;
    try {
      await adminSurveysService.updateVersion(surveyId, versionId, values);
      showSuccess("La versión borrador fue guardada.");
      reset(values);
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });

  if (isLoading)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Cargando editor…" />
      </main>
    );
  if (loadError || !version)
    return (
      <main className="p-4 sm:p-8">
        <ErrorState message={loadError || "Versión no encontrada."} />
      </main>
    );
  if (version.status !== "draft")
    return (
      <main className="p-4 sm:p-8">
        <ErrorState message="Las versiones publicadas o archivadas son de sólo lectura. Cloná esta versión para continuar editando." />
      </main>
    );

  return (
    <main className="p-4 sm:p-8">
      <form className="mx-auto max-w-7xl" noValidate onSubmit={submit}>
        <PageHeader
          actions={
            <Button
              disabled={isSubmitting || !isDirty}
              icon={<Save aria-hidden="true" size={18} />}
              type="submit"
            >
              {isSubmitting ? "Guardando…" : "Guardar borrador"}
            </Button>
          }
          backLabel="Volver al cuestionario"
          backTo={`/admin/cuestionarios/${surveyId}`}
          description="El orden visual de dimensiones, secciones, preguntas y opciones será el orden utilizado por el renderizador."
          eyebrow={`Versión ${version.versionNumber} · Borrador`}
          title="Editor de cuestionario"
        />

        <Card className="mt-8">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              error={errors.title?.message}
              htmlFor="version-title"
              label="Título de la versión"
            >
              <input
                {...register("title")}
                className={inputClassName}
                id="version-title"
              />
            </FormField>
            <FormField
              error={errors.instructions?.message}
              htmlFor="version-instructions"
              label="Instrucciones generales"
            >
              <textarea
                {...register("instructions")}
                className={inputClassName}
                id="version-instructions"
                rows={3}
              />
            </FormField>
          </div>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-mendoza-text">Estructura</h2>
            <p className="mt-1 text-sm text-mendoza-muted">
              El borrador puede guardarse incompleto; la publicación exige una
              estructura completa.
            </p>
          </div>
          <Button
            icon={<CirclePlus aria-hidden="true" size={18} />}
            onClick={() =>
              updateDimensions([
                ...getValues("dimensions"),
                { code: "", title: "", description: "", sections: [] },
              ])
            }
            variant="outline"
          >
            Agregar dimensión
          </Button>
        </div>

        {dimensions.length === 0 ? (
          <Card className="mt-5 border-dashed text-center text-sm text-mendoza-muted">
            Agregá una dimensión para comenzar a construir el cuestionario.
          </Card>
        ) : (
          <div className="mt-5 space-y-6">
            {dimensions.map((dimension, dimensionIndex) => (
              <DimensionEditor
                dimension={dimension}
                dimensionIndex={dimensionIndex}
                dimensions={dimensions}
                errors={errors}
                key={`dimension-${dimensionIndex}`}
                register={register}
                updateDimensions={updateDimensions}
              />
            ))}
          </div>
        )}

        <div className="sticky bottom-4 mt-8 flex justify-end rounded-xl border border-mendoza-border bg-white/95 p-4 shadow-lg backdrop-blur">
          <Button
            disabled={isSubmitting || !isDirty}
            icon={<Save aria-hidden="true" size={18} />}
            type="submit"
          >
            {isSubmitting ? "Guardando…" : "Guardar borrador"}
          </Button>
        </div>
      </form>
    </main>
  );
}

type EditorErrors = ReturnType<typeof useForm<EditorForm>>["formState"]["errors"];
type EditorRegister = ReturnType<typeof useForm<EditorForm>>["register"];

function DimensionEditor({
  dimension,
  dimensionIndex,
  dimensions,
  errors,
  register,
  updateDimensions,
}: {
  dimension: EditorForm["dimensions"][number];
  dimensionIndex: number;
  dimensions: EditorForm["dimensions"];
  errors: EditorErrors;
  register: EditorRegister;
  updateDimensions: (dimensions: EditorForm["dimensions"]) => void;
}) {
  const updateSections = (
    sections: EditorForm["dimensions"][number]["sections"],
  ) => {
    const next = structuredClone(dimensions);
    next[dimensionIndex].sections = sections;
    updateDimensions(next);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mendoza-border pb-4">
        <h3 className="text-xl font-bold text-mendoza-blue">
          Dimensión {dimensionIndex + 1}
        </h3>
        <OrderActions
          canMoveDown={dimensionIndex < dimensions.length - 1}
          canMoveUp={dimensionIndex > 0}
          onMoveDown={() => updateDimensions(move(dimensions, dimensionIndex, 1))}
          onMoveUp={() => updateDimensions(move(dimensions, dimensionIndex, -1))}
          onRemove={() =>
            updateDimensions(dimensions.filter((_, index) => index !== dimensionIndex))
          }
        />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <CompactField
          error={errors.dimensions?.[dimensionIndex]?.code?.message}
          label="Código"
        >
          <input
            {...register(`dimensions.${dimensionIndex}.code`)}
            className={inputClassName}
          />
        </CompactField>
        <CompactField
          error={errors.dimensions?.[dimensionIndex]?.title?.message}
          label="Título"
        >
          <input
            {...register(`dimensions.${dimensionIndex}.title`)}
            className={inputClassName}
          />
        </CompactField>
        <CompactField
          className="md:col-span-2"
          error={errors.dimensions?.[dimensionIndex]?.description?.message}
          label="Descripción"
        >
          <textarea
            {...register(`dimensions.${dimensionIndex}.description`)}
            className={inputClassName}
            rows={2}
          />
        </CompactField>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h4 className="font-bold text-mendoza-text">Secciones</h4>
        <Button
          onClick={() =>
            updateSections([
              ...dimension.sections,
              { code: "", title: "", description: "", questions: [] },
            ])
          }
          variant="outline"
        >
          Agregar sección
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        {dimension.sections.map((section, sectionIndex) => (
          <SectionEditor
            dimensionIndex={dimensionIndex}
            errors={errors}
            key={`section-${sectionIndex}`}
            register={register}
            section={section}
            sectionIndex={sectionIndex}
            sections={dimension.sections}
            updateSections={updateSections}
          />
        ))}
        {dimension.sections.length === 0 && (
          <p className="rounded-lg bg-mendoza-background p-4 text-sm text-mendoza-muted">
            Esta dimensión todavía no tiene secciones.
          </p>
        )}
      </div>
    </Card>
  );
}

function SectionEditor({
  dimensionIndex,
  section,
  sectionIndex,
  sections,
  errors,
  register,
  updateSections,
}: {
  dimensionIndex: number;
  section: EditorForm["dimensions"][number]["sections"][number];
  sectionIndex: number;
  sections: EditorForm["dimensions"][number]["sections"];
  errors: EditorErrors;
  register: EditorRegister;
  updateSections: (sections: EditorForm["dimensions"][number]["sections"]) => void;
}) {
  const updateQuestions = (
    questions: EditorForm["dimensions"][number]["sections"][number]["questions"],
  ) => {
    const next = structuredClone(sections);
    next[sectionIndex].questions = questions;
    updateSections(next);
  };

  return (
    <section className="rounded-xl border border-mendoza-border bg-mendoza-background/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h5 className="font-bold text-mendoza-blue">Sección {sectionIndex + 1}</h5>
        <OrderActions
          canMoveDown={sectionIndex < sections.length - 1}
          canMoveUp={sectionIndex > 0}
          onMoveDown={() => updateSections(move(sections, sectionIndex, 1))}
          onMoveUp={() => updateSections(move(sections, sectionIndex, -1))}
          onRemove={() =>
            updateSections(sections.filter((_, index) => index !== sectionIndex))
          }
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <CompactField
          error={
            errors.dimensions?.[dimensionIndex]?.sections?.[sectionIndex]?.code
              ?.message
          }
          label="Código"
        >
          <input
            {...register(
              `dimensions.${dimensionIndex}.sections.${sectionIndex}.code`,
            )}
            className={inputClassName}
          />
        </CompactField>
        <CompactField
          error={
            errors.dimensions?.[dimensionIndex]?.sections?.[sectionIndex]?.title
              ?.message
          }
          label="Título"
        >
          <input
            {...register(
              `dimensions.${dimensionIndex}.sections.${sectionIndex}.title`,
            )}
            className={inputClassName}
          />
        </CompactField>
        <CompactField
          className="md:col-span-2"
          error={
            errors.dimensions?.[dimensionIndex]?.sections?.[sectionIndex]
              ?.description?.message
          }
          label="Descripción"
        >
          <textarea
            {...register(
              `dimensions.${dimensionIndex}.sections.${sectionIndex}.description`,
            )}
            className={inputClassName}
            rows={2}
          />
        </CompactField>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <h6 className="font-bold text-mendoza-text">Preguntas</h6>
        <Button
          onClick={() => updateQuestions([...section.questions, emptyQuestion()])}
          variant="outline"
        >
          Agregar pregunta
        </Button>
      </div>
      <div className="mt-4 space-y-4">
        {section.questions.map((question, questionIndex) => (
          <QuestionEditor
            dimensionIndex={dimensionIndex}
            errors={errors}
            key={`question-${questionIndex}`}
            question={question}
            questionIndex={questionIndex}
            questions={section.questions}
            register={register}
            sectionIndex={sectionIndex}
            updateQuestions={updateQuestions}
          />
        ))}
        {section.questions.length === 0 && (
          <p className="rounded-lg bg-white p-4 text-sm text-mendoza-muted">
            Esta sección todavía no tiene preguntas.
          </p>
        )}
      </div>
    </section>
  );
}

function QuestionEditor({
  dimensionIndex,
  sectionIndex,
  question,
  questionIndex,
  questions,
  errors,
  register,
  updateQuestions,
}: {
  dimensionIndex: number;
  sectionIndex: number;
  question: EditorForm["dimensions"][number]["sections"][number]["questions"][number];
  questionIndex: number;
  questions: EditorForm["dimensions"][number]["sections"][number]["questions"];
  errors: EditorErrors;
  register: EditorRegister;
  updateQuestions: (
    questions: EditorForm["dimensions"][number]["sections"][number]["questions"],
  ) => void;
}) {
  const base = `dimensions.${dimensionIndex}.sections.${sectionIndex}.questions.${questionIndex}` as const;
  const updateOptions = (
    options: EditorForm["dimensions"][number]["sections"][number]["questions"][number]["options"],
  ) => {
    const next = structuredClone(questions);
    next[questionIndex].options = options;
    updateQuestions(next);
  };
  const isChoice = ["single_choice", "multiple_choice"].includes(question.type);
  const isText = ["short_text", "long_text"].includes(question.type);
  const hasPresentationValidation =
    question.type === "number" ||
    question.type === "multiple_choice" ||
    isText;
  const questionErrors =
    errors.dimensions?.[dimensionIndex]?.sections?.[sectionIndex]?.questions?.[
      questionIndex
    ];

  return (
    <article className="rounded-xl border border-mendoza-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold text-mendoza-text">Pregunta {questionIndex + 1}</p>
        <OrderActions
          canMoveDown={questionIndex < questions.length - 1}
          canMoveUp={questionIndex > 0}
          onMoveDown={() => updateQuestions(move(questions, questionIndex, 1))}
          onMoveUp={() => updateQuestions(move(questions, questionIndex, -1))}
          onRemove={() =>
            updateQuestions(questions.filter((_, index) => index !== questionIndex))
          }
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <CompactField
          error={
            errors.dimensions?.[dimensionIndex]?.sections?.[sectionIndex]
              ?.questions?.[questionIndex]?.code?.message
          }
          label="Código"
        >
          <input {...register(`${base}.code`)} className={inputClassName} />
        </CompactField>
        <CompactField label="Tipo">
          <select
            className={inputClassName}
            onChange={(event) => {
              const next = structuredClone(questions);
              const nextType = event.target.value as SurveyQuestionType;
              next[questionIndex].type = nextType;
              if (!["single_choice", "multiple_choice"].includes(nextType))
                next[questionIndex].options = [];
              next[questionIndex].validation = {
                min:
                  nextType === "number"
                    ? next[questionIndex].validation.min
                    : undefined,
                max:
                  nextType === "number"
                    ? next[questionIndex].validation.max
                    : undefined,
                minLength: ["short_text", "long_text"].includes(nextType)
                  ? next[questionIndex].validation.minLength
                  : undefined,
                maxLength: ["short_text", "long_text"].includes(nextType)
                  ? next[questionIndex].validation.maxLength
                  : undefined,
                maxSelections:
                  nextType === "multiple_choice"
                    ? next[questionIndex].validation.maxSelections
                    : undefined,
                placeholder: ["short_text", "long_text", "number"].includes(
                  nextType,
                )
                  ? next[questionIndex].validation.placeholder
                  : "",
              };
              updateQuestions(next);
            }}
            value={question.type}
          >
            {questionTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </CompactField>
        <label className="flex items-end gap-3 pb-2 text-sm font-semibold text-mendoza-text">
          <input
            {...register(`${base}.required`)}
            className={checkboxClassName}
            type="checkbox"
          />
          Obligatoria
        </label>
        <CompactField
          className="md:col-span-3"
          error={
            errors.dimensions?.[dimensionIndex]?.sections?.[sectionIndex]
              ?.questions?.[questionIndex]?.prompt?.message
          }
          label="Texto de la pregunta"
        >
          <textarea
            {...register(`${base}.prompt`)}
            className={inputClassName}
            rows={2}
          />
        </CompactField>
        <CompactField
          className="md:col-span-3"
          error={questionErrors?.helpText?.message}
          label="Texto de ayuda"
        >
          <textarea
            {...register(`${base}.helpText`)}
            className={inputClassName}
            rows={2}
          />
        </CompactField>
      </div>

      {hasPresentationValidation && (
        <details className="mt-4 rounded-lg border border-mendoza-border p-3">
          <summary className="cursor-pointer text-sm font-semibold text-mendoza-blue">
            Validaciones de presentación
          </summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {question.type === "number" && (
              <>
                <NumberField error={questionErrors?.validation?.min?.message} label="Mínimo" register={register(`${base}.validation.min`, numberRegistration)} />
                <NumberField error={questionErrors?.validation?.max?.message} label="Máximo" register={register(`${base}.validation.max`, numberRegistration)} />
              </>
            )}
            {isText && (
              <>
                <NumberField error={questionErrors?.validation?.minLength?.message} label="Longitud mínima" register={register(`${base}.validation.minLength`, numberRegistration)} />
                <NumberField error={questionErrors?.validation?.maxLength?.message} label="Longitud máxima" register={register(`${base}.validation.maxLength`, numberRegistration)} />
              </>
            )}
            {question.type === "multiple_choice" && (
            <NumberField error={questionErrors?.validation?.maxSelections?.message} label="Máximo de selecciones" register={register(`${base}.validation.maxSelections`, numberRegistration)} />
            )}
            {(question.type === "number" || isText) && (
              <CompactField
                error={questionErrors?.validation?.placeholder?.message}
                label="Placeholder"
              >
                <input
                  {...register(`${base}.validation.placeholder`)}
                  className={inputClassName}
                />
              </CompactField>
            )}
          </div>
        </details>
      )}

      {isChoice && (
        <div className="mt-5 border-t border-mendoza-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-mendoza-text">Opciones</p>
            <Button
              onClick={() =>
                updateOptions([
                  ...question.options,
                  { value: "", label: "", helpText: "" },
                ])
              }
              variant="outline"
            >
              Agregar opción
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {question.options.map((_, optionIndex) => (
              <div
                className="grid gap-3 rounded-lg bg-mendoza-background p-3 md:grid-cols-[0.7fr_1fr_1fr_auto]"
                key={`option-${optionIndex}`}
              >
                <CompactField
                  error={questionErrors?.options?.[optionIndex]?.value?.message}
                  label="Valor"
                >
                  <input
                    {...register(`${base}.options.${optionIndex}.value`)}
                    className={inputClassName}
                  />
                </CompactField>
                <CompactField
                  error={questionErrors?.options?.[optionIndex]?.label?.message}
                  label="Etiqueta"
                >
                  <input
                    {...register(`${base}.options.${optionIndex}.label`)}
                    className={inputClassName}
                  />
                </CompactField>
                <CompactField
                  error={questionErrors?.options?.[optionIndex]?.helpText?.message}
                  label="Ayuda"
                >
                  <input
                    {...register(`${base}.options.${optionIndex}.helpText`)}
                    className={inputClassName}
                  />
                </CompactField>
                <OrderActions
                  canMoveDown={optionIndex < question.options.length - 1}
                  canMoveUp={optionIndex > 0}
                  onMoveDown={() =>
                    updateOptions(move(question.options, optionIndex, 1))
                  }
                  onMoveUp={() =>
                    updateOptions(move(question.options, optionIndex, -1))
                  }
                  onRemove={() =>
                    updateOptions(
                      question.options.filter((_, index) => index !== optionIndex),
                    )
                  }
                />
              </div>
            ))}
            {question.options.length === 0 && (
              <p className="text-sm text-mendoza-muted">
                Podés guardar el borrador sin opciones, pero deberán agregarse
                antes de publicar.
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function CompactField({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-semibold text-mendoza-text ${className}`}>
      {label}
      <span className="mt-1 block font-normal">{children}</span>
      {error && (
        <span className="mt-1 block font-normal text-mendoza-error">{error}</span>
      )}
    </label>
  );
}

function NumberField({
  label,
  error,
  register,
}: {
  label: string;
  error?: string;
  register: ReturnType<EditorRegister>;
}) {
  return (
    <CompactField error={error} label={label}>
      <input {...register} className={inputClassName} type="number" />
    </CompactField>
  );
}

function OrderActions({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        aria-label="Mover hacia arriba"
        className="rounded-lg p-2 text-mendoza-blue hover:bg-mendoza-blue-soft disabled:opacity-30"
        disabled={!canMoveUp}
        onClick={onMoveUp}
        type="button"
      >
        <ArrowUp aria-hidden="true" size={16} />
      </button>
      <button
        aria-label="Mover hacia abajo"
        className="rounded-lg p-2 text-mendoza-blue hover:bg-mendoza-blue-soft disabled:opacity-30"
        disabled={!canMoveDown}
        onClick={onMoveDown}
        type="button"
      >
        <ArrowDown aria-hidden="true" size={16} />
      </button>
      <button
        aria-label="Eliminar"
        className="rounded-lg p-2 text-mendoza-error hover:bg-red-50"
        onClick={onRemove}
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

const numberRegistration = {
  setValueAs: (value: string) => (value === "" ? undefined : Number(value)),
};

const questionTypes: Array<[SurveyQuestionType, string]> = [
  ["boolean", "Sí / No"],
  ["single_choice", "Selección simple"],
  ["multiple_choice", "Selección múltiple"],
  ["short_text", "Texto corto"],
  ["long_text", "Texto largo"],
  ["number", "Número"],
  ["date", "Fecha"],
];

function move<T>(values: T[], index: number, offset: -1 | 1) {
  const next = [...values];
  const target = index + offset;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function toEditorForm(version: AdminSurveyVersion): EditorForm {
  return {
    title: version.title,
    instructions: version.instructions ?? "",
    dimensions: version.dimensions.map((dimension) => ({
        code: dimension.code,
        title: dimension.title,
        description: dimension.description ?? "",
        sections: dimension.sections.map((section) => ({
          code: section.code,
          title: section.title,
          description: section.description ?? "",
          questions: section.questions.map((question) => ({
            code: question.code,
            type: question.type,
            prompt: question.prompt,
            helpText: question.helpText ?? "",
            required: question.required,
            validation: {
              min: question.validation?.min,
              max: question.validation?.max,
              minLength: question.validation?.minLength,
              maxLength: question.validation?.maxLength,
              maxSelections: question.validation?.maxSelections,
              placeholder: question.validation?.placeholder ?? "",
            },
            options: question.options.map((option) => ({
              value: option.value,
              label: option.label,
              helpText: option.helpText ?? "",
            })),
          })),
        })),
      })),
  };
}

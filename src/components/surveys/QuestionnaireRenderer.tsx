import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import type {
  PublishedSurvey,
  QuestionnaireFormValues,
  SurveyQuestion,
} from "../../types/survey";
import { Button } from "../ui/Button";

type QuestionnaireRendererProps = {
  survey: PublishedSurvey;
  readOnly?: boolean;
  onSubmit?: (answers: QuestionnaireFormValues) => void | Promise<void>;
};

const requiredMessage = "Esta pregunta es obligatoria.";

function questionSchema(question: SurveyQuestion): z.ZodType {
  if (question.type === "multiple_choice") {
    let schema = z.array(z.string());
    if (question.required) schema = schema.min(1, requiredMessage);
    if (question.validation.maxSelections !== undefined) {
      schema = schema.max(
        question.validation.maxSelections,
        `Seleccioná hasta ${question.validation.maxSelections} opciones.`,
      );
    }
    return schema;
  }

  if (question.type === "number") {
    let schema = z.number({ error: "Ingresá un número válido." });
    if (question.validation.min !== undefined) {
      schema = schema.min(
        question.validation.min,
        `El valor mínimo es ${question.validation.min}.`,
      );
    }
    if (question.validation.max !== undefined) {
      schema = schema.max(
        question.validation.max,
        `El valor máximo es ${question.validation.max}.`,
      );
    }
    return z.preprocess(
      (value) => (value === "" || value === undefined ? undefined : Number(value)),
      question.required ? schema : schema.optional(),
    );
  }

  let schema = z.string();
  if (question.required) schema = schema.trim().min(1, requiredMessage);
  if (question.validation.minLength !== undefined) {
    schema = schema.min(
      question.validation.minLength,
      `Ingresá al menos ${question.validation.minLength} caracteres.`,
    );
  }
  if (question.validation.maxLength !== undefined) {
    schema = schema.max(
      question.validation.maxLength,
      `Ingresá hasta ${question.validation.maxLength} caracteres.`,
    );
  }
  return question.required ? schema : schema.optional();
}

export function QuestionnaireRenderer({
  survey,
  readOnly = false,
  onSubmit,
}: QuestionnaireRendererProps) {
  const sections = useMemo(
    () =>
      survey.version.dimensions.flatMap((dimension) =>
        dimension.sections.map((section) => ({ dimension, section })),
      ),
    [survey],
  );
  const validationSchema = useMemo(
    () =>
      z.object(
        Object.fromEntries(
          sections.flatMap(({ section }) =>
            section.questions.map((question) => [
              question.id,
              questionSchema(question),
            ]),
          ),
        ),
      ),
    [sections],
  );
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    trigger,
  } = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(
      validationSchema,
    ) as Resolver<QuestionnaireFormValues>,
    defaultValues: Object.fromEntries(
      sections.flatMap(({ section }) =>
        section.questions.map((question) => [
          question.id,
          question.type === "multiple_choice" ? [] : "",
        ]),
      ),
    ),
  });

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-mendoza-gold bg-white p-6 text-center">
        <Info className="mx-auto text-mendoza-blue" aria-hidden="true" />
        <p className="mt-3 font-semibold text-mendoza-text">
          La versión todavía no contiene secciones.
        </p>
      </div>
    );
  }

  const current = sections[activeSectionIndex];
  const isLastSection = activeSectionIndex === sections.length - 1;
  const progress = ((activeSectionIndex + 1) / sections.length) * 100;

  const goNext = async () => {
    const fieldNames = current.section.questions.map((question) => question.id);
    const isValid = readOnly ? true : await trigger(fieldNames);
    if (isValid) setActiveSectionIndex((index) => index + 1);
  };

  return (
    <form
      className="overflow-hidden rounded-2xl border border-mendoza-border bg-white shadow-sm"
      noValidate
      onSubmit={handleSubmit(async (answers) => onSubmit?.(answers))}
    >
      <header className="border-b border-mendoza-border bg-mendoza-blue-soft p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
              {current.dimension.title}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-mendoza-text">
              {current.section.title}
            </h2>
            {current.section.description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-mendoza-muted">
                {current.section.description}
              </p>
            )}
          </div>
          <p className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-mendoza-blue">
            Sección {activeSectionIndex + 1} de {sections.length}
          </p>
        </div>
        <div
          aria-label={`${Math.round(progress)}% del cuestionario recorrido`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(progress)}
          className="mt-5 h-2 overflow-hidden rounded-full bg-white"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-mendoza-sky transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <fieldset className="space-y-5 p-5 sm:p-6" disabled={readOnly}>
        {current.section.questions.map((question, questionIndex) => (
          <QuestionField
            error={errors[question.id]?.message}
            key={question.id}
            number={questionIndex + 1}
            question={question}
            register={register}
          />
        ))}
      </fieldset>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-mendoza-border bg-mendoza-background p-5 sm:p-6">
        <Button
          disabled={activeSectionIndex === 0}
          icon={<ArrowLeft aria-hidden="true" size={17} />}
          onClick={() => setActiveSectionIndex((index) => index - 1)}
          variant="outline"
        >
          Anterior
        </Button>
        {isLastSection ? (
          readOnly ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-mendoza-muted">
              <CheckCircle2 aria-hidden="true" size={18} />
              Fin de la vista del cuestionario
            </span>
          ) : (
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Procesando…" : "Finalizar"}
            </Button>
          )
        ) : (
          <Button
            icon={<ArrowRight aria-hidden="true" size={17} />}
            onClick={() => void goNext()}
          >
            Siguiente
          </Button>
        )}
      </footer>
    </form>
  );
}

type QuestionFieldProps = {
  question: SurveyQuestion;
  number: number;
  error: unknown;
  register: ReturnType<typeof useForm<QuestionnaireFormValues>>["register"];
};

function QuestionField({
  question,
  number,
  error,
  register,
}: QuestionFieldProps) {
  const inputClass =
    "mt-3 w-full rounded-lg border border-mendoza-border bg-white px-3 py-2.5 outline-none transition focus:border-mendoza-sky focus:ring-2 focus:ring-mendoza-sky/25";
  const errorMessage =
    typeof error === "object" && error && "message" in error
      ? String(error.message)
      : typeof error === "string"
        ? error
        : null;

  return (
    <div className="rounded-xl border border-mendoza-border p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mendoza-blue-soft text-sm font-bold text-mendoza-blue">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="font-semibold leading-6 text-mendoza-text"
            id={`${question.id}-prompt`}
          >
            {question.prompt}
            {question.required && (
              <span className="ml-1 text-mendoza-error" aria-label="obligatoria">
                *
              </span>
            )}
          </p>
          {question.helpText && (
            <p className="mt-1 text-sm leading-5 text-mendoza-muted">
              {question.helpText}
            </p>
          )}

          {question.type === "short_text" && (
            <input
              {...register(question.id)}
              aria-labelledby={`${question.id}-prompt`}
              className={inputClass}
              id={question.id}
              maxLength={question.validation.maxLength}
              placeholder={question.validation.placeholder}
              type="text"
            />
          )}
          {question.type === "long_text" && (
            <textarea
              {...register(question.id)}
              aria-labelledby={`${question.id}-prompt`}
              className={inputClass}
              id={question.id}
              maxLength={question.validation.maxLength}
              placeholder={question.validation.placeholder}
              rows={4}
            />
          )}
          {question.type === "number" && (
            <input
              {...register(question.id)}
              aria-labelledby={`${question.id}-prompt`}
              className={inputClass}
              id={question.id}
              max={question.validation.max}
              min={question.validation.min}
              placeholder={question.validation.placeholder}
              type="number"
            />
          )}
          {question.type === "date" && (
            <input
              {...register(question.id)}
              aria-labelledby={`${question.id}-prompt`}
              className={inputClass}
              id={question.id}
              type="date"
            />
          )}
          {question.type === "boolean" && (
            <div
              aria-labelledby={`${question.id}-prompt`}
              className="mt-3 grid gap-2 sm:grid-cols-2"
              role="group"
            >
              {[
                ["yes", "Sí"],
                ["no", "No"],
              ].map(([value, label]) => (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-mendoza-border p-3 transition hover:border-mendoza-sky"
                  key={value}
                >
                  <input
                    {...register(question.id)}
                    className="h-4 w-4 accent-mendoza-blue"
                    type="radio"
                    value={value}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          )}
          {(question.type === "single_choice" ||
            question.type === "multiple_choice") && (
            <div
              aria-labelledby={`${question.id}-prompt`}
              className="mt-3 grid gap-2"
              role="group"
            >
              {question.options.length === 0 ? (
                <p className="rounded-lg bg-mendoza-background p-3 text-sm text-mendoza-muted">
                  Esta pregunta todavía no tiene opciones configuradas.
                </p>
              ) : (
                question.options.map((option) => (
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-mendoza-border p-3 transition hover:border-mendoza-sky"
                    key={option.id}
                  >
                    <input
                      {...register(question.id)}
                      className="mt-1 h-4 w-4 accent-mendoza-blue"
                      type={
                        question.type === "single_choice" ? "radio" : "checkbox"
                      }
                      value={option.value}
                    />
                    <span>
                      <span className="block text-mendoza-text">
                        {option.label}
                      </span>
                      {option.helpText && (
                        <span className="mt-1 block text-sm text-mendoza-muted">
                          {option.helpText}
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}

          {errorMessage && (
            <p className="mt-2 text-sm font-medium text-mendoza-error" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

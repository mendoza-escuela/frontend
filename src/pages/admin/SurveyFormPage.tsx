import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
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
import {
  checkboxClassName,
  inputClassName,
} from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSurveysService } from "../../services/admin-surveys.service";

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Ingresá un código.")
    .max(80, "Ingresá hasta 80 caracteres.")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Usá letras, números, guiones o guiones bajos.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Ingresá un nombre.")
    .max(255, "Ingresá hasta 255 caracteres."),
  description: z.string().max(5000, "Ingresá hasta 5000 caracteres."),
  isActive: z.boolean(),
});

type SurveyForm = z.infer<typeof schema>;

export function SurveyFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SurveyForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!id) return;
    adminSurveysService
      .findOne(id)
      .then((survey) =>
        reset({
          code: survey.code,
          name: survey.name,
          description: survey.description ?? "",
          isActive: survey.isActive,
        }),
      )
      .catch((error) => setLoadError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [id, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const saved = id
        ? await adminSurveysService.update(id, values)
        : await adminSurveysService.create(values);
      showSuccess(
        isEditing ? "Cuestionario actualizado." : "Cuestionario creado.",
      );
      navigate(`/admin/cuestionarios/${saved.id}`, { replace: true });
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          backLabel="Volver a cuestionarios"
          backTo="/admin/cuestionarios"
          description="La definición general identifica al cuestionario. Las preguntas se administran dentro de sus versiones."
          eyebrow="Cuestionarios"
          title={isEditing ? "Editar cuestionario" : "Nuevo cuestionario"}
        />

        <div className="mt-8">
          {isLoading ? (
            <LoadingState />
          ) : loadError ? (
            <ErrorState message={loadError} />
          ) : (
            <Card>
              <form className="grid gap-5 sm:grid-cols-2" noValidate onSubmit={submit}>
                <FormField
                  alignControl
                  error={errors.code?.message}
                  help={
                    isEditing
                      ? "No podrá cambiarse después de publicar una versión."
                      : undefined
                  }
                  helpPlacement="below"
                  htmlFor="code"
                  label="Código"
                >
                  <input
                    {...register("code")}
                    className={inputClassName}
                    id="code"
                  />
                </FormField>
                <FormField
                  alignControl
                  error={errors.name?.message}
                  htmlFor="name"
                  label="Nombre"
                >
                  <input
                    {...register("name")}
                    className={inputClassName}
                    id="name"
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
                <label className="flex items-center gap-3 text-sm font-semibold text-mendoza-text sm:col-span-2">
                  <input
                    {...register("isActive")}
                    className={checkboxClassName}
                    type="checkbox"
                  />
                  Cuestionario activo
                </label>
                <div className="flex justify-end gap-3 border-t border-mendoza-border pt-5 sm:col-span-2">
                  <Button
                    onClick={() => navigate("/admin/cuestionarios")}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    icon={<Save aria-hidden="true" size={18} />}
                    type="submit"
                  >
                    {isSubmitting ? "Guardando…" : "Guardar"}
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

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CalendarDays,
  Check,
  Mail,
  MapPin,
  Minus,
  Phone,
  Save,
  Users,
  X,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Controller, type Control, useForm } from "react-hook-form";
import { RectificationStatusNotice } from "../../components/schools/RectificationStatusNotice";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { checkboxClassName } from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import {
  legacyCatalogValue,
  officialCatalogLabel,
} from "../../lib/official-catalog";
import {
  schoolRectificationSchema,
  type SchoolRectificationValues,
} from "../../lib/school-form-schema";
import { showError, showSuccess } from "../../lib/toast";
import { schoolPortalService } from "../../services/school-portal.service";
import type {
  SchoolCatalogOption,
  SchoolProfile,
  SchoolRectificationCatalogs,
  SchoolRectificationSnapshot,
} from "../../types/admin-school";

type BooleanFieldName =
  | "hasKiosk"
  | "hasFoodService"
  | "isBoarding"
  | "characteristics.isMultigrade"
  | "characteristics.isInterculturalBilingual";

export function SchoolProfilePage() {
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [catalogs, setCatalogs] = useState<SchoolRectificationCatalogs | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingRemoval, setPendingRemoval] =
    useState<SchoolCatalogOption | null>(null);
  const {
    control,
    getValues,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SchoolRectificationValues>({
    resolver: zodResolver(schoolRectificationSchema),
  });

  useEffect(() => {
    Promise.all([
      schoolPortalService.ownSchool(),
      schoolPortalService.rectificationCatalogs(),
    ])
      .then(([profile, availableCatalogs]) => {
        setSchool(profile);
        setCatalogs(availableCatalogs);
        reset(rectificationValues(profile, availableCatalogs));
      })
      .catch((error) => {
        const message = getHttpErrorMessage(error);
        setLoadError(message);
        showError(message);
      })
      .finally(() => setIsLoading(false));
  }, [reset]);

  if (isLoading) {
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Cargando establecimiento…" />
      </main>
    );
  }

  if (loadError) {
    return <ErrorState message={loadError} />;
  }

  if (!school) {
    return (
      <main className="p-4 sm:p-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-dashed border-mendoza-gold bg-white p-8 text-center text-mendoza-muted">
          Tu cuenta todavía no tiene un establecimiento asociado.
        </section>
      </main>
    );
  }
  if (!catalogs) {
    return (
      <ErrorState message="No se pudieron cargar los catálogos institucionales." />
    );
  }

  const selectedLevels = watch("educationLevels") ?? [];
  const contacts = watch("contacts") ?? [];
  const selectedEducationType = watch("educationLevel");
  const legacyEducationType = legacyCatalogValue(
    catalogs.educationTypes,
    school.educationLevel,
  );
  const savedRespondent = school.contacts?.find(
    ({ type }) => type === "RESPONDENT",
  );
  const removeLevel = (levelId: string) => {
    setValue(
      "educationLevels",
      getValues("educationLevels").filter(
        (selection) => selection.levelId !== levelId,
      ),
      { shouldDirty: true, shouldValidate: true },
    );
  };
  const toggleLevel = (level: SchoolCatalogOption, checked: boolean) => {
    const current = getValues("educationLevels");
    const selection = current.find(({ levelId }) => levelId === level.id);
    if (checked && !selection) {
      const orderById = new Map(
        (catalogs?.educationLevels.items ?? []).map((item, order) => [
          item.id,
          order,
        ]),
      );
      setValue(
        "educationLevels",
        [...current, { levelId: level.id, enrollment: null }].sort(
          (left, right) =>
            (orderById.get(left.levelId) ?? 0) -
            (orderById.get(right.levelId) ?? 0),
        ),
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }
    if (!checked && selection) {
      if (selection.enrollment !== null) setPendingRemoval(level);
      else removeLevel(level.id);
    }
  };

  const submit = handleSubmit(async (values) => {
    if (!officialCatalogLabel(catalogs.educationTypes, values.educationLevel)) {
      const message =
        "Elegí un tipo de educación del catálogo oficial antes de confirmar la ficha.";
      setError(
        "educationLevel",
        { type: "validate", message },
        {
          shouldFocus: true,
        },
      );
      showError(message);
      return;
    }
    if (
      values.hasKiosk === null ||
      values.hasFoodService === null ||
      values.shiftCatalogId === null
    ) {
      showError("Revisá los campos institucionales obligatorios.");
      return;
    }
    const shift = catalogs?.shifts.items.find(
      ({ id }) => id === values.shiftCatalogId,
    );
    const {
      managementType,
      characteristics: formCharacteristics,
      ...rectification
    } = values;
    const characteristics = simpleCharacteristics(formCharacteristics);
    try {
      const profile = await schoolPortalService.rectify({
        ...rectification,
        ...(managementType ? { managementType } : {}),
        shift: shift?.label,
        hasKiosk: values.hasKiosk,
        hasFoodService: values.hasFoodService,
        shiftCatalogId: values.shiftCatalogId,
        ...(characteristics ? { characteristics } : {}),
        contacts: values.contacts.map((contact) => ({
          ...contact,
          position: contact.position || null,
          phone: contact.phone || null,
          email: contact.email || null,
        })),
      });
      setSchool(profile);
      if (catalogs) reset(rectificationValues(profile, catalogs));
      showSuccess(
        (profile.rectification.isEvaluationReady ??
          profile.rectification.isRectified)
          ? `Ficha confirmada para ${profile.rectification.periodYear} y lista para evaluar.`
          : `Ficha confirmada para ${profile.rectification.periodYear}; requiere actualización.`,
      );
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
          Mi establecimiento
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-mendoza-text">
              {school.name}
            </h1>
            <p className="mt-2 text-mendoza-muted">CUE {school.cue}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              school.isActive
                ? "bg-green-50 text-mendoza-success"
                : "bg-red-50 text-mendoza-error"
            }`}
          >
            {school.isActive
              ? "Establecimiento activo"
              : "Establecimiento inactivo"}
          </span>
        </div>

        <RectificationStatus school={school} />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ProfileCard icon={MapPin} title="Ubicación">
            <Definition label="Departamento" value={school.department} />
            <Definition label="Localidad" value={school.locality} />
            <Definition label="Dirección" value={school.address} />
            <Definition label="Código postal" value={school.postalCode} />
          </ProfileCard>

          <ProfileCard icon={Building2} title="Datos educativos">
            <Definition label="Director/a" value={school.directorName} />
            <Definition label="Número" value={school.schoolNumber} />
            <Definition
              label="Niveles estructurados"
              value={
                school.educationLevels.map(({ label }) => label).join(", ") ||
                null
              }
            />
            <Definition
              label="Tipo de educación"
              value={school.educationLevel}
            />
            <Definition label="Gestión" value={school.managementType} />
            <Definition label="Ámbito" value={school.scope} />
            <Definition
              label="Jornada"
              value={school.shiftCatalog?.label ?? school.shift}
            />
            <Definition label="Matrícula total" value={school.enrollment} />
          </ProfileCard>

          <ProfileCard icon={Users} title="Características">
            <Definition
              label="Tiene kiosco"
              value={formatBoolean(school.hasKiosk)}
            />
            <Definition
              label="Tiene comedor o servicio alimentario"
              value={formatBoolean(school.hasFoodService)}
            />
            <Definition
              label="Es albergue"
              value={formatBoolean(school.isBoarding)}
            />
            <Definition
              label="Plurogrado"
              value={formatBoolean(
                booleanCharacteristic(school, "isMultigrade"),
              )}
            />
            <Definition
              label="Intercultural y bilingüe"
              value={formatBoolean(
                booleanCharacteristic(school, "isInterculturalBilingual"),
              )}
            />
          </ProfileCard>

          <ProfileCard icon={Mail} title="Contacto">
            <Definition
              label="Referente responsable"
              value={`${savedRespondent?.firstName ?? school.referentFirstName} ${savedRespondent?.lastName ?? school.referentLastName}`}
            />
            <Definition
              label="Cargo del responsable"
              value={savedRespondent?.position}
            />
            <Definition
              label="Correo del responsable"
              value={savedRespondent?.email ?? school.referentEmail}
            />
            <Definition
              label="Celular del responsable"
              value={savedRespondent?.phone ?? school.referentPhone}
            />
            <Definition label="Correo" value={school.email} icon={Mail} />
            <Definition label="Teléfono" value={school.phone} icon={Phone} />
          </ProfileCard>
        </div>

        <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-mendoza-blue">
            Revisar y confirmar ficha anual
          </h2>
          <p className="mt-2 text-sm text-mendoza-muted">
            Al confirmar se guardará una copia histórica e inmutable con tu
            usuario, fecha y período. Los campos marcados con * deben
            completarse antes de confirmar.
          </p>
          <form
            className="mt-6 grid gap-5 md:grid-cols-2"
            noValidate
            onSubmit={submit}
          >
            <RectificationField
              error={errors.name?.message}
              label="Nombre del establecimiento"
            >
              <input className="field" {...register("name")} />
            </RectificationField>
            <RectificationField error={errors.cue?.message} label="CUE">
              <input className="field" {...register("cue")} />
            </RectificationField>
            <RectificationField
              error={errors.directorName?.message}
              label="Director/a"
            >
              <input className="field" {...register("directorName")} />
            </RectificationField>
            <RectificationField
              error={errors.department?.message}
              label="Departamento"
            >
              <input className="field" {...register("department")} />
            </RectificationField>
            <RectificationField
              error={errors.locality?.message}
              label="Localidad"
            >
              <input className="field" {...register("locality")} />
            </RectificationField>
            <RectificationField
              error={errors.address?.message}
              label="Dirección"
            >
              <input className="field" {...register("address")} />
            </RectificationField>
            <Controller
              control={control}
              name="managementType"
              render={({ field }) => (
                <SearchableSelect
                  allLabel="Sin informar"
                  error={errors.managementType?.message}
                  label="Sector / gestión"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  options={catalogs.managementTypes.map((option) => ({
                    value: option.label,
                    label: option.label,
                  }))}
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="scope"
              render={({ field }) => (
                <SearchableSelect
                  allLabel="Seleccioná un ámbito"
                  error={errors.scope?.message}
                  label="Ámbito *"
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                  options={catalogs.scopes.map((option) => ({
                    value: option.label,
                    label: option.label,
                  }))}
                  value={field.value}
                />
              )}
            />
            <div>
              <Controller
                control={control}
                name="educationLevel"
                render={({ field }) => (
                  <SearchableSelect
                    allLabel="Seleccioná un tipo de educación"
                    error={errors.educationLevel?.message}
                    label="Tipo de educación *"
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    options={catalogs.educationTypes.map((option) => ({
                      value: option.label,
                      label: option.label,
                    }))}
                    selectedLabel={
                      legacyEducationType && field.value === legacyEducationType
                        ? `Valor anterior sin correspondencia: ${legacyEducationType}`
                        : undefined
                    }
                    value={field.value}
                  />
                )}
              />
              {legacyEducationType && (
                <LegacyCatalogNotice
                  legacyValue={legacyEducationType}
                  unresolved={selectedEducationType === legacyEducationType}
                />
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-mendoza-text">
                    Referente responsable
                  </h3>
                  <p className="mt-1 text-sm text-mendoza-muted">
                    Estos datos quedarán congelados en la rectificación y en la
                    presentación de la etapa.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {contacts.map((contact, index) => (
                  <fieldset
                    className="rounded-xl border border-mendoza-border p-4"
                    key={contact.type}
                  >
                    <legend className="px-2 font-bold text-mendoza-blue">
                      Referente responsable
                    </legend>
                    <input
                      type="hidden"
                      {...register(`contacts.${index}.type` as const)}
                    />
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <RectificationField
                        error={errors.contacts?.[index]?.firstName?.message}
                        label="Nombre"
                      >
                        <input
                          className="field"
                          {...register(`contacts.${index}.firstName` as const)}
                        />
                      </RectificationField>
                      <RectificationField
                        error={errors.contacts?.[index]?.lastName?.message}
                        label="Apellido"
                      >
                        <input
                          className="field"
                          {...register(`contacts.${index}.lastName` as const)}
                        />
                      </RectificationField>
                      <RectificationField
                        error={errors.contacts?.[index]?.position?.message}
                        label="Cargo"
                        required={false}
                      >
                        <input
                          className="field"
                          {...register(`contacts.${index}.position` as const)}
                        />
                      </RectificationField>
                      <RectificationField
                        error={errors.contacts?.[index]?.email?.message}
                        label="Correo"
                        required={false}
                      >
                        <input
                          className="field"
                          type="email"
                          {...register(`contacts.${index}.email` as const)}
                        />
                      </RectificationField>
                      <RectificationField label="Teléfono" required={false}>
                        <input
                          className="field"
                          {...register(`contacts.${index}.phone` as const)}
                        />
                      </RectificationField>
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-bold text-mendoza-text">
                Características del establecimiento
              </h3>
              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                <BooleanChoiceField
                  control={control}
                  error={errors.hasKiosk?.message}
                  label="¿Tiene kiosco?"
                  name="hasKiosk"
                  required
                />
                <BooleanChoiceField
                  control={control}
                  error={errors.hasFoodService?.message}
                  label="¿Tiene comedor o servicio alimentario?"
                  name="hasFoodService"
                  required
                />
                <BooleanChoiceField
                  control={control}
                  error={errors.isBoarding?.message}
                  label="¿Es albergue?"
                  name="isBoarding"
                />
                <BooleanChoiceField
                  control={control}
                  error={errors.characteristics?.isMultigrade?.message}
                  label={characteristicLabel(
                    catalogs,
                    "isMultigrade",
                    "¿Es Plurogrado?",
                  )}
                  name="characteristics.isMultigrade"
                />
                <BooleanChoiceField
                  control={control}
                  error={
                    errors.characteristics?.isInterculturalBilingual?.message
                  }
                  label={characteristicLabel(
                    catalogs,
                    "isInterculturalBilingual",
                    "¿Es intercultural y bilingüe?",
                  )}
                  name="characteristics.isInterculturalBilingual"
                />
              </div>
            </div>

            {catalogs?.shifts.available ? (
              <Controller
                control={control}
                name="shiftCatalogId"
                render={({ field }) => (
                  <SearchableSelect
                    allLabel="Seleccioná una jornada"
                    error={errors.shiftCatalogId?.message}
                    label="Jornada *"
                    onBlur={field.onBlur}
                    onChange={(value) => field.onChange(value || null)}
                    options={catalogs.shifts.items
                      .filter(
                        (shift) =>
                          shift.isActive || school.shiftCatalogId === shift.id,
                      )
                      .map((shift) => ({
                        value: shift.id,
                        label: `${shift.label}${!shift.isActive ? " (inactiva)" : ""}`,
                      }))}
                    value={field.value ?? ""}
                  />
                )}
              />
            ) : (
              <div>
                <p className="text-sm font-semibold text-mendoza-text">
                  Jornada
                </p>
                <div className="mt-2">
                  <CatalogUnavailable message={catalogs?.shifts.message} />
                </div>
              </div>
            )}

            <RectificationField
              error={errors.enrollment?.message}
              label="Matrícula total"
              required={false}
            >
              <input
                className="field"
                inputMode="numeric"
                min="0"
                step="1"
                type="number"
                {...register("enrollment", {
                  setValueAs: nullableInteger,
                })}
              />
            </RectificationField>

            <fieldset className="md:col-span-2">
              <legend className="font-bold text-mendoza-text">
                Niveles educativos *
              </legend>
              <p className="mt-1 text-sm text-mendoza-muted">
                Seleccioná todos los niveles que correspondan. La matrícula por
                nivel es opcional y no tiene que coincidir obligatoriamente con
                el total.
              </p>
              {catalogs?.educationLevels.available ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {catalogs.educationLevels.items.map((level) => {
                    const selected = selectedLevels.some(
                      ({ levelId }) => levelId === level.id,
                    );
                    const currentSelection = school.educationLevels.some(
                      ({ levelId }) => levelId === level.id,
                    );
                    return (
                      <label
                        className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-sm transition focus-within:ring-4 focus-within:ring-mendoza-sky/15 ${selected ? "border-mendoza-blue bg-mendoza-blue-soft font-semibold text-mendoza-blue shadow-sm" : "border-mendoza-border bg-white text-mendoza-text hover:border-mendoza-sky"} ${!level.isActive && !currentSelection ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                        key={level.id}
                      >
                        <input
                          checked={selected}
                          className={checkboxClassName}
                          disabled={!level.isActive && !currentSelection}
                          onChange={(event) =>
                            toggleLevel(level, event.target.checked)
                          }
                          type="checkbox"
                        />
                        <span>
                          {level.label}
                          {!level.isActive ? " (inactivo)" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3">
                  <CatalogUnavailable
                    message={catalogs?.educationLevels.message}
                  />
                </div>
              )}
              {(errors.educationLevels?.message ??
                errors.educationLevels?.root?.message) && (
                <p className="mt-2 text-sm text-mendoza-error" role="alert">
                  {errors.educationLevels?.message ??
                    errors.educationLevels?.root?.message}
                </p>
              )}
            </fieldset>

            {selectedLevels.length > 0 && (
              <div className="grid gap-4 rounded-xl bg-mendoza-background p-4 md:col-span-2 sm:grid-cols-2">
                {selectedLevels.map((selection, index) => {
                  const level = catalogs?.educationLevels.items.find(
                    ({ id }) => id === selection.levelId,
                  );
                  return (
                    <RectificationField
                      error={
                        errors.educationLevels?.[index]?.enrollment?.message
                      }
                      key={selection.levelId}
                      label={`Matrícula de ${level?.label ?? "nivel"}`}
                      required={false}
                    >
                      <input
                        className="field"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        type="number"
                        {...register(
                          `educationLevels.${index}.enrollment` as const,
                          { setValueAs: nullableInteger },
                        )}
                      />
                    </RectificationField>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end md:col-span-2">
              <Button
                disabled={isSubmitting}
                icon={<Save size={17} />}
                type="submit"
              >
                {isSubmitting ? "Confirmando…" : "Confirmar ficha anual"}
              </Button>
            </div>
          </form>
        </section>

        <RectificationHistory entries={school.rectifications ?? []} />
      </div>

      <ConfirmDialog
        confirmLabel="Quitar nivel"
        description={`El nivel ${pendingRemoval?.label ?? ""} tiene una matrícula informada. Si lo quitás, ese dato se eliminará únicamente de esta nueva rectificación; el historial anterior no cambiará.`}
        open={Boolean(pendingRemoval)}
        title="¿Quitar el nivel y su matrícula?"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) removeLevel(pendingRemoval.id);
          setPendingRemoval(null);
        }}
      />
    </main>
  );
}

function RectificationStatus({ school }: { school: SchoolProfile }) {
  return (
    <RectificationStatusNotice className="mt-6" status={school.rectification} />
  );
}

function BooleanChoiceField({
  control,
  error,
  label,
  name,
  required = false,
}: {
  control: Control<SchoolRectificationValues>;
  error?: string;
  label: string;
  name: BooleanFieldName;
  required?: boolean;
}) {
  return (
    <fieldset
      aria-invalid={Boolean(error)}
      className={`rounded-2xl border bg-white p-4 transition ${error ? "border-mendoza-error" : "border-mendoza-border"}`}
    >
      <legend className="px-2 text-sm font-bold text-mendoza-text">
        {label}
        {required ? " *" : ""}
      </legend>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div
            className={`mt-2 grid gap-2 ${required ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}
          >
            {[
              { icon: Check, label: "Sí", value: true },
              { icon: X, label: "No", value: false },
              ...(required
                ? []
                : [{ icon: Minus, label: "Sin informar", value: null }]),
            ].map((option) => {
              const selected = field.value === option.value;
              const Icon = option.icon;
              return (
                <label
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-within:ring-4 focus-within:ring-mendoza-sky/15 ${selected ? "border-mendoza-blue bg-mendoza-blue-soft text-mendoza-blue shadow-sm" : "border-mendoza-border bg-white text-mendoza-muted hover:border-mendoza-sky hover:bg-mendoza-background"}`}
                  key={option.label}
                >
                  <input
                    checked={selected}
                    className="sr-only"
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(option.value)}
                    ref={field.ref}
                    type="radio"
                  />
                  <Icon aria-hidden="true" size={17} strokeWidth={2.5} />
                  {option.label}
                </label>
              );
            })}
          </div>
        )}
      />
      {error && (
        <p className="mt-2 text-sm text-mendoza-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function RectificationField({
  label,
  error,
  required = true,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-semibold text-mendoza-text">
      {label}
      {required ? " *" : ""}
      <span className="mt-2 block [&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-mendoza-border [&_.field]:bg-white [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:outline-none focus-within:[&_.field]:border-mendoza-sky">
        {children}
      </span>
      {error && (
        <span
          className="mt-1 block font-normal text-mendoza-error"
          role="alert"
        >
          {error}
        </span>
      )}
    </label>
  );
}

function LegacyCatalogNotice({
  legacyValue,
  unresolved,
}: {
  legacyValue: string;
  unresolved: boolean;
}) {
  return (
    <span
      className={`mt-2 block rounded-lg border p-3 text-sm leading-5 ${
        unresolved
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-mendoza-sky/50 bg-mendoza-blue-soft text-mendoza-blue"
      }`}
      role={unresolved ? "alert" : "status"}
    >
      <strong>Valor anterior sin correspondencia: {legacyValue}.</strong> No
      equivale automáticamente a un tipo de educación. Los niveles educativos se
      informan por separado.{" "}
      {unresolved
        ? "Elegí una opción del catálogo oficial antes de guardar."
        : "La opción oficial seleccionada se aplicará al guardar."}
    </span>
  );
}

function CatalogUnavailable({ message }: { message?: string | null }) {
  return (
    <span className="block rounded-lg border border-mendoza-gold bg-amber-50 p-3 font-normal text-amber-900">
      {message ?? "El catálogo no está disponible."}
    </span>
  );
}

function RectificationHistory({
  entries,
}: {
  entries: SchoolProfile["rectifications"];
}) {
  if (!entries.length) return null;
  return (
    <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 text-mendoza-blue">
        <CalendarDays aria-hidden="true" size={21} />
        <h2 className="text-xl font-bold">Historial de rectificaciones</h2>
      </div>
      <p className="mt-2 text-sm text-mendoza-muted">
        Estas copias son de sólo lectura y conservan las etiquetas vigentes al
        momento de confirmar.
      </p>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <details
            className="rounded-xl border border-mendoza-border p-4"
            key={entry.id}
          >
            <summary className="cursor-pointer font-semibold text-mendoza-text">
              Período {entry.periodYear} · {formatDate(entry.rectifiedAt)}
            </summary>
            <SnapshotDetails snapshot={entry.snapshot} />
          </details>
        ))}
      </div>
    </section>
  );
}

function SnapshotDetails({
  snapshot,
}: {
  snapshot: SchoolRectificationSnapshot;
}) {
  const usesStructuredEducationalProfile = (snapshot.schemaVersion ?? 0) >= 4;
  return (
    <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Definition label="Nombre" value={snapshot.name} />
      <Definition label="CUE" value={snapshot.cue} />
      <Definition label="Director/a" value={snapshot.directorName} />
      <Definition label="Departamento" value={snapshot.department} />
      <Definition label="Localidad" value={snapshot.locality} />
      <Definition label="Dirección" value={snapshot.address} />
      <Definition label="Sector / gestión" value={snapshot.managementType} />
      <Definition label="Ámbito" value={snapshot.scope} />
      {usesStructuredEducationalProfile && (
        <Definition label="Tipo de educación" value={snapshot.educationLevel} />
      )}
      <Definition
        label="Jornada"
        value={snapshot.shiftCatalog?.label ?? snapshot.shift}
      />
      <Definition
        label="Niveles"
        value={
          usesStructuredEducationalProfile
            ? snapshot.educationLevels?.map(({ label }) => label).join(", ")
            : snapshot.educationLevel
        }
      />
      <Definition label="Matrícula total" value={snapshot.enrollmentTotal} />
      <Definition
        label="Tiene kiosco"
        value={formatBoolean(snapshot.hasKiosk)}
      />
      <Definition
        label="Tiene comedor o servicio alimentario"
        value={formatBoolean(snapshot.hasFoodService)}
      />
      <Definition
        label="Es albergue"
        value={formatBoolean(snapshot.isBoarding)}
      />
      <Definition
        label="Plurogrado"
        value={formatBoolean(snapshotCharacteristic(snapshot, "isMultigrade"))}
      />
      <Definition
        label="Intercultural y bilingüe"
        value={formatBoolean(
          snapshotCharacteristic(snapshot, "isInterculturalBilingual"),
        )}
      />
      {snapshot.contacts
        ?.filter(({ type }) => type === "RESPONDENT")
        .map((contact) => {
          const contactLabel = "Referente responsable";
          return (
            <Fragment key={contact.type}>
              <Definition
                label={contactLabel}
                value={`${contact.firstName} ${contact.lastName}`}
              />
              <Definition
                label={`Cargo · ${contactLabel}`}
                value={contact.position}
              />
              <Definition
                label={`Correo · ${contactLabel}`}
                value={contact.email}
              />
              <Definition
                label={`Celular · ${contactLabel}`}
                value={contact.phone}
              />
            </Fragment>
          );
        })}
    </dl>
  );
}

function rectificationValues(
  school: SchoolProfile,
  catalogs: SchoolRectificationCatalogs,
): SchoolRectificationValues {
  const shift = catalogs.shifts.items.find(
    (option) =>
      option.id === school.shiftCatalogId ||
      option.label === school.shift ||
      option.code === school.shift,
  );
  return {
    name: school.name,
    cue: school.cue,
    directorName: school.directorName,
    department: school.department,
    address: school.address,
    locality: school.locality,
    educationLevel:
      officialCatalogLabel(catalogs.educationTypes, school.educationLevel) ??
      school.educationLevel,
    managementType: catalogLabel(
      catalogs.managementTypes,
      school.managementType,
    ),
    scope: catalogLabel(catalogs.scopes, school.scope),
    hasKiosk: school.hasKiosk ?? null,
    hasFoodService: school.hasFoodService ?? null,
    isBoarding: school.isBoarding ?? null,
    characteristics: {
      ...school.characteristics,
      isMultigrade: booleanCharacteristic(school, "isMultigrade"),
      isInterculturalBilingual: booleanCharacteristic(
        school,
        "isInterculturalBilingual",
      ),
    },
    shiftCatalogId: shift?.id ?? null,
    enrollment: school.enrollment ?? null,
    educationLevels: school.educationLevels.map(({ levelId, enrollment }) => ({
      levelId,
      enrollment,
    })),
    contacts: (() => {
      const saved = school.contacts ?? [];
      const respondent = saved.find(({ type }) => type === "RESPONDENT");
      return [
        {
          type: "RESPONDENT" as const,
          firstName: respondent?.firstName ?? school.referentFirstName,
          lastName: respondent?.lastName ?? school.referentLastName,
          position: respondent?.position ?? "",
          phone: respondent?.phone ?? school.referentPhone ?? "",
          email: respondent?.email ?? school.referentEmail ?? "",
        },
      ];
    })(),
    expectedUpdatedAt: school.updatedAt,
  };
}

function catalogLabel(
  options: SchoolRectificationCatalogs["managementTypes"],
  current: string,
) {
  return (
    options.find(({ code, label }) => code === current || label === current)
      ?.label ?? ""
  );
}

function characteristicLabel(
  catalogs: SchoolRectificationCatalogs,
  code: string,
  fallback: string,
) {
  return (
    catalogs.characteristics.find((option) => option.code === code)?.label ??
    fallback
  );
}

function booleanCharacteristic(school: SchoolProfile, code: string) {
  const value = school.characteristics[code];
  return typeof value === "boolean" ? value : null;
}

function snapshotCharacteristic(
  snapshot: SchoolRectificationSnapshot,
  code: string,
) {
  const value = snapshot.characteristics?.[code];
  return typeof value === "boolean" ? value : null;
}

function simpleCharacteristics(
  characteristics: SchoolRectificationValues["characteristics"],
) {
  return {
    isMultigrade: characteristics.isMultigrade ?? null,
    isInterculturalBilingual: characteristics.isInterculturalBilingual ?? null,
  };
}

const nullableInteger = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : Number(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

function ProfileCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-mendoza-blue">
        <Icon aria-hidden="true" size={21} />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Definition({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  icon?: typeof Mail;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-mendoza-muted">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2 break-words text-sm text-mendoza-text">
        {Icon && <Icon aria-hidden="true" size={15} />}
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </dd>
    </div>
  );
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value ? "Sí" : "No";
}

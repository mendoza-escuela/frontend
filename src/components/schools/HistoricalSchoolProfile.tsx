import { formatDateTime } from "../../lib/format";
import type { HistoricalSchoolProfile as HistoricalSchoolProfileData } from "../../types/admin-school-result-detail";

type ProfileField = { label: string; value: string };

export function HistoricalSchoolProfile({
  profile,
}: {
  profile: HistoricalSchoolProfileData;
}) {
  const educationLevels = Array.isArray(profile.educationLevels)
    ? profile.educationLevels
    : [];
  const responsibleContact = Array.isArray(profile.contacts)
    ? profile.contacts.find(({ type }) => type === "RESPONDENT")
    : undefined;
  const characteristics = profile.characteristics ?? {};
  const additionalCharacteristics = Object.entries(characteristics)
    .filter(
      ([key]) =>
        !["isMultigrade", "isInterculturalBilingual"].includes(key),
    )
    .map(([key, value]) => ({
      label: humanizeKey(key),
      value: displayValue(value),
    }));

  return (
    <div className="mt-6 space-y-6">
      <ProfileSection
        fields={[
          { label: "CUE", value: displayValue(profile.cue) },
          { label: "Número de escuela", value: displayValue(profile.schoolNumber) },
          { label: "Nombre", value: displayValue(profile.name) },
          { label: "Director/a", value: displayValue(profile.directorName) },
          { label: "Correo", value: displayValue(profile.email) },
          { label: "Teléfono", value: displayValue(profile.phone) },
        ]}
        title="Identificación"
      />

      <ProfileSection
        fields={[
          { label: "Departamento", value: displayValue(profile.department) },
          { label: "Localidad", value: displayValue(profile.locality) },
          { label: "Domicilio", value: displayValue(profile.address) },
          { label: "Código postal", value: displayValue(profile.postalCode) },
          { label: "Ámbito", value: displayValue(profile.scope) },
          { label: "Sector / gestión", value: displayValue(profile.managementType) },
        ]}
        title="Ubicación y gestión"
      />

      <section aria-labelledby="historical-education-title">
        <h3 className="text-base font-bold text-mendoza-blue" id="historical-education-title">
          Perfil educativo
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileDatum label="Tipo de educación" value={displayValue(profile.educationLevel)} />
          <ProfileDatum label="Jornada" value={displayValue(profile.shiftCatalog?.label ?? profile.shift)} />
          <ProfileDatum label="Matrícula total" value={displayValue(profile.enrollmentTotal)} />
        </dl>
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-mendoza-muted">
            Niveles educativos
          </p>
          {educationLevels.length ? (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {educationLevels.map((level) => (
                <li className="flex items-center justify-between gap-3 rounded-xl border border-mendoza-border bg-mendoza-background px-4 py-3 text-sm" key={level.id || level.code}>
                  <span className="font-semibold text-mendoza-text">
                    {level.label || humanizeKey(level.code)}
                  </span>
                  <span className="text-mendoza-muted">
                    {level.enrollment === null ? "Matrícula no informada" : `${level.enrollment} estudiantes`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-mendoza-muted">No informado</p>
          )}
        </div>
      </section>

      <ProfileSection
        fields={[
          { label: "Tiene kiosco", value: displayValue(profile.hasKiosk) },
          { label: "Tiene comedor o servicio alimentario", value: displayValue(profile.hasFoodService) },
          { label: "Es albergue", value: displayValue(profile.isBoarding) },
          { label: "Plurigrado", value: displayValue(characteristics.isMultigrade) },
          { label: "Intercultural y bilingüe", value: displayValue(characteristics.isInterculturalBilingual) },
          ...additionalCharacteristics,
        ]}
        title="Características del establecimiento"
      />

      <ProfileSection
        fields={[
          {
            label: "Nombre y apellido",
            value: responsibleContact
              ? displayValue(`${responsibleContact.firstName} ${responsibleContact.lastName}`.trim())
              : "No informado",
          },
          { label: "Cargo", value: displayValue(responsibleContact?.position) },
          { label: "Celular", value: displayValue(responsibleContact?.phone) },
          { label: "Correo", value: displayValue(responsibleContact?.email) },
        ]}
        title="Referente responsable"
      />

      <ProfileSection
        fields={[
          {
            label: "Fecha de captura",
            value: profile.capturedAt ? formatDateTime(profile.capturedAt) : "No informada",
          },
        ]}
        title="Registro histórico"
      />
    </div>
  );
}

function ProfileSection({ fields, title }: { fields: ProfileField[]; title: string }) {
  const sectionId = `historical-${title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={sectionId}>
      <h3 className="text-base font-bold text-mendoza-blue" id={sectionId}>{title}</h3>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => <ProfileDatum {...field} key={field.label} />)}
      </dl>
    </section>
  );
}

function ProfileDatum({ label, value }: ProfileField) {
  return (
    <div className="min-w-0 rounded-xl bg-mendoza-background px-4 py-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-mendoza-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-mendoza-text">{value}</dd>
    </div>
  );
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "No informado";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (firstLetter) => firstLetter.toUpperCase());
}

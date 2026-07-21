import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  KeyRound,
  Pencil,
  Save,
  ShieldCheck,
  ShieldOff,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSchoolsService } from "../../services/admin-schools.service";
import { adminUsersService } from "../../services/admin-users.service";
import type { SchoolDetail } from "../../types/admin-school";
import type { SchoolUserSummary } from "../../types/admin-school";

export function SchoolDetailPage() {
  const { id } = useParams();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [eligibleUsers, setEligibleUsers] = useState<SchoolUserSummary[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const detail = await adminSchoolsService.findOne(id);
      setSchool(detail);
      setSelectedUserId(detail.users[0]?.id ?? "");
      const users = await adminUsersService.list({
        role: "school",
        isActive: true,
        search: appliedUserSearch,
        page: 1,
        limit: 100,
      });
      const candidates: SchoolUserSummary[] = users.items
        .filter((user) => !user.school || user.school.id === id)
        .map(({ id: userId, firstName, lastName, email }) => ({ id: userId, firstName, lastName, email }));
      for (const current of detail.users) if (!candidates.some((candidate) => candidate.id === current.id)) candidates.unshift(current);
      setEligibleUsers(candidates);
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  }, [appliedUserSearch, id]);
  useEffect(() => {
    void load();
  }, [load]);
  const changeStatus = async () => {
    if (!school) return;
    try {
      setSchool(
        await adminSchoolsService.setStatus(school.id, !school.isActive),
      );
      showSuccess(
        school.isActive
          ? "Colegio desactivado; se bloquearon nuevas evaluaciones."
          : "Colegio activado.",
      );
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  };
  const assign = async () => {
    if (!school) return;
    setSaving(true);
    try {
      setSchool(
        await adminSchoolsService.assignUser(school.id, selectedUserId || null),
      );
      showSuccess(
        selectedUserId
          ? "Usuario asociado y cambio registrado."
          : "Usuario desvinculado y cambio registrado.",
      );
      await load();
    } catch (error) {
      showError(getHttpErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  if (!school)
    return <main className="p-8 text-[#000F9F]">Cargando detalle…</main>;
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#000F9F]"
          to="/admin/colegios"
        >
          <ArrowLeft size={17} />
          Volver al padrón
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-[#1F2937]">
                {school.name}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${school.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {school.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="mt-2 text-[#6B7280]">
              CUE {school.cue}
              {school.schoolNumber ? ` · N.º ${school.schoolNumber}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#000F9F] px-4 text-sm font-semibold text-[#000F9F]"
              to={`/admin/colegios/${school.id}/editar`}
            >
              <Pencil size={17} />
              Editar
            </Link>
            <Button
              icon={
                school.isActive ? (
                  <ShieldOff size={17} />
                ) : (
                  <ShieldCheck size={17} />
                )
              }
              onClick={() => void changeStatus()}
              variant={school.isActive ? "outline" : "primary"}
            >
              {school.isActive ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </div>
        {!school.isActive && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            El colegio conserva todo su historial, pero no puede iniciar nuevas
            evaluaciones mientras esté inactivo.
          </div>
        )}
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="text-xl font-bold text-[#000F9F]">
              Datos institucionales
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Datum
                label="Ubicación"
                value={`${school.address}, ${school.locality}, ${school.department}`}
              />
              <Datum label="Nivel" value={school.educationLevel} />
              <Datum label="Gestión" value={school.managementType} />
              <Datum
                label="Ámbito / Jornada"
                value={
                  [school.scope, school.shift].filter(Boolean).join(" · ") ||
                  "Sin informar"
                }
              />
              <Datum
                label="Matrícula"
                value={school.enrollment.toLocaleString("es-AR")}
              />
              <Datum
                label="Contacto"
                value={
                  [school.email, school.phone].filter(Boolean).join(" · ") ||
                  "Sin informar"
                }
              />
              <Datum
                label="Referente"
                value={`${school.referentFirstName} ${school.referentLastName}`}
              />
              <Datum
                label="Contacto referente"
                value={
                  [school.referentEmail, school.referentPhone]
                    .filter(Boolean)
                    .join(" · ") || "Sin informar"
                }
              />
              <Datum
                label="Última actualización"
                value={date(school.updatedAt)}
              />
            </dl>
            {Object.keys(school.characteristics).length > 0 && (
              <div className="mt-5 border-t border-[#E5E7EB] pt-4">
                <h3 className="font-semibold">Características</h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(school.characteristics).map(
                    ([key, value]) => (
                      <Datum key={key} label={key} value={String(value)} />
                    ),
                  )}
                </dl>
              </div>
            )}
          </section>
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound className="text-[#000F9F]" />
              <h2 className="text-xl font-bold text-[#000F9F]">
                Usuario Colegio
              </h2>
            </div>
            {school.users.length ? (
              school.users.map((user) => (
                <div className="mt-4 rounded-xl bg-[#F7F4EF] p-4" key={user.id}>
                  <p className="font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="break-all text-sm text-[#6B7280]">
                    {user.email}
                  </p>
                  <p className="mt-2 text-xs">
                    {user.isActive ? "Activo" : "Bloqueado"} ·{" "}
                    {user.lastLoginAt
                      ? `Último acceso ${date(user.lastLoginAt)}`
                      : "Sin accesos"}
                  </p>
                </div>
              ))
            ) : (
              <p className="mt-4 text-sm text-[#6B7280]">
                No hay un usuario asociado.
              </p>
            )}
            <label className="mt-5 block text-sm font-semibold">
              Buscar usuario disponible
              <span className="mt-2 flex gap-2">
                <input className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 font-normal" onChange={(event) => setUserSearch(event.target.value)} placeholder="Nombre o correo" value={userSearch} />
                <Button onClick={() => setAppliedUserSearch(userSearch.trim())} variant="outline">Buscar</Button>
              </span>
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Asociar o reemplazar
              <select
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5"
                onChange={(event) => setSelectedUserId(event.target.value)}
                value={selectedUserId}
              >
                <option value="">Sin usuario</option>
                {eligibleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.lastName}, {user.firstName} · {user.email}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="mt-3 w-full"
              disabled={saving}
              icon={<Save size={17} />}
              onClick={() => void assign()}
            >
              {saving ? "Guardando…" : "Guardar asociación"}
            </Button>
            <p className="mt-2 text-xs text-[#6B7280]">
              Sólo se muestran usuarios activos con rol Colegio que no
              pertenecen a otro establecimiento.
            </p>
          </section>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Unavailable
            icon={<CalendarDays />}
            title="Campañas"
            message={school.campaigns.message}
          />
          <Unavailable
            icon={<ClipboardCheck />}
            title="Evaluaciones"
            message={school.evaluations.message}
          />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Timeline
            title="Historial de asociaciones"
            icon={<Users />}
            empty="Todavía no hay cambios de asociación."
            entries={school.assignmentHistory.map((entry) => ({
              id: entry.id,
              date: entry.createdAt,
              title:
                entry.action === "assigned"
                  ? "Usuario asociado"
                  : entry.action === "replaced"
                    ? "Usuario reemplazado"
                    : "Usuario desvinculado",
              detail: `${entry.previousUser?.email ?? "Sin usuario"} → ${entry.newUser?.email ?? "Sin usuario"}`,
            }))}
          />
          <Timeline
            title="Accesos recientes"
            icon={<KeyRound />}
            empty="No hay accesos registrados."
            entries={school.accesses.map((entry) => ({
              id: entry.id,
              date: entry.createdAt,
              title: entry.user?.email ?? "Usuario del colegio",
              detail: entry.revokedAt
                ? "Sesión revocada"
                : new Date(entry.expiresAt) < new Date()
                  ? "Sesión vencida"
                  : "Sesión vigente",
            }))}
          />
        </div>
        <Timeline
          className="mt-5"
          title="Auditoría del colegio"
          icon={<ClipboardCheck />}
          empty="No hay acciones auditadas."
          entries={school.audits.map((entry) => ({
            id: entry.id,
            date: entry.createdAt,
            title: auditLabel(entry.action),
            detail: `${Object.keys(entry.changes).length} dato(s) registrado(s)`,
          }))}
        />
      </div>
    </main>
  );
}
function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-[#1F2937]">{value}</dd>
    </div>
  );
}
function Unavailable({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[#C8A977] bg-white p-5">
      <div className="flex items-center gap-2 text-[#000F9F]">
        {icon}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p className="mt-3 text-sm text-[#6B7280]">{message}</p>
    </section>
  );
}
function Timeline({
  title,
  icon,
  entries,
  empty,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  entries: Array<{ id: string; date: string; title: string; detail: string }>;
  empty: string;
  className?: string;
}) {
  return (
    <section
      className={`${className} rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm`}
    >
      <div className="flex items-center gap-2 text-[#000F9F]">
        {icon}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {entries.length ? (
        <ul className="mt-4 max-h-80 space-y-3 overflow-auto">
          {entries.map((entry) => (
            <li className="border-l-2 border-[#3CB4E5] pl-3" key={entry.id}>
              <p className="font-semibold text-[#1F2937]">{entry.title}</p>
              <p className="break-all text-sm text-[#6B7280]">{entry.detail}</p>
              <time className="text-xs text-[#6B7280]">{date(entry.date)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[#6B7280]">{empty}</p>
      )}
    </section>
  );
}
const date = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const auditLabel = (action: string) =>
  ({
    SCHOOL_CREATED: "Colegio creado",
    SCHOOL_UPDATED: "Datos modificados",
    SCHOOL_ACTIVATED: "Colegio activado",
    SCHOOL_DEACTIVATED: "Colegio desactivado",
    SCHOOL_USER_ASSIGNED: "Usuario asociado",
    SCHOOL_USER_REPLACED: "Usuario reemplazado",
    SCHOOL_USER_UNASSIGNED: "Usuario desvinculado",
  })[action] ?? action;

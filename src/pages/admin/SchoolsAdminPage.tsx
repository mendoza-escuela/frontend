import {
  Download,
  Eye,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import {
  adminSchoolsService,
  type SchoolFilters,
} from "../../services/admin-schools.service";
import type {
  SchoolFilterOptions,
  SchoolListItem,
  SchoolListResponse,
} from "../../types/admin-school";

const emptyList: SchoolListResponse = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};
const emptyOptions: SchoolFilterOptions = {
  departments: [],
  localities: [],
  educationLevels: [],
  managementTypes: [],
  scopes: [],
  shifts: [],
};

export function SchoolsAdminPage() {
  const [filters, setFilters] = useState<SchoolFilters>({
    page: 1,
    limit: 20,
    isActive: "",
  });
  const [draft, setDraft] = useState<SchoolFilters>({ isActive: "" });
  const [schools, setSchools] = useState(emptyList);
  const [options, setOptions] = useState(emptyOptions);
  const [loading, setLoading] = useState(true);
  const listRequest = useRef<AbortController | null>(null);
  const load = async (next = filters) => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(true);
    try {
      setSchools(await adminSchoolsService.list(next, controller.signal));
    } catch (error) {
      if (!controller.signal.aborted) showError(getHttpErrorMessage(error));
    } finally {
      if (listRequest.current === controller) setLoading(false);
    }
  };
  useEffect(() => {
    void Promise.all([
      load(),
      adminSchoolsService
        .filters()
        .then(setOptions)
        .catch((error) => showError(getHttpErrorMessage(error))),
    ]);
    return () => listRequest.current?.abort();
  }, []);
  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const next = { ...draft, page: 1, limit: 20 };
    setFilters(next);
    void load(next);
  };
  const page = (number: number) => {
    const next = { ...filters, page: number };
    setFilters(next);
    void load(next);
  };
  const status = async (school: SchoolListItem) => {
    try {
      await adminSchoolsService.setStatus(school.id, !school.isActive);
      showSuccess(
        school.isActive
          ? "Colegio desactivado. No podrá iniciar nuevas evaluaciones."
          : "Colegio activado.",
      );
      await load();
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  };
  const exportRegistry = async (format: "csv" | "xlsx") => {
    try {
      await adminSchoolsService.export(filters, format);
      showSuccess(`Padrón ${format.toUpperCase()} exportado y auditado.`);
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  };
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
              Padrón institucional
            </p>
            <h1 className="mt-1 text-3xl font-bold text-mendoza-text">Colegios</h1>
            <p className="mt-2 text-mendoza-muted">
              {schools.pagination.total} establecimientos encontrados
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<Download size={17} />}
              onClick={() => void exportRegistry("csv")}
              variant="outline"
            >
              CSV
            </Button>
            <Button
              icon={<FileSpreadsheet size={17} />}
              onClick={() => void exportRegistry("xlsx")}
              variant="outline"
            >
              Excel
            </Button>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-mendoza-blue bg-white px-4 text-sm font-semibold text-mendoza-blue"
              to="/admin/colegios/importar"
            >
              <Upload size={17} />
              Importar
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-mendoza-blue px-4 text-sm font-semibold text-white"
              to="/admin/colegios/nuevo"
            >
              <Plus size={17} />
              Nuevo colegio
            </Link>
          </div>
        </div>
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-mendoza-border bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4"
          onSubmit={apply}
        >
          <Filter label="Buscar">
            <input
              className="field"
              onChange={(e) => setDraft({ ...draft, search: e.target.value })}
              placeholder="CUE, nombre o número"
              value={draft.search ?? ""}
            />
          </Filter>
          <SelectFilter
            label="Departamento"
            name="department"
            values={options.departments}
            value={draft.department}
            setDraft={setDraft}
            draft={draft}
          />
          <SelectFilter
            label="Localidad"
            name="locality"
            values={options.localities}
            value={draft.locality}
            setDraft={setDraft}
            draft={draft}
          />
          <SelectFilter
            label="Nivel"
            name="educationLevel"
            values={options.educationLevels}
            value={draft.educationLevel}
            setDraft={setDraft}
            draft={draft}
          />
          <SelectFilter
            label="Gestión"
            name="managementType"
            values={options.managementTypes}
            value={draft.managementType}
            setDraft={setDraft}
            draft={draft}
          />
          <SelectFilter
            label="Ámbito"
            name="scope"
            values={options.scopes}
            value={draft.scope}
            setDraft={setDraft}
            draft={draft}
          />
          <Filter label="Estado">
            <select
              className="field"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  isActive:
                    e.target.value === "" ? "" : e.target.value === "true",
                })
              }
              value={String(draft.isActive ?? "")}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </Filter>
          <Button
            className="self-end"
            icon={<Search size={17} />}
            type="submit"
          >
            Aplicar filtros
          </Button>
        </form>
        {loading ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center text-mendoza-muted">
            Cargando padrón…
          </div>
        ) : schools.items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-mendoza-border bg-white p-8 text-center text-mendoza-muted">
            No hay colegios para los filtros seleccionados.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:hidden">
              {schools.items.map((school) => (
                <SchoolCard key={school.id} school={school} status={status} />
              ))}
            </div>
            <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-mendoza-border bg-white shadow-sm md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-mendoza-blue text-white">
                  <tr>
                    {[
                      "CUE / Colegio",
                      "Ubicación",
                      "Nivel / Gestión",
                      "Matrícula",
                      "Estado",
                      "Acciones",
                    ].map((header) => (
                      <th className="px-4 py-3" key={header}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-mendoza-border">
                  {schools.items.map((school) => (
                    <tr key={school.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{school.name}</p>
                        <p className="text-mendoza-muted">
                          CUE {school.cue}
                          {school.schoolNumber
                            ? ` · N.º ${school.schoolNumber}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {school.locality}, {school.department}
                      </td>
                      <td className="px-4 py-3">
                        {school.educationLevel}
                        <br />
                        <span className="text-mendoza-muted">
                          {school.managementType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {school.enrollment.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3">
                        <Status active={school.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <Actions school={school} status={status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <PaginationControls
          loading={loading}
          onPageChange={page}
          pagination={schools.pagination}
        />
      </div>
    </main>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-semibold text-mendoza-text">
      {label}
      <span className="mt-1 block [&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-mendoza-border [&_.field]:px-3 [&_.field]:py-2.5">
        {children}
      </span>
    </label>
  );
}
function SelectFilter({
  label,
  name,
  values,
  value,
  draft,
  setDraft,
}: {
  label: string;
  name: keyof SchoolFilters;
  values: string[];
  value?: string;
  draft: SchoolFilters;
  setDraft: React.Dispatch<React.SetStateAction<SchoolFilters>>;
}) {
  return (
    <Filter label={label}>
      <select
        className="field"
        onChange={(e) => setDraft({ ...draft, [name]: e.target.value })}
        value={value ?? ""}
      >
        <option value="">Todos</option>
        {values.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </Filter>
  );
}
function Status({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
function Actions({
  school,
  status,
}: {
  school: SchoolListItem;
  status: (school: SchoolListItem) => Promise<void>;
}) {
  return (
    <div className="flex gap-1">
      <Link
        aria-label={`Ver ${school.name}`}
        className="rounded-lg p-2 text-mendoza-blue hover:bg-mendoza-blue-soft"
        to={`/admin/colegios/${school.id}`}
      >
        <Eye size={17} />
      </Link>
      <Link
        aria-label={`Editar ${school.name}`}
        className="rounded-lg p-2 text-mendoza-blue hover:bg-mendoza-blue-soft"
        to={`/admin/colegios/${school.id}/editar`}
      >
        <Pencil size={17} />
      </Link>
      <button
        aria-label={
          school.isActive
            ? `Desactivar ${school.name}`
            : `Activar ${school.name}`
        }
        className={`rounded-lg p-2 ${school.isActive ? "text-mendoza-error" : "text-green-700"}`}
        onClick={() => void status(school)}
        type="button"
      >
        {school.isActive ? <ShieldOff size={17} /> : <ShieldCheck size={17} />}
      </button>
    </div>
  );
}
function SchoolCard({
  school,
  status,
}: {
  school: SchoolListItem;
  status: (school: SchoolListItem) => Promise<void>;
}) {
  return (
    <article className="rounded-2xl border border-mendoza-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-mendoza-text">{school.name}</h2>
          <p className="text-sm text-mendoza-muted">CUE {school.cue}</p>
        </div>
        <Status active={school.isActive} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-mendoza-muted">Ubicación</dt>
          <dd>
            {school.locality}, {school.department}
          </dd>
        </div>
        <div>
          <dt className="text-mendoza-muted">Nivel</dt>
          <dd>{school.educationLevel}</dd>
        </div>
      </dl>
      <div className="mt-4 border-t border-mendoza-border pt-2">
        <Actions school={school} status={status} />
      </div>
    </article>
  );
}

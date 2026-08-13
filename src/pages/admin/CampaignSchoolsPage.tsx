import {
  CheckSquare,
  CircleCheckBig,
  Filter,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { inputClassName } from "../../components/ui/form-styles";
import { getHttpErrorMessage } from "../../lib/http-error";
import { formatDateTime } from "../../lib/format";
import { showError, showSuccess } from "../../lib/toast";
import { adminCampaignsService } from "../../services/admin-campaigns.service";
import { adminSchoolsService } from "../../services/admin-schools.service";
import type {
  AdminCampaign,
  CampaignSchoolAssignment,
  CampaignSchoolFilters,
  CampaignSchoolPreview,
  CampaignSchoolSelection,
  CampaignSchoolOptionsResponse,
  CampaignSchoolsResponse,
} from "../../types/admin-campaign";
import type { SchoolFilterOptions } from "../../types/admin-school";

const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
const emptyOptions: CampaignSchoolOptionsResponse = {
  items: [],
  pagination: emptyPagination,
  summary: { matched: 0, assigned: 0, unassigned: 0 },
};
const emptyAssigned: CampaignSchoolsResponse<CampaignSchoolAssignment> = {
  items: [],
  pagination: emptyPagination,
};

type PendingConfirmation = {
  selection: CampaignSchoolSelection;
  preview: CampaignSchoolPreview;
} | null;

export function CampaignSchoolsPage() {
  const { id = "" } = useParams();
  const [campaign, setCampaign] = useState<AdminCampaign | null>(null);
  const [catalogs, setCatalogs] = useState<SchoolFilterOptions | null>(null);
  const catalogsRequest = useRef<Promise<SchoolFilterOptions> | null>(null);
  const [options, setOptions] = useState(emptyOptions);
  const [assigned, setAssigned] = useState(emptyAssigned);
  const [assignedPage, setAssignedPage] = useState(1);
  const [filters, setFilters] = useState<CampaignSchoolFilters>({
    page: 1,
    limit: 20,
    isActive: true,
  });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingConfirmation>(null);
  const [removePending, setRemovePending] = useState<CampaignSchoolAssignment | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      catalogsRequest.current ??= adminSchoolsService.filters().catch((requestError) => {
        catalogsRequest.current = null;
        throw requestError;
      });
      const [campaignData, optionData, assignedData, filterData] =
        await Promise.all([
          adminCampaignsService.findOne(id),
          adminCampaignsService.schoolOptions(id, filters),
          adminCampaignsService.assignedSchools(id, {
            page: assignedPage,
            limit: 20,
          }),
          catalogsRequest.current,
        ]);
      setCampaign(campaignData);
      setOptions(optionData);
      setAssigned(assignedData);
      setCatalogs(filterData);
    } catch (loadError) {
      setError(getHttpErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [assignedPage, filters, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectionFilters = useMemo(() => {
    const { page: _page, limit: _limit, ...selection } = filters;
    void _page;
    void _limit;
    return selection;
  }, [filters]);

  const preview = async (selection: CampaignSchoolSelection) => {
    setProcessing(true);
    try {
      const result = await adminCampaignsService.previewSchools(id, selection);
      setPending({ selection, preview: result });
    } catch (previewError) {
      showError(getHttpErrorMessage(previewError));
    } finally {
      setProcessing(false);
    }
  };

  const confirmAssignment = async () => {
    if (!pending) return;
    setProcessing(true);
    try {
      const result = await adminCampaignsService.assignSchools(
        id,
        pending.selection,
      );
      showSuccess(assignmentSuccessMessage(result.assigned, campaign?.status));
      setPending(null);
      setSelected(new Set());
      setAssignedPage(1);
      await load();
    } catch (assignError) {
      showError(getHttpErrorMessage(assignError));
    } finally {
      setProcessing(false);
    }
  };

  const removeAssignment = async () => {
    if (!removePending) return;
    setProcessing(true);
    try {
      await adminCampaignsService.removeSchool(
        id,
        removePending.school.id,
        "Removida desde la administración de etapa",
      );
      showSuccess("La escuela fue quitada de la etapa.");
      setRemovePending(null);
      await load();
    } catch (removeError) {
      showError(getHttpErrorMessage(removeError));
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !campaign)
    return <main className="p-8"><LoadingState label="Cargando escuelas de la etapa…" /></main>;
  if (error && !campaign)
    return <main className="p-8"><ErrorState message={error} onRetry={() => void load()} /></main>;
  if (!campaign) return null;
  const canAssign = campaign.status === "draft" || campaign.status === "active";
  const canRemove = campaign.status === "draft";
  const isActiveCampaign = campaign.status === "active";

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          backLabel="Volver a etapas"
          backTo="/admin/campanas"
          description={campaignDescription(campaign.status)}
          eyebrow="Etapas"
          title={`Escuelas · ${campaign.name}`}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Asignadas" value={assigned.pagination.total} />
          <Metric label="No asignadas (filtro actual)" value={options.summary.unassigned} />
          <Metric label="Seleccionadas ahora" value={selected.size} />
          <Metric label="Estado" value={assignmentStatusLabel(campaign.status)} />
        </div>

        {isActiveCampaign && (
          <div
            className="mt-6 flex gap-3 rounded-xl border border-mendoza-sky bg-mendoza-blue-soft p-4 text-sm leading-6 text-mendoza-text"
            role="status"
          >
            <CircleCheckBig
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-mendoza-blue"
              size={20}
            />
            <p>
              <strong>Incorporación durante etapa activa.</strong> Al
              confirmar, las escuelas seleccionadas se integrarán de inmediato
              al universo de la etapa. Quedarán habilitadas para iniciar el
              diagnóstico cuando cumplan los demás requisitos vigentes. La fecha,
              el origen y el administrador responsable quedarán registrados para
              auditoría.
            </p>
          </div>
        )}

        {canAssign && (
          <Card className="mt-6">
            <form
              className="grid gap-3 md:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                setFilters((current) => ({ ...current, search: search.trim() || undefined, page: 1 }));
              }}
            >
              <label className="text-sm font-semibold md:col-span-2">
                Buscar por nombre o CUE
                <input className={`${inputClassName} mt-1`} onChange={(event) => setSearch(event.target.value)} value={search} />
              </label>
              <FilterSelect
                label="Departamento"
                options={catalogs?.departments ?? []}
                value={filters.department ?? ""}
                onChange={(department) => setFilters((current) => ({ ...current, department: department || undefined, page: 1 }))}
              />
              <FilterSelect
                label="Localidad"
                options={catalogs?.localities ?? []}
                value={filters.locality ?? ""}
                onChange={(locality) => setFilters((current) => ({ ...current, locality: locality || undefined, page: 1 }))}
              />
              <FilterSelect
                label="Nivel"
                options={catalogs?.educationLevels ?? []}
                value={filters.educationLevel ?? ""}
                onChange={(educationLevel) => setFilters((current) => ({ ...current, educationLevel: educationLevel || undefined, page: 1 }))}
              />
              <FilterSelect
                label="Gestión"
                options={catalogs?.managementTypes ?? []}
                value={filters.managementType ?? ""}
                onChange={(managementType) => setFilters((current) => ({ ...current, managementType: managementType || undefined, page: 1 }))}
              />
              <FilterSelect
                label="Ámbito"
                options={catalogs?.scopes ?? []}
                value={filters.scope ?? ""}
                onChange={(scope) => setFilters((current) => ({ ...current, scope: scope || undefined, page: 1 }))}
              />
              <FilterSelect
                label="Jornada"
                options={catalogs?.shifts ?? []}
                value={filters.shift ?? ""}
                onChange={(shift) => setFilters((current) => ({ ...current, shift: shift || undefined, page: 1 }))}
              />
              <div className="flex flex-wrap items-end gap-2 md:col-span-4">
                <Button icon={<Search size={17} />} type="submit">Aplicar filtros</Button>
                <Button
                  disabled={processing || selected.size === 0}
                  icon={<CheckSquare size={17} />}
                  onClick={() => void preview({ source: "manual", schoolIds: [...selected] })}
                  variant="outline"
                >
                  Asignar selección ({selected.size})
                </Button>
                <Button
                  disabled={processing || options.summary.unassigned === 0}
                  icon={<Filter size={17} />}
                  onClick={() => void preview({ ...selectionFilters, source: "filter" })}
                  variant="outline"
                >
                  Asignar todas las filtradas
                </Button>
              </div>
            </form>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-mendoza-blue text-white">
                  <tr><th className="p-3">Seleccionar</th><th className="p-3">CUE</th><th className="p-3">Escuela</th><th className="p-3">Ubicación</th><th className="p-3">Estado</th></tr>
                </thead>
                <tbody>
                  {options.items.map((school) => (
                    <tr className="border-b border-mendoza-border" key={school.id}>
                      <td className="p-3">
                        <input
                          aria-label={`Seleccionar ${school.name}`}
                          checked={selected.has(school.id) || school.assigned}
                          className="h-5 w-5 accent-mendoza-blue"
                          disabled={school.assigned || !school.isActive}
                          onChange={(event) => setSelected((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(school.id); else next.delete(school.id);
                            return next;
                          })}
                          type="checkbox"
                        />
                      </td>
                      <td className="p-3 font-semibold">{school.cue}</td>
                      <td className="p-3">{school.name}</td>
                      <td className="p-3">{school.department} · {school.locality}</td>
                      <td className="p-3">{school.assigned ? "Ya asignada" : school.isActive ? "Disponible" : "Inactiva"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              loading={loading}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              pagination={options.pagination}
            />
          </Card>
        )}

        <Card className="mt-6">
          <div className="flex items-center gap-3">
            <Users className="text-mendoza-blue" />
            <div><h2 className="text-lg font-bold">Escuelas asignadas</h2><p className="text-sm text-mendoza-muted">{assigned.pagination.total} establecimientos integran el universo actual.</p></div>
          </div>
          <div className="mt-4 divide-y divide-mendoza-border">
            {assigned.items.map((assignment) => (
              <div className="flex items-center justify-between gap-4 py-3" key={assignment.id}>
                <div>
                  <p className="font-semibold">{assignment.school.name}</p>
                  <p className="text-sm text-mendoza-muted">CUE {assignment.school.cue} · {assignment.school.department}</p>
                  <p className="mt-1 text-xs text-mendoza-muted">
                    Incorporada {" "}
                    <time dateTime={assignment.assignedAt}>
                      {formatDateTime(assignment.assignedAt)}
                    </time>{" "}
                    · {assignmentSourceLabel(assignment.assignmentSource)}
                  </p>
                </div>
                {canRemove && <button aria-label={`Quitar ${assignment.school.name}`} className="rounded-lg p-2 text-mendoza-error hover:bg-red-50" onClick={() => setRemovePending(assignment)} type="button"><Trash2 size={18} /></button>}
              </div>
            ))}
            {!assigned.items.length && <p className="py-6 text-center text-sm text-mendoza-muted">Todavía no hay escuelas asignadas.</p>}
          </div>
          <PaginationControls
            loading={loading}
            onPageChange={setAssignedPage}
            pagination={assigned.pagination}
          />
        </Card>
      </div>

      <ConfirmDialog
        confirmLabel="Confirmar asignación"
        description={pending ? assignmentConfirmationDescription(pending.preview, isActiveCampaign) : ""}
        isProcessing={processing}
        onCancel={() => setPending(null)}
        onConfirm={confirmAssignment}
        open={Boolean(pending)}
        title="¿Aplicar selección de escuelas?"
      />
      <ConfirmDialog
        confirmLabel="Quitar escuela"
        description={removePending ? `Se quitará ${removePending.school.name} del universo de la etapa. La acción se bloqueará si ya tiene una presentación.` : ""}
        destructive
        isProcessing={processing}
        onCancel={() => setRemovePending(null)}
        onConfirm={removeAssignment}
        open={Boolean(removePending)}
        title="¿Quitar escuela de la etapa?"
      />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <Card><p className="text-sm font-semibold text-mendoza-muted">{label}</p><p className="mt-2 text-2xl font-bold text-mendoza-blue">{value}</p></Card>;
}

function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <SearchableSelect allLabel="Todos" label={label} onChange={onChange} options={options.map((option) => ({ value: option, label: option }))} value={value} />;
}

const assignmentSourceLabels: Record<
  CampaignSchoolAssignment["assignmentSource"],
  string
> = {
  manual: "Incorporación manual",
  filter: "Incorporación por filtros",
  bulk: "Incorporación masiva",
};

function assignmentSourceLabel(
  source: CampaignSchoolAssignment["assignmentSource"],
) {
  return assignmentSourceLabels[source];
}

function campaignDescription(status: AdminCampaign["status"]) {
  if (status === "active")
    return "Incorporá establecimientos habilitados aunque la etapa ya haya comenzado. La asignación queda registrada y el período original se mantiene.";
  if (status === "draft")
    return "Seleccioná el universo inicial de establecimientos. La etapa no podrá activarse sin escuelas asignadas.";
  return "Consultá el universo histórico de establecimientos. Las etapas cerradas o archivadas no admiten nuevas incorporaciones.";
}

function assignmentStatusLabel(status: AdminCampaign["status"]) {
  if (status === "active") return "Activa · admite incorporaciones";
  if (status === "draft") return "Borrador editable";
  return "Sólo lectura";
}

function assignmentConfirmationDescription(
  preview: CampaignSchoolPreview,
  isActiveCampaign: boolean,
) {
  const alreadyAssigned = `${preview.alreadyAssigned} ya ${preview.alreadyAssigned === 1 ? "estaba asignada" : "estaban asignadas"} y no se duplicará${preview.alreadyAssigned === 1 ? "" : "n"}.`;
  const effect = isActiveCampaign
    ? "Las nuevas escuelas se incorporarán inmediatamente a la etapa activa y podrán iniciar cuando cumplan los demás requisitos vigentes."
    : "Las nuevas escuelas quedarán incorporadas al universo inicial de la etapa.";
  return `${preview.message} ${alreadyAssigned} ${effect} La operación quedará registrada para auditoría.`;
}

function assignmentSuccessMessage(
  assigned: number,
  status: AdminCampaign["status"] | undefined,
) {
  if (assigned === 0) return "No se incorporaron escuelas nuevas.";
  const schools = assigned === 1 ? "escuela" : "escuelas";
  const suffix = status === "active" ? " a la etapa activa" : "";
  return `Se ${assigned === 1 ? "incorporó" : "incorporaron"} ${assigned} ${schools}${suffix}.`;
}

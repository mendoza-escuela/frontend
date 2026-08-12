import {
  CheckCircle2,
  ChevronDown,
  ClipboardClock,
  Gauge,
  RotateCcw,
  School,
  SlidersHorizontal,
  Star,
  X,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { SearchableMultiSelect } from "../../components/ui/SearchableMultiSelect";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError } from "../../lib/toast";
import { INSTITUTIONAL_CHART_COLORS } from "../../theme/institutional-theme";
import { adminDashboardService } from "../../services/admin-dashboard.service";
import { DimensionRadar } from "../../components/results/PreliminaryResultRadar";
import { CampaignComparisonPanel } from "../../components/dashboard/CampaignComparisonPanel";
import type {
  CriticalAlertsResponse,
  ParticipationDashboardResponse,
  ParticipationFilterOptions,
  ParticipationFilters,
  ParticipationStar,
  ParticipationSubmissionStatus,
  ResultsDashboardResponse,
} from "../../types/admin-dashboard";

const emptyOptions: ParticipationFilterOptions = {
  campaigns: [],
  defaultCampaignId: null,
  departments: [],
  localities: [],
  educationLevels: [],
  educationLevelOptions: [],
  educationTypes: [],
  managementTypes: [],
  scopes: [],
  shifts: [],
  criticalAreas: [],
  schools: [],
};
const multiFilterKeys = [
  "departments",
  "localities",
  "schoolIds",
  "educationLevels",
  "educationTypes",
  "managementTypes",
  "scopes",
  "shifts",
  "submissionStatuses",
  "stars",
  "criticalAreas",
] as const satisfies ReadonlyArray<keyof ParticipationFilters>;
type MultiFilterKey = (typeof multiFilterKeys)[number];

const legacyFilterKeys: Partial<Record<MultiFilterKey, string>> = {
  departments: "department",
  localities: "locality",
  schoolIds: "schoolId",
  educationTypes: "educationLevel",
  managementTypes: "managementType",
  scopes: "scope",
  shifts: "shift",
};
const submissionStatusOptions: Array<{
  value: ParticipationSubmissionStatus;
  label: string;
}> = [
  { value: "not_started", label: "No iniciada" },
  { value: "draft", label: "En borrador" },
  { value: "submitted", label: "Enviada" },
];
const starOptions: Array<{ value: ParticipationStar; label: string }> = [
  { value: "1", label: "1 estrella" },
  { value: "2", label: "2 estrellas" },
  { value: "3", label: "3 estrellas" },
  { value: "4", label: "4 estrellas" },
  { value: "5", label: "5 estrellas" },
];

export function ParticipationDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedFilters = useMemo<ParticipationFilters>(() => {
    const parsed: ParticipationFilters = {
      campaignId: searchParams.get("campaignId") || undefined,
    };
    for (const key of multiFilterKeys) {
      const values = readMultiValue(searchParams, key, legacyFilterKeys[key]);
      if (values.length)
        Object.assign(parsed, {
          [key]: values,
        });
    }
    return parsed;
  }, [searchParams]);
  const filtersKey = JSON.stringify(parsedFilters);
  const filters = useMemo<ParticipationFilters>(
    () => JSON.parse(filtersKey) as ParticipationFilters,
    [filtersKey],
  );
  const comparisonCampaignIds = useMemo(
    () =>
      [...new Set(searchParams.getAll("comparisonCampaignIds"))]
        .map((value) => value.trim())
        .filter(
          (campaignId) =>
            campaignId && campaignId !== filters.campaignId,
        )
        .slice(0, 5),
    [filters.campaignId, searchParams],
  );
  const departmentsKey = filters.departments?.join("\u0000") ?? "";
  const localitiesKey = filters.localities?.join("\u0000") ?? "";
  const [options, setOptions] = useState(emptyOptions);
  const [dashboard, setDashboard] =
    useState<ParticipationDashboardResponse | null>(null);
  const [results, setResults] = useState<ResultsDashboardResponse | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlertsResponse | null>(null);
  const [criticalDimension, setCriticalDimension] = useState("");
  const [criticalPage, setCriticalPage] = useState(1);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setOptionsLoading(true);
    adminDashboardService
      .filterOptions(
        {
          campaignId: filters.campaignId,
          departments: splitFilterKey(departmentsKey),
          localities: splitFilterKey(localitiesKey),
        },
        controller.signal,
      )
      .then((response) => {
        setOptions(response);
        if (response.defaultCampaignId)
          setSearchParams(
            (current) => {
              if (current.has("campaignId")) return current;
              const next = new URLSearchParams(current);
              next.set("campaignId", response.defaultCampaignId!);
              return next;
            },
            { replace: true },
          );
      })
      .catch((requestError) => {
        if (!controller.signal.aborted)
          setError(getHttpErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setOptionsLoading(false);
      });
    return () => controller.abort();
  }, [
    filters.campaignId,
    departmentsKey,
    localitiesKey,
    retry,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!filters.campaignId) {
      setDashboard(null);
      return;
    }
    const controller = new AbortController();
    setMetricsLoading(true);
    setError(null);
    Promise.all([
      adminDashboardService.participation(filters, controller.signal),
      adminDashboardService.results(filters, controller.signal),
      adminDashboardService.criticalAlerts(filters, criticalDimension, criticalPage, controller.signal),
    ])
      .then(([participation, resultMetrics, alerts]) => { setDashboard(participation); setResults(resultMetrics); setCriticalAlerts(alerts); })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setDashboard(null);
          setResults(null);
          setCriticalAlerts(null);
          setError(getHttpErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setMetricsLoading(false);
      });
    return () => controller.abort();
  }, [criticalDimension, criticalPage, filters, retry]);

  useEffect(() => {
    setCriticalDimension("");
    setCriticalPage(1);
  }, [filtersKey]);

  const updateCampaign = (value: string) => {
    setCriticalDimension("");
    setCriticalPage(1);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("campaignId", value);
    else next.delete("campaignId");
    next.delete("comparisonCampaignIds");
    for (const key of multiFilterKeys) deleteMultiValue(next, key);
    setSearchParams(next, { replace: true });
  };
  const updateComparisonCampaigns = (campaignIds: string[]) => {
    const next = new URLSearchParams(searchParams);
    next.delete("comparisonCampaignIds");
    [...new Set(campaignIds)]
      .filter(
        (campaignId) =>
          campaignId && campaignId !== filters.campaignId,
      )
      .slice(0, 5)
      .forEach((campaignId) =>
        next.append("comparisonCampaignIds", campaignId),
      );
    setSearchParams(next, { replace: true });
  };
  const updateMultiple = (name: MultiFilterKey, values: string[]) => {
    setCriticalDimension("");
    setCriticalPage(1);
    const next = new URLSearchParams(searchParams);
    setMultiValue(next, name, values);
    if (name === "departments") {
      deleteMultiValue(next, "localities");
      deleteMultiValue(next, "schoolIds");
    }
    if (name === "localities") deleteMultiValue(next, "schoolIds");
    setSearchParams(next, { replace: true });
  };
  const reset = () => {
    setCriticalDimension("");
    setCriticalPage(1);
    const next = new URLSearchParams();
    if (options.defaultCampaignId)
      next.set("campaignId", options.defaultCampaignId);
    setSearchParams(next, { replace: true });
  };
  const activeFilters = activeFilterEntries(filters, options);

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Seguimiento administrativo"
          title="Participación por campaña"
          description="Seguimiento de escuelas que iniciaron, guardaron o enviaron su presentación."
        />
        <Card
          aria-labelledby="participation-filters-heading"
          className="relative mt-6 border-t-4 border-t-mendoza-sky"
        >
          <button
            aria-controls="participation-filters-content"
            aria-expanded={filtersExpanded}
            aria-label={`${filtersExpanded ? "Cerrar" : "Abrir"} filtros de consulta`}
            className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-lg text-left outline-none transition focus-visible:ring-4 focus-visible:ring-mendoza-sky/20 ${filtersExpanded ? "mb-6 border-b border-mendoza-border pb-4" : ""}`}
            onClick={() => setFiltersExpanded((expanded) => !expanded)}
            type="button"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mendoza-blue text-white">
                <SlidersHorizontal aria-hidden="true" size={20} />
              </span>
              <span>
                <span
                  className="block font-bold text-mendoza-text"
                  id="participation-filters-heading"
                >
                  Filtros de consulta
                </span>
                <span className="block text-sm text-mendoza-muted">
                  Buscá y combiná opciones para acotar los indicadores.
                </span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-mendoza-blue/5 px-3 py-1.5 text-xs font-bold text-mendoza-blue">
                {activeFilters.length}{" "}
                {activeFilters.length === 1
                  ? "filtro activo"
                  : "filtros activos"}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`text-mendoza-blue transition-transform motion-reduce:transition-none ${filtersExpanded ? "rotate-180" : ""}`}
                size={20}
              />
            </span>
          </button>
          {filtersExpanded && (
            <div id="participation-filters-content">
              <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <SearchableSelect
              label="Campaña"
              value={filters.campaignId}
              onChange={updateCampaign}
              options={options.campaigns.map(({ id, name, status }) => ({
                value: id,
                label: `${name} · ${statusLabel(status)}`,
              }))}
            />
            <SearchableMultiSelect
              label="Departamento"
              values={filters.departments}
              onChange={(values) => updateMultiple("departments", values)}
              options={asOptions(options.departments)}
            />
            <SearchableMultiSelect
              label="Localidad"
              values={filters.localities}
              onChange={(values) => updateMultiple("localities", values)}
              options={asOptions(options.localities)}
            />
            <SearchableMultiSelect
              label="Escuela"
              values={filters.schoolIds}
              onChange={(values) => updateMultiple("schoolIds", values)}
              options={options.schools.map(({ id, cue, name }) => ({
                value: id,
                label: `${name} · CUE ${cue}`,
              }))}
            />
            <SearchableMultiSelect
              label="Nivel"
              values={filters.educationLevels}
              onChange={(values) => updateMultiple("educationLevels", values)}
              options={options.educationLevelOptions}
            />
            <SearchableMultiSelect
              label="Tipo de educación"
              values={filters.educationTypes}
              onChange={(values) => updateMultiple("educationTypes", values)}
              options={asOptions(options.educationTypes)}
            />
            <SearchableMultiSelect
              label="Gestión"
              values={filters.managementTypes}
              onChange={(values) => updateMultiple("managementTypes", values)}
              options={asOptions(options.managementTypes)}
            />
            <SearchableMultiSelect
              label="Ámbito"
              values={filters.scopes}
              onChange={(values) => updateMultiple("scopes", values)}
              options={asOptions(options.scopes)}
            />
            <SearchableMultiSelect
              label="Jornada"
              values={filters.shifts}
              onChange={(values) => updateMultiple("shifts", values)}
              options={asOptions(options.shifts)}
            />
            <SearchableMultiSelect
              label="Estado de carga"
              values={filters.submissionStatuses}
              onChange={(values) =>
                updateMultiple("submissionStatuses", values)
              }
              options={submissionStatusOptions}
            />
            <SearchableMultiSelect
              label="Estrellas"
              values={filters.stars}
              onChange={(values) => updateMultiple("stars", values)}
              options={starOptions}
            />
            <div>
              <SearchableMultiSelect
                label="Área crítica"
                values={filters.criticalAreas}
                onChange={(values) => updateMultiple("criticalAreas", values)}
                options={options.criticalAreas}
              />
              <p className="mt-1.5 text-xs text-mendoza-muted">
                Restringe el universo de todos los indicadores y exportaciones.
              </p>
            </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-mendoza-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {activeFilters.length ? activeFilters.map((filter) => (
                    <button className="inline-flex min-h-9 items-center gap-2 rounded-full bg-mendoza-sky/15 px-3 text-xs font-semibold text-mendoza-blue transition hover:bg-mendoza-sky/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue" key={`${filter.key}-${filter.value}`} onClick={() => updateMultiple(filter.key, selectedFilterValues(filters, filter.key).filter((value) => value !== filter.value))} title={`Quitar filtro ${filter.label}: ${filter.displayValue}`} type="button">
                      <span>{filter.label}: {filter.displayValue}</span><X aria-hidden="true" size={14} />
                    </button>
                  )) : <p className="text-sm text-mendoza-muted">Mostrando todos los datos de la campaña.</p>}
                </div>
                <Button
                  icon={<RotateCcw aria-hidden="true" size={17} />}
                  disabled={activeFilters.length === 0}
                  onClick={reset}
                  variant="outline"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}
        </Card>
        {optionsLoading && !filters.campaignId ? (
          <State>
            <LoadingState label="Cargando campañas y filtros…" />
          </State>
        ) : error ? (
          <State>
            <ErrorState
              message={error}
              onRetry={() => setRetry((value) => value + 1)}
            />
          </State>
        ) : !filters.campaignId ? (
          <State>
            <EmptyState
              title="No hay campañas disponibles"
              description="Creá o activá una campaña para comenzar el seguimiento."
            />
          </State>
        ) : metricsLoading ? (
          <State>
            <LoadingState label="Actualizando indicadores…" />
          </State>
        ) : dashboard ? (
          <>
            <Metrics dashboard={dashboard} />
            {results && (
              <>
                <ResultsMetrics
                  criticalAlerts={criticalAlerts}
                  criticalDimension={criticalDimension}
                  criticalPage={criticalPage}
                  dashboard={results}
                  filters={filters}
                  onCriticalDimensionChange={(value) => {
                    setCriticalDimension(value);
                    setCriticalPage(1);
                  }}
                  onCriticalPageChange={setCriticalPage}
                  returnTo={`/admin/participacion?${searchParams.toString()}`}
                />
                <CampaignComparisonPanel
                  baselineCampaignId={filters.campaignId}
                  campaigns={options.campaigns}
                  comparisonCampaignIds={comparisonCampaignIds}
                  filters={filters}
                  onComparisonCampaignIdsChange={updateComparisonCampaigns}
                />
              </>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}

function ResultsMetrics({ criticalAlerts, criticalDimension, criticalPage, dashboard, filters, onCriticalDimensionChange, onCriticalPageChange, returnTo }: { criticalAlerts: CriticalAlertsResponse | null; criticalDimension: string; criticalPage: number; dashboard: ResultsDashboardResponse; filters: ParticipationFilters; onCriticalDimensionChange: (value: string) => void; onCriticalPageChange: (value: number) => void; returnTo: string }) {
  const [exporting, setExporting] = useState(false);
  const exportFile = async (kind: "results" | "answers", format: "csv" | "xlsx") => {
    setExporting(true);
    try {
      await adminDashboardService.export(kind, format, filters);
    } catch (exportError) {
      showError(getHttpErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  };
  const singleSchoolId =
    filters.schoolIds?.length === 1 ? filters.schoolIds[0] : undefined;
  return <section aria-labelledby="results-metrics-title" className="mt-10">
    <h2 className="text-2xl font-bold text-mendoza-text" id="results-metrics-title">Resultados de evaluación</h2>
    <div className="flex flex-wrap items-end justify-between gap-3"><p className="mt-1 text-sm text-mendoza-muted">Promedios sobre {dashboard.denominators.averages} resultados vigentes. Escala 0–100.</p>{filters.campaignId && <Link className="inline-flex min-h-11 items-center rounded-lg border border-mendoza-blue px-4 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue/5" to={singleSchoolId ? `/admin/campanas/${filters.campaignId}/colegios/${singleSchoolId}/resultado?volver=${encodeURIComponent(returnTo)}` : `/admin/seguimiento?campania=${filters.campaignId}`}>{singleSchoolId ? "Ver detalle de la escuela" : "Ver resultados por escuela"}</Link>}</div>
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-mendoza-border bg-white p-3">
      <span className="mr-2 inline-flex items-center gap-2 text-sm font-bold text-mendoza-text"><FileSpreadsheet size={17}/> Exportar filtros actuales</span>
      <Button disabled={exporting} onClick={() => void exportFile("results", "csv")} variant="outline">Resultados CSV</Button>
      <Button disabled={exporting} onClick={() => void exportFile("results", "xlsx")} variant="outline">Resultados XLSX</Button>
      <Button disabled={exporting} onClick={() => void exportFile("answers", "csv")} variant="outline">Respuestas CSV</Button>
      <Button disabled={exporting} onClick={() => void exportFile("answers", "xlsx")} variant="outline">Respuestas XLSX</Button>
    </div>
    {dashboard.metrics.schoolsWithResult === 0 ? <div className="mt-4"><EmptyState title="No hay resultados para los filtros seleccionados" description="Las presentaciones enviadas con resultado aparecerán aquí." /></div> : <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResultCard label="Escuelas del universo" value={String(dashboard.metrics.universeSchools)} />
        <ResultCard label="Escuelas con resultado" value={String(dashboard.metrics.schoolsWithResult)} />
        <ResultCard label="Cobertura" value={formatPercentage(dashboard.metrics.coveragePercentage)} />
        <ResultCard label="Promedio general" value={dashboard.metrics.generalAverage === null ? "No disponible" : `${dashboard.metrics.generalAverage} / 100`} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{dashboard.metrics.dimensionAverages.map(dimension=><ResultCard key={dimension.code} label={dimension.title} note={`${dimension.denominator} ${dimension.denominator === 1 ? "resultado" : "resultados"}`} value={dimension.average===null?"No disponible":`${dimension.average} / 100`} />)}</div>
      <Card className="mt-6"><DimensionRadar description={`Promedios calculados con el denominador indicado para cada dimensión; ${dashboard.denominators.averages} resultados generales vigentes.`} dimensions={dashboard.metrics.dimensionAverages.map(({ average, ...dimension }) => ({ ...dimension, score: average }))} title="Radar administrativo por dimensiones" /></Card>
      {criticalAlerts && <CriticalAlertsPanel alerts={criticalAlerts} campaignId={filters.campaignId!} dimensionCode={criticalDimension} onDimensionChange={onCriticalDimensionChange} onPageChange={onCriticalPageChange} page={criticalPage} returnTo={returnTo} />}
      <Card className="mt-6"><h3 className="text-lg font-bold text-mendoza-text">Distribución de estrellas finales</h3><p className="mt-1 text-sm text-mendoza-muted">Denominador: {dashboard.denominators.starDistribution} resultados con estrellas. Excluidos sin estrellas: {dashboard.excludedResultsWithoutStars}.</p>
        <div className="mt-4 h-72" aria-label="Distribución horizontal de estrellas"><ResponsiveContainer width="100%" height="100%"><BarChart data={dashboard.starDistribution} layout="vertical" margin={{left:12,right:24}}><CartesianGrid stroke={INSTITUTIONAL_CHART_COLORS.grid} strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} unit="%"/><YAxis dataKey="label" type="category" width={85}/><Bar dataKey="percentage" fill={INSTITUTIONAL_CHART_COLORS.primary} radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-5">{dashboard.starDistribution.map(item=><li className="rounded-lg bg-mendoza-background p-3 text-sm" key={item.stars}><span className="flex items-center gap-1 font-bold text-mendoza-gold"><Star aria-hidden="true" className="fill-current" size={16}/>{item.label}</span><span className="mt-1 block text-mendoza-text">{item.count} · {formatPercentage(item.percentage)}</span></li>)}</ul>
      </Card>
    </>}
  </section>;
}
function ResultCard({label,note,value}:{label:string;note?:string;value:string}) { return <Card as="article"><p className="text-sm font-semibold text-mendoza-muted">{label}</p><p className="mt-2 text-2xl font-bold text-mendoza-blue">{value}</p>{note && <p className="mt-1 text-xs text-mendoza-muted">Base: {note}</p>}</Card>; }

function CriticalAlertsPanel({ alerts, campaignId, dimensionCode, onDimensionChange, onPageChange, page, returnTo }: { alerts: CriticalAlertsResponse; campaignId: string; dimensionCode: string; onDimensionChange: (value: string) => void; onPageChange: (value: number) => void; page: number; returnTo: string }) {
  return <Card className="mt-6 border-l-4 border-l-red-600">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h3 className="flex items-center gap-2 text-lg font-bold text-mendoza-text"><AlertTriangle aria-hidden="true" className="text-red-700" size={20}/>Alertas críticas consolidadas</h3><p className="mt-1 text-sm text-mendoza-muted">{alerts.summary.schoolsCount} {alerts.summary.schoolsCount === 1 ? "escuela afectada" : "escuelas afectadas"} ({formatPercentage(alerts.summary.schoolsPercentage)} de {alerts.summary.schoolsWithResult} con resultado) · {alerts.summary.alertsCount} {alerts.summary.alertsCount === 1 ? "alerta" : "alertas"} en {alerts.summary.affectedDimensionCount} {alerts.summary.affectedDimensionCount === 1 ? "dimensión" : "dimensiones"}.</p></div>
      <label className="text-sm font-semibold text-mendoza-text">Dimensión crítica<select className="ml-2 min-h-11 rounded-lg border border-mendoza-border bg-white px-3" onChange={(event) => onDimensionChange(event.target.value)} value={dimensionCode}><option value="">Todas</option>{alerts.summary.affectedDimensions.map((dimension) => <option key={dimension.code} value={dimension.code}>{dimension.title} ({dimension.schoolsCount})</option>)}</select><span className="mt-1 block text-xs font-normal text-mendoza-muted">Refina sólo el listado de alertas de este panel.</span></label>
    </div>
    {alerts.items.length ? <><ul className="mt-5 grid gap-3">{alerts.items.map((item) => <li className="rounded-xl border border-red-200 bg-red-50/40 p-4" key={item.school.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-mendoza-text">{item.school.name} · CUE {item.school.cue}</p><p className="text-sm text-mendoza-muted">{[item.school.department, item.school.locality].filter(Boolean).join(" · ") || "Ubicación no informada"}</p></div><Link className="inline-flex min-h-10 items-center rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-white" to={`/admin/campanas/${campaignId}/colegios/${item.school.id}/resultado?volver=${encodeURIComponent(returnTo)}`}>Ver detalle</Link></div><ul className="mt-3 flex flex-wrap gap-2">{item.dimensions.map((dimension) => <li className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900" key={dimension.code}>{dimension.title}: {dimension.score ?? "s/d"} / umbral {dimension.threshold ?? "s/d"}</li>)}</ul></li>)}</ul>{alerts.pagination.totalPages > 1 && <nav aria-label="Paginación de alertas críticas" className="mt-4 flex items-center justify-between gap-3"><Button disabled={page <= 1} onClick={() => onPageChange(page - 1)} variant="outline">Anterior</Button><span className="text-sm text-mendoza-muted">Página {alerts.pagination.page} de {alerts.pagination.totalPages}</span><Button disabled={page >= alerts.pagination.totalPages} onClick={() => onPageChange(page + 1)} variant="outline">Siguiente</Button></nav>}</> : <p className="mt-5 rounded-lg bg-mendoza-background p-4 text-sm text-mendoza-muted">No hay alertas críticas para los filtros seleccionados.</p>}
  </Card>;
}

function Metrics({ dashboard }: { dashboard: ParticipationDashboardResponse }) {
  const cards = [
    {
      label: "Total de escuelas",
      value: dashboard.metrics.totalSchools,
      icon: School,
    },
    {
      label: "No iniciadas",
      value: dashboard.metrics.notStarted,
      icon: ClipboardClock,
    },
    { label: "En borrador", value: dashboard.metrics.draft, icon: Gauge },
    {
      label: "Enviadas",
      value: dashboard.metrics.submitted,
      icon: CheckCircle2,
    },
  ];
  return (
    <section aria-live="polite" className="mt-6">
      {dashboard.metrics.totalSchools === 0 && (
        <div className="mb-5">
          <EmptyState
            title="No hay escuelas para los filtros seleccionados"
            description="Probá quitar uno o más filtros para ampliar la búsqueda."
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card as="article" key={label}>
            <Icon aria-hidden="true" className="text-mendoza-blue" size={24} />
            <p className="mt-4 text-sm font-semibold text-mendoza-muted">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-mendoza-text">{value}</p>
          </Card>
        ))}
        <Card as="article" className="border-mendoza-gold">
          <Gauge aria-hidden="true" className="text-mendoza-gold" size={24} />
          <p className="mt-4 text-sm font-semibold text-mendoza-muted">
            Participación
          </p>
          <p className="mt-1 text-3xl font-bold text-mendoza-blue">
            {formatPercentage(dashboard.metrics.participationPercentage)}
          </p>
          <p className="mt-2 text-xs text-mendoza-muted">
            Enviadas sobre el total
          </p>
        </Card>
      </div>
    </section>
  );
}

function State({ children }: { children: React.ReactNode }) {
  return <div className="mt-6">{children}</div>;
}

type ActiveFilterEntry = {
  key: MultiFilterKey;
  label: string;
  value: string;
  displayValue: string;
};

function activeFilterEntries(
  filters: ParticipationFilters,
  options: ParticipationFilterOptions,
) {
  const entries: ActiveFilterEntry[] = [];
  const add = (
    key: MultiFilterKey,
    label: string,
    values: readonly string[] | undefined,
    display: (value: string) => string = (value) => value,
  ) => {
    values?.forEach((value) =>
      entries.push({ key, label, value, displayValue: display(value) }),
    );
  };
  add("departments", "Departamento", filters.departments);
  add("localities", "Localidad", filters.localities);
  add("schoolIds", "Escuela", filters.schoolIds, (value) => {
    const school = options.schools.find(({ id }) => id === value);
    return school ? `${school.name} · CUE ${school.cue}` : value;
  });
  add("educationLevels", "Nivel", filters.educationLevels, (value) =>
    options.educationLevelOptions.find((option) => option.value === value)
      ?.label ?? value,
  );
  add("educationTypes", "Tipo de educación", filters.educationTypes);
  add("managementTypes", "Gestión", filters.managementTypes);
  add("scopes", "Ámbito", filters.scopes);
  add("shifts", "Jornada", filters.shifts);
  add(
    "submissionStatuses",
    "Estado de carga",
    filters.submissionStatuses,
    (value) =>
      submissionStatusOptions.find((option) => option.value === value)?.label ??
      value,
  );
  add("stars", "Estrellas", filters.stars, (value) =>
    starOptions.find((option) => option.value === value)?.label ?? value,
  );
  add("criticalAreas", "Área crítica", filters.criticalAreas, (value) =>
    options.criticalAreas.find((option) => option.value === value)?.label ??
    value,
  );
  return entries;
}

function selectedFilterValues(
  filters: ParticipationFilters,
  key: MultiFilterKey,
) {
  return (filters[key] as readonly string[] | undefined) ?? [];
}

function readMultiValue(
  params: URLSearchParams,
  key: MultiFilterKey,
  legacyKey?: string,
) {
  const rawValues = [
    ...params.getAll(key),
    ...(legacyKey ? params.getAll(legacyKey) : []),
  ];
  return [
    ...new Set(
      rawValues
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function deleteMultiValue(params: URLSearchParams, key: MultiFilterKey) {
  params.delete(key);
  const legacyKey = legacyFilterKeys[key];
  if (legacyKey) params.delete(legacyKey);
}

function setMultiValue(
  params: URLSearchParams,
  key: MultiFilterKey,
  values: readonly string[],
) {
  deleteMultiValue(params, key);
  [...new Set(values.filter(Boolean))].forEach((value) =>
    params.append(key, value),
  );
}

function splitFilterKey(value: string) {
  return value ? value.split("\u0000") : undefined;
}

const asOptions = (values: string[]) =>
  values.map((value) => ({ value, label: value }));
const statusLabel = (status: string) =>
  status === "active"
    ? "Activa"
    : status === "closed"
      ? "Cerrada"
      : "Archivada";
const formatPercentage = (value: number) =>
  `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)} %`;

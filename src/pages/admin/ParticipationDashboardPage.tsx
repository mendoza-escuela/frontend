import {
  CheckCircle2,
  ClipboardClock,
  Gauge,
  RotateCcw,
  School,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { getHttpErrorMessage } from "../../lib/http-error";
import { adminDashboardService } from "../../services/admin-dashboard.service";
import type {
  ParticipationDashboardResponse,
  ParticipationFilterOptions,
  ParticipationFilters,
  ResultsDashboardResponse,
} from "../../types/admin-dashboard";

const emptyOptions: ParticipationFilterOptions = {
  campaigns: [],
  defaultCampaignId: null,
  departments: [],
  localities: [],
  educationLevels: [],
  managementTypes: [],
  scopes: [],
  shifts: [],
  schools: [],
};
const filterKeys: Array<keyof ParticipationFilters> = [
  "campaignId",
  "department",
  "locality",
  "schoolId",
  "educationLevel",
  "managementType",
  "scope",
  "shift",
];

export function ParticipationDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () =>
      Object.fromEntries(
        filterKeys
          .map((key) => [key, searchParams.get(key) || undefined])
          .filter(([, value]) => value),
      ) as ParticipationFilters,
    [searchParams],
  );
  const [options, setOptions] = useState(emptyOptions);
  const [dashboard, setDashboard] =
    useState<ParticipationDashboardResponse | null>(null);
  const [results, setResults] = useState<ResultsDashboardResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setOptionsLoading(true);
    adminDashboardService
      .filterOptions(
        { department: filters.department, locality: filters.locality },
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
  }, [filters.department, filters.locality, retry, setSearchParams]);

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
    ])
      .then(([participation, resultMetrics]) => { setDashboard(participation); setResults(resultMetrics); })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setDashboard(null);
          setResults(null);
          setError(getHttpErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setMetricsLoading(false);
      });
    return () => controller.abort();
  }, [filters, retry]);

  const update = (name: keyof ParticipationFilters, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name === "department") {
      next.delete("locality");
      next.delete("schoolId");
    }
    if (name === "locality") next.delete("schoolId");
    setSearchParams(next, { replace: true });
  };
  const reset = () => {
    const next = new URLSearchParams();
    if (options.defaultCampaignId)
      next.set("campaignId", options.defaultCampaignId);
    setSearchParams(next, { replace: true });
  };

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Seguimiento administrativo"
          title="Participación por campaña"
          description="Seguimiento de escuelas que iniciaron, guardaron o enviaron su presentación."
        />
        <Card className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Campaña"
              value={filters.campaignId}
              onChange={(value) => update("campaignId", value)}
              values={options.campaigns.map(({ id, name, status }) => ({
                value: id,
                label: `${name} · ${statusLabel(status)}`,
              }))}
            />
            <Select
              label="Departamento"
              value={filters.department}
              onChange={(value) => update("department", value)}
              values={asOptions(options.departments)}
            />
            <Select
              label="Localidad"
              value={filters.locality}
              onChange={(value) => update("locality", value)}
              values={asOptions(options.localities)}
            />
            <Select
              label="Escuela"
              value={filters.schoolId}
              onChange={(value) => update("schoolId", value)}
              values={options.schools.map(({ id, cue, name }) => ({
                value: id,
                label: `${name} · CUE ${cue}`,
              }))}
            />
            <Select
              label="Nivel"
              value={filters.educationLevel}
              onChange={(value) => update("educationLevel", value)}
              values={asOptions(options.educationLevels)}
            />
            <Select
              label="Gestión"
              value={filters.managementType}
              onChange={(value) => update("managementType", value)}
              values={asOptions(options.managementTypes)}
            />
            <Select
              label="Ámbito"
              value={filters.scope}
              onChange={(value) => update("scope", value)}
              values={asOptions(options.scopes)}
            />
            <Select
              label="Jornada"
              value={filters.shift}
              onChange={(value) => update("shift", value)}
              values={asOptions(options.shifts)}
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              icon={<RotateCcw aria-hidden="true" size={17} />}
              onClick={reset}
              variant="outline"
            >
              Limpiar filtros
            </Button>
          </div>
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
          <><Metrics dashboard={dashboard} />{results && <ResultsMetrics dashboard={results} />}</>
        ) : null}
      </div>
    </main>
  );
}

function ResultsMetrics({ dashboard }: { dashboard: ResultsDashboardResponse }) {
  return <section aria-labelledby="results-metrics-title" className="mt-10">
    <h2 className="text-2xl font-bold text-mendoza-text" id="results-metrics-title">Resultados de evaluación</h2>
    <p className="mt-1 text-sm text-mendoza-muted">Promedios sobre {dashboard.denominators.averages} resultados vigentes. Escala 0–100.</p>
    {dashboard.metrics.schoolsWithResult === 0 ? <div className="mt-4"><EmptyState title="No hay resultados para los filtros seleccionados" description="Las presentaciones enviadas con resultado aparecerán aquí." /></div> : <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResultCard label="Escuelas del universo" value={String(dashboard.metrics.universeSchools)} />
        <ResultCard label="Escuelas con resultado" value={String(dashboard.metrics.schoolsWithResult)} />
        <ResultCard label="Cobertura" value={formatPercentage(dashboard.metrics.coveragePercentage)} />
        <ResultCard label="Promedio general" value={dashboard.metrics.generalAverage === null ? "No disponible" : `${dashboard.metrics.generalAverage} / 100`} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{dashboard.metrics.dimensionAverages.map(dimension=><ResultCard key={dimension.code} label={dimension.title} value={dimension.average===null?"No disponible":`${dimension.average} / 100`} />)}</div>
      <Card className="mt-6"><h3 className="text-lg font-bold text-mendoza-text">Distribución de estrellas finales</h3><p className="mt-1 text-sm text-mendoza-muted">Denominador: {dashboard.denominators.starDistribution} resultados con estrellas. Excluidos sin estrellas: {dashboard.excludedResultsWithoutStars}.</p>
        <div className="mt-4 h-72" aria-label="Distribución horizontal de estrellas"><ResponsiveContainer width="100%" height="100%"><BarChart data={dashboard.starDistribution} layout="vertical" margin={{left:12,right:24}}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" domain={[0,100]} unit="%"/><YAxis dataKey="label" type="category" width={85}/><Bar dataKey="percentage" fill="#000F9F" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-5">{dashboard.starDistribution.map(item=><li className="rounded-lg bg-mendoza-background p-3 text-sm" key={item.stars}><span className="flex items-center gap-1 font-bold text-mendoza-gold"><Star aria-hidden="true" className="fill-current" size={16}/>{item.label}</span><span className="mt-1 block text-mendoza-text">{item.count} · {formatPercentage(item.percentage)}</span></li>)}</ul>
      </Card>
    </>}
  </section>;
}
function ResultCard({label,value}:{label:string;value:string}) { return <Card as="article"><p className="text-sm font-semibold text-mendoza-muted">{label}</p><p className="mt-2 text-2xl font-bold text-mendoza-blue">{value}</p></Card>; }

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

function Select({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value?: string;
  values: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-mendoza-text">
      {label}
      <select
        className="field"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ""}
      >
        <option value="">Todos</option>
        {values.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function State({ children }: { children: React.ReactNode }) {
  return <div className="mt-6">{children}</div>;
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

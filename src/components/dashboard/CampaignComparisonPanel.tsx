import {
  AlertTriangle,
  CheckCircle2,
  GitCompareArrows,
  RotateCcw,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "../../lib/format";
import { getHttpErrorMessage } from "../../lib/http-error";
import { wrapChartLabel } from "../../lib/text";
import { showWarning } from "../../lib/toast";
import { adminDashboardService } from "../../services/admin-dashboard.service";
import {
  INSTITUTIONAL_CHART_COLORS,
  INSTITUTIONAL_COLORS,
} from "../../theme/institutional-theme";
import type {
  CampaignComparisonPeriod,
  CampaignComparisonRadarReason,
  CampaignComparisonResponse,
  ParticipationFilterOptions,
  ParticipationFilters,
} from "../../types/admin-dashboard";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { LoadingState } from "../ui/LoadingState";
import { SearchableMultiSelect } from "../ui/SearchableMultiSelect";

const seriesColors = [
  INSTITUTIONAL_COLORS.blue,
  INSTITUTIONAL_COLORS.sky,
  INSTITUTIONAL_COLORS.gold,
  INSTITUTIONAL_COLORS.success,
  INSTITUTIONAL_COLORS.warning,
  INSTITUTIONAL_COLORS.muted,
];

type CampaignComparisonPanelProps = {
  baselineCampaignId: string;
  comparisonCampaignIds: string[];
  campaigns: ParticipationFilterOptions["campaigns"];
  filters: ParticipationFilters;
  onComparisonCampaignIdsChange: (campaignIds: string[]) => void;
};

/**
 * Compara etapas con resultados ya agregados por backend.
 *
 * La interfaz no recalcula puntajes ni decide si las reglas históricas son
 * equivalentes: representa la política y la trazabilidad informadas por la API.
 */
export function CampaignComparisonPanel({
  baselineCampaignId,
  comparisonCampaignIds,
  campaigns,
  filters,
  onComparisonCampaignIdsChange,
}: CampaignComparisonPanelProps) {
  const [comparison, setComparison] =
    useState<CampaignComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const campaignIds = useMemo(
    () => [baselineCampaignId, ...comparisonCampaignIds],
    [baselineCampaignId, comparisonCampaignIds],
  );
  const comparisonFilters = useMemo(
    () => institutionalComparisonFilters(filters),
    [filters],
  );
  const requestKey = JSON.stringify({ campaignIds, comparisonFilters });
  const campaignOptions = campaigns
    .filter(
      ({ id, status }) =>
        id !== baselineCampaignId && status !== "draft",
    )
    .map(({ id, name, status }) => ({
      value: id,
      label: `${name} · ${statusLabel(status)}`,
    }));

  useEffect(() => {
    if (campaignIds.length < 2) {
      setComparison(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    adminDashboardService
      .comparison(campaignIds, comparisonFilters, controller.signal)
      .then(setComparison)
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setComparison(null);
          setError(getHttpErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // `requestKey` estabiliza el efecto ante objetos equivalentes reconstruidos
    // desde la URL y conserva la segmentación institucional en la solicitud.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, retry]);

  return (
    <section aria-labelledby="campaign-comparison-title" className="mt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-mendoza-blue">
            Análisis histórico
          </p>
          <h2
            className="mt-1 flex items-center gap-2 text-2xl font-bold text-mendoza-text"
            id="campaign-comparison-title"
          >
            <GitCompareArrows aria-hidden="true" size={24} />
            Comparación entre períodos
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-mendoza-muted">
            La etapa actual es la referencia. Los demás períodos reutilizan
            los filtros territoriales e institucionales aplicados arriba.
            Estado de carga, estrellas y área crítica no se aplican para evitar
            seleccionar cada período por su propio resultado.
          </p>
        </div>
        {comparisonCampaignIds.length > 0 && (
          <Button
            icon={<RotateCcw aria-hidden="true" size={17} />}
            onClick={() => onComparisonCampaignIdsChange([])}
            variant="outline"
          >
            Limpiar comparación
          </Button>
        )}
      </div>

      <Card className="mt-5 border-t-4 border-t-mendoza-gold">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-end">
          <div>
            <h3 className="font-bold text-mendoza-text">Período de referencia</h3>
            <p className="mt-1 text-sm text-mendoza-muted">
              {campaignLabel(campaigns, baselineCampaignId)}
            </p>
          </div>
          <div>
            <SearchableMultiSelect
              allLabel="Elegí uno o más períodos"
              label="Períodos a comparar"
              maxSelections={5}
              onChange={onComparisonCampaignIdsChange}
              onMaxSelectionsReached={() =>
                showWarning(
                  "Podés comparar hasta seis etapas: una de referencia y cinco adicionales.",
                )
              }
              options={campaignOptions}
              values={comparisonCampaignIds}
            />
            <p className="mt-1.5 text-xs text-mendoza-muted">
              Podés sumar hasta cinco períodos a la etapa de referencia.
            </p>
          </div>
        </div>
      </Card>

      {!comparisonCampaignIds.length ? (
        <div className="mt-5">
          <EmptyState
            description="Seleccioná al menos otro período para comparar puntaje general, estrellas y trayectoria."
            title="Elegí períodos para iniciar la comparación"
          />
        </div>
      ) : loading ? (
        <div className="mt-5">
          <LoadingState label="Comparando períodos…" />
        </div>
      ) : error ? (
        <div className="mt-5">
          <ErrorState
            message={error}
            onRetry={() => setRetry((value) => value + 1)}
          />
        </div>
      ) : comparison ? (
        <ComparisonResults comparison={comparison} />
      ) : null}
    </section>
  );
}

function ComparisonResults({
  comparison,
}: {
  comparison: CampaignComparisonResponse;
}) {
  return (
    <div aria-live="polite" className="mt-5 space-y-5">
      <div className="rounded-xl border border-mendoza-sky/50 bg-mendoza-sky/10 p-4 text-sm text-mendoza-text">
        <p className="font-bold text-mendoza-blue">Criterio de comparación</p>
        <p className="mt-1">{comparison.comparisonPolicy.notice}</p>
        <p className="mt-2 font-semibold">
          Cada etapa usa su propio universo y la ficha escolar vigente; las
          bases se informan por período.
        </p>
        <p className="mt-1">
          Verificá el tipo de operativo al interpretar etapas anuales y
          semestrales: se muestran lado a lado, sin asumir que forman la misma
          cohorte.
        </p>
      </div>

      {comparison.periods.some(({ campaign }) => campaign.isPartial) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="status">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
          <p>
            La comparación incluye al menos una etapa activa. Sus datos son
            parciales y pueden cambiar con nuevos envíos.
          </p>
        </div>
      )}

      <Card>
        <h3 className="text-lg font-bold text-mendoza-text">
          Métricas estandarizadas
        </h3>
        <p className="mt-1 text-sm text-mendoza-muted">
          Puntaje general y estrellas son comparables aun cuando cambien las
          preguntas, dimensiones o ponderaciones del cuestionario.
        </p>
        <div className="mt-5">
          <MetricBarChart
            data={comparison.periods}
            domain={[0, 100]}
            label="Puntaje general promedio"
            unit=" puntos"
          />
        </div>
        <StarDistributionChart periods={comparison.periods} />
        <ComparisonTable comparison={comparison} />
      </Card>

      <RadarTrajectory comparison={comparison} />
    </div>
  );
}

function MetricBarChart({
  data,
  domain,
  label,
  unit,
}: {
  data: CampaignComparisonPeriod[];
  domain: [number, number];
  label: string;
  unit: string;
}) {
  const chartData = data.map((period) => ({
    id: period.campaign.id,
    campaign: period.campaign.name,
    value: period.metrics.generalAverage,
  }));
  return (
    <figure>
      <figcaption className="mb-3 text-sm font-bold text-mendoza-text">
        {label}
      </figcaption>
      <div
        aria-label={`${label} por período`}
        className="w-full"
        role="img"
        style={{ height: Math.max(220, data.length * 54) }}
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ bottom: 8, left: 12, right: 30, top: 8 }}
          >
            <CartesianGrid
              stroke={INSTITUTIONAL_CHART_COLORS.grid}
              strokeDasharray="3 3"
            />
            <XAxis domain={domain} type="number" />
            <YAxis dataKey="campaign" type="category" width={125} />
            <Tooltip
              formatter={(value) => [
                `${formatNumber(Number(value))}${unit}`,
                label,
              ]}
            />
            <Bar dataKey="value" isAnimationActive={false} radius={[0, 6, 6, 0]}>
              {chartData.map((period, index) => (
                <Cell
                  fill={seriesColors[index % seriesColors.length]}
                  key={period.id}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function StarDistributionChart({
  periods,
}: {
  periods: CampaignComparisonPeriod[];
}) {
  const chartData = [1, 2, 3, 4, 5].map((stars) => ({
    stars: `${stars} ${stars === 1 ? "estrella" : "estrellas"}`,
    ...Object.fromEntries(
      periods.map((period) => [
        period.campaign.id,
        period.starDistribution.find((bucket) => bucket.stars === stars)
          ?.percentage ?? 0,
      ]),
    ),
  }));
  return (
    <figure className="mt-8">
      <figcaption className="mb-1 text-sm font-bold text-mendoza-text">
        Distribución de certificaciones por estrellas
      </figcaption>
      <p className="mb-3 text-xs text-mendoza-muted">
        Porcentajes dentro de la base con certificación de cada etapa; no se
        promedian categorías ordinales.
      </p>
      <div
        aria-label="Distribución de estrellas por período"
        className="h-80 w-full"
        role="img"
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid
              stroke={INSTITUTIONAL_CHART_COLORS.grid}
              strokeDasharray="3 3"
            />
            <XAxis dataKey="stars" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(value, name) => [`${formatNumber(Number(value))} %`, String(name)]} />
            <Legend />
            {periods.map((period, index) => (
              <Bar
                dataKey={period.campaign.id}
                fill={seriesColors[index % seriesColors.length]}
                isAnimationActive={false}
                key={period.campaign.id}
                name={period.campaign.name}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function ComparisonTable({
  comparison,
}: {
  comparison: CampaignComparisonResponse;
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <caption className="mb-3 text-left font-bold text-mendoza-text">
          Detalle textual de la comparación
        </caption>
        <thead>
          <tr className="bg-mendoza-background text-mendoza-text">
            <th className="rounded-l-lg px-3 py-3" scope="col">Período</th>
            <th className="px-3 py-3" scope="col">Escuelas con resultado</th>
            <th className="px-3 py-3" scope="col">Cobertura</th>
            <th className="px-3 py-3" scope="col">Puntaje general</th>
            <th className="rounded-r-lg px-3 py-3" scope="col">Distribución de estrellas</th>
          </tr>
        </thead>
        <tbody>
          {comparison.periods.map((period) => {
            const isBaseline =
              period.campaign.id === comparison.baselineCampaignId;
            return (
              <tr className="border-b border-mendoza-border" key={period.campaign.id}>
                <th className="px-3 py-3 font-semibold text-mendoza-text" scope="row">
                  {period.campaign.name}
                  {isBaseline && (
                    <span className="ml-2 rounded-full bg-mendoza-blue/10 px-2 py-1 text-xs text-mendoza-blue">
                      Referencia
                    </span>
                  )}
                  <span className="mt-1 block text-xs font-normal text-mendoza-muted">
                    {campaignTypeLabel(period.campaign.type)} · {formatDateRange(period.campaign.startsAt, period.campaign.endsAt)}
                  </span>
                  {comparison.radarComparison.selectedSchoolId &&
                    period.calculationMetadata.calculatedAt && (
                      <span className="mt-1 block text-xs font-normal text-mendoza-muted">
                        Resultado vigente calculado el {formatDateTime(period.calculationMetadata.calculatedAt)}
                        {period.calculationMetadata.calculationSource &&
                          ` · ${calculationSourceLabel(period.calculationMetadata.calculationSource)}`}
                      </span>
                    )}
                </th>
                <td className="px-3 py-3 text-mendoza-text">
                  {period.metrics.schoolsWithResult} de {period.metrics.universeSchools}
                </td>
                <td className="px-3 py-3 text-mendoza-text">
                  <span className="font-semibold">
                    {formatNumber(period.metrics.coveragePercentage)} %
                  </span>
                </td>
                <td className="px-3 py-3 text-mendoza-text">
                  <span className="font-semibold">
                    {formatOptionalMetric(period.metrics.generalAverage, "/ 100")}
                  </span>
                </td>
                <td className="px-3 py-3 text-mendoza-text">
                  {formatStarDistribution(period)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RadarTrajectory({
  comparison,
}: {
  comparison: CampaignComparisonResponse;
}) {
  const titleId = useId();
  const radar = comparison.radarComparison;
  if (!radar.available) {
    return (
      <Card>
        <h3 className="text-lg font-bold text-mendoza-text">
          Trayectoria multidimensional
        </h3>
        <div className="mt-4 rounded-xl border border-mendoza-border bg-mendoza-background p-4 text-sm text-mendoza-muted">
          {radarReasonMessage(radar.reason)}
        </div>
      </Card>
    );
  }

  const dimensionData = [...comparison.commonDimensions]
    .sort((left, right) => left.order - right.order)
    .map((dimension) => ({
      ...dimension,
      ...Object.fromEntries(
        comparison.periods.map((period) => [
          period.campaign.id,
          period.metrics.dimensionAverages.find(
            ({ code }) => code === dimension.code,
          )?.average ?? null,
        ]),
      ),
    }));
  const canRender = dimensionData.length >= 3;

  return (
    <Card aria-labelledby={titleId}>
      <h3 className="text-lg font-bold text-mendoza-text" id={titleId}>
        Trayectoria multidimensional de la escuela
      </h3>
      <p className="mt-1 text-sm text-mendoza-muted">
        Superposición de los puntajes persistidos para cada período seleccionado.
      </p>
      <div
        className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${radar.comparable ? "border-green-200 bg-green-50 text-green-900" : "border-amber-300 bg-amber-50 text-amber-950"}`}
        role="status"
      >
        {radar.comparable ? (
          <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
        ) : (
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
        )}
        <p>
          {radar.comparable
            ? "Las versiones de cuestionario y algoritmo son equivalentes; la trayectoria dimensional es comparable."
            : radarReasonMessage(radar.reason)}
        </p>
      </div>

      {canRender ? (
        <div
          aria-label="Radar superpuesto de la trayectoria por períodos"
          className="mt-5 h-[470px] w-full sm:h-[540px]"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <RadarChart
              data={dimensionData}
              margin={{ bottom: 70, left: 80, right: 80, top: 70 }}
              outerRadius="62%"
            >
              <PolarGrid stroke={INSTITUTIONAL_CHART_COLORS.grid} />
              <PolarAngleAxis
                dataKey="title"
                tick={(properties) => <ComparisonRadarTick {...properties} />}
              />
              <PolarRadiusAxis
                angle={90}
                axisLine={false}
                domain={[0, 100]}
                tickCount={6}
                tick={{ fill: INSTITUTIONAL_CHART_COLORS.axis, fontSize: 11 }}
              />
              <Tooltip formatter={(value, name) => [`${formatNumber(Number(value))} / 100`, String(name)]} />
              <Legend />
              {comparison.periods.map((period, index) => (
                <Radar
                  dataKey={period.campaign.id}
                  fill={seriesColors[index % seriesColors.length]}
                  fillOpacity={0.08}
                  isAnimationActive={false}
                  key={period.campaign.id}
                  name={period.campaign.name}
                  stroke={seriesColors[index % seriesColors.length]}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-mendoza-background p-4 text-sm text-mendoza-muted">
          No hay al menos tres dimensiones comunes con resultado en todos los períodos para representar el radar.
        </p>
      )}
      <RadarComparisonTable
        dimensions={dimensionData}
        periods={comparison.periods}
      />
    </Card>
  );
}

function RadarComparisonTable({
  dimensions,
  periods,
}: {
  dimensions: Array<Record<string, string | number | null>>;
  periods: CampaignComparisonPeriod[];
}) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="mb-3 text-left font-bold text-mendoza-text">
          Alternativa textual del radar histórico
        </caption>
        <thead>
          <tr className="bg-mendoza-background">
            <th className="rounded-l-lg px-3 py-3" scope="col">Dimensión</th>
            {periods.map((period, index) => (
              <th className={index === periods.length - 1 ? "rounded-r-lg px-3 py-3" : "px-3 py-3"} key={period.campaign.id} scope="col">
                {period.campaign.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dimension) => (
            <tr key={String(dimension.code)}>
              <th className="border-b border-mendoza-border px-3 py-3 font-medium text-mendoza-text" scope="row">
                {String(dimension.title)}
              </th>
              {periods.map((period) => {
                const value = dimension[period.campaign.id];
                return (
                  <td className="border-b border-mendoza-border px-3 py-3" key={period.campaign.id}>
                    {typeof value === "number" ? `${formatNumber(value)} / 100` : "No disponible"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ComparisonRadarTickProps = {
  x?: string | number;
  y?: string | number;
  textAnchor?: "start" | "middle" | "end" | "inherit";
  payload?: { value?: string | number };
};

function ComparisonRadarTick({
  x = 0,
  y = 0,
  textAnchor = "middle",
  payload,
}: ComparisonRadarTickProps) {
  const normalizedX = Number(x);
  const lines = wrapChartLabel(String(payload?.value ?? ""), 23);
  return (
    <text
      fill={INSTITUTIONAL_CHART_COLORS.label}
      fontSize={11}
      fontWeight={600}
      textAnchor={textAnchor}
      x={normalizedX}
      y={Number(y)}
    >
      {lines.map((line, index) => (
        <tspan dy={index === 0 ? 0 : 14} key={`${line}-${index}`} x={normalizedX}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function radarReasonMessage(reason: CampaignComparisonRadarReason | null) {
  switch (reason) {
    case "single_school_required":
      return "Seleccioná exactamente una escuela en los filtros para superponer su trayectoria por dimensiones.";
    case "missing_result":
      return "La escuela no tiene un resultado vigente en todos los períodos seleccionados. Las métricas disponibles se conservan sin completar faltantes con cero.";
    case "different_survey_version":
      return "Los períodos usan versiones distintas del cuestionario. El radar se muestra sólo como trayectoria descriptiva y no implica equivalencia entre dimensiones.";
    case "different_algorithm_version":
      return "Los períodos fueron calculados con versiones distintas del algoritmo. El radar es descriptivo y no debe interpretarse como una comparación equivalente.";
    case "unknown_calculation_metadata":
      return "Uno o más resultados históricos no conservan toda la metadata de cálculo. El radar es descriptivo y no debe interpretarse como una comparación equivalente.";
    default:
      return "La trayectoria por dimensiones no está disponible para esta selección.";
  }
}

function campaignLabel(
  campaigns: ParticipationFilterOptions["campaigns"],
  campaignId: string,
) {
  const campaign = campaigns.find(({ id }) => id === campaignId);
  return campaign
    ? `${campaign.name} · ${statusLabel(campaign.status)} · ${formatDateRange(campaign.startsAt, campaign.endsAt)}`
    : campaignId;
}

function statusLabel(status: string) {
  return status === "active"
    ? "Activa"
    : status === "closed"
      ? "Cerrada"
      : status === "draft"
        ? "Borrador"
        : "Archivada";
}

function formatOptionalMetric(value: number | null, suffix: string) {
  return value === null ? "No disponible" : `${formatNumber(value)} ${suffix}`;
}

function formatStarDistribution(period: CampaignComparisonPeriod) {
  const values = period.starDistribution
    .filter(({ count }) => count > 0)
    .map(
      ({ stars, count, percentage }) =>
        `${stars}★: ${count} (${formatNumber(percentage)} %)`,
    );
  return values.length ? values.join(" · ") : "Sin certificaciones";
}

function campaignTypeLabel(type: "annual" | "semiannual") {
  return type === "annual" ? "Operativo anual" : "Monitoreo semestral";
}

function calculationSourceLabel(
  source: NonNullable<
    CampaignComparisonPeriod["calculationMetadata"]["calculationSource"]
  >,
) {
  return source === "submission_finalization"
    ? "Cálculo del envío final"
    : source === "single_recalculation"
      ? "Recálculo individual"
      : "Cálculo del sistema";
}

function formatDateRange(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Mendoza",
  });
  return `${formatter.format(new Date(startsAt))} al ${formatter.format(new Date(endsAt))}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Mendoza",
  }).format(new Date(value));
}

function institutionalComparisonFilters(filters: ParticipationFilters) {
  const scopedFilters = { ...filters };
  delete scopedFilters.submissionStatuses;
  delete scopedFilters.stars;
  delete scopedFilters.criticalAreas;
  return scopedFilters;
}

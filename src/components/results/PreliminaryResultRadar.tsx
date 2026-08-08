import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PreliminaryResultDimension } from "../../types/school-result";

const chartColors = {
  primary: "#000F9F",
  secondary: "#3CB4E5",
  grid: "#E5E7EB",
};

type RadarAxisTickProps = {
  x?: string | number;
  y?: string | number;
  textAnchor?: "start" | "middle" | "end" | "inherit";
  payload?: { value?: string | number };
};

export function PreliminaryResultRadar({
  dimensions,
}: {
  dimensions: PreliminaryResultDimension[];
}) {
  const orderedDimensions = [...dimensions].sort(
    (left, right) => left.order - right.order,
  );
  const canRenderRadar =
    orderedDimensions.length === 6 &&
    orderedDimensions.every(
      ({ score }) =>
        score !== null &&
        Number.isFinite(score) &&
        score >= 0 &&
        score <= 100,
    );

  return (
    <section aria-labelledby="dimension-radar-title">
      <h2
        className="text-xl font-bold text-mendoza-text"
        id="dimension-radar-title"
      >
        Perfil por dimensiones
      </h2>
      <p className="mt-1 text-sm text-mendoza-muted">
        Comparación de los seis resultados sobre una escala de 0 a 100.
      </p>

      {canRenderRadar ? (
        <div
          aria-label="Gráfico radar con los resultados de las seis dimensiones"
          className="mt-4 h-[390px] w-full sm:h-[460px]"
          role="img"
        >
          <ResponsiveContainer height="100%" width="100%">
            <RadarChart
              data={orderedDimensions}
              margin={{ bottom: 50, left: 65, right: 65, top: 50 }}
              outerRadius="68%"
            >
              <PolarGrid stroke={chartColors.grid} />
              <PolarAngleAxis
                dataKey="title"
                tick={(properties) => <RadarAxisTick {...properties} />}
              />
              <PolarRadiusAxis
                angle={90}
                axisLine={false}
                domain={[0, 100]}
                tickCount={6}
                tick={{ fill: "#6B7280", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [
                  `${formatScore(Number(value))} puntos`,
                  "Puntaje",
                ]}
                labelFormatter={(label) => String(label)}
              />
              <Radar
                dataKey="score"
                fill={chartColors.secondary}
                fillOpacity={0.3}
                name="Puntaje"
                stroke={chartColors.primary}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="mt-5 rounded-xl border border-mendoza-border bg-mendoza-background p-5 text-sm text-mendoza-muted"
          role="status"
        >
          El gráfico no puede representarse sin los seis puntajes. Los valores
          disponibles se mantienen debajo sin reemplazar los faltantes por
          cero.
        </div>
      )}

      <dl
        aria-label="Alternativa textual del gráfico radar"
        className="mt-5 grid gap-3 sm:grid-cols-2"
      >
        {orderedDimensions.map((dimension) => (
          <div
            className="flex items-center justify-between gap-4 rounded-xl border border-mendoza-border bg-mendoza-background px-4 py-3"
            key={dimension.code}
          >
            <dt className="text-sm font-medium text-mendoza-text">
              {dimension.title}
            </dt>
            <dd className="shrink-0 font-bold text-mendoza-blue">
              {dimension.score === null
                ? "No disponible"
                : `${formatScore(dimension.score)} / 100`}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RadarAxisTick({
  x = 0,
  y = 0,
  textAnchor = "middle",
  payload,
}: RadarAxisTickProps) {
  const normalizedX = Number(x);
  const normalizedY = Number(y);
  const lines = wrapLabel(String(payload?.value ?? ""), 23);
  return (
    <text
      fill="#1F2937"
      fontSize={11}
      fontWeight={600}
      textAnchor={textAnchor}
      x={normalizedX}
      y={normalizedY}
    >
      {lines.map((line, index) => (
        <tspan
          dy={index === 0 ? 0 : 14}
          key={`${line}-${index}`}
          x={normalizedX}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}

function wrapLabel(label: string, maximumLength: number) {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const lastLine = lines.at(-1);
    if (!lastLine || `${lastLine} ${word}`.length > maximumLength) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${lastLine} ${word}`;
    }
  }
  if (lines.length <= 3) return lines;
  return [...lines.slice(0, 2), `${lines.slice(2).join(" ")}…`];
}

function formatScore(score: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(score);
}

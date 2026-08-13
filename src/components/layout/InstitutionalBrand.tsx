import { useState } from "react";

type BrandSurface = "light" | "blue";

type InstitutionalBrandProps = {
  className?: string;
  compact?: boolean;
  organizationKeys?: readonly OrganizationKey[];
  surface?: BrandSurface;
};

type OrganizationKey = "mendoza" | "health" | "dge" | "ops";

const MENDOZA_DEFAULT_ASSET =
  "/brand/official/mendoza/marca-gobierno-mendoza.png";
const OPS_DEFAULT_ASSETS = ["/brand/official/ops/ops-logo.jpeg"] as const;

function configuredSources(
  configuredSource: string | undefined,
  defaultSources: readonly string[],
) {
  const normalizedSource = configuredSource?.trim();
  return normalizedSource
    ? [
        normalizedSource,
        ...defaultSources.filter((source) => source !== normalizedSource),
      ]
    : defaultSources;
}

function blueSurfaceSources(
  blueSource: string | undefined,
  lightSource: string | undefined,
  defaultSources: readonly string[],
) {
  const normalizedBlueSource = blueSource?.trim();
  if (normalizedBlueSource) {
    const fallbackSources = configuredSources(lightSource, defaultSources);
    return [
      normalizedBlueSource,
      ...fallbackSources.filter((source) => source !== normalizedBlueSource),
    ];
  }

  return configuredSources(lightSource, defaultSources);
}

const organizations = [
  {
    key: "mendoza",
    label: "Gobierno de Mendoza",
    onLight: configuredSources(import.meta.env.VITE_BRAND_MENDOZA_ON_LIGHT, [
      MENDOZA_DEFAULT_ASSET,
    ]),
    onBlue: blueSurfaceSources(
      import.meta.env.VITE_BRAND_MENDOZA_ON_BLUE,
      import.meta.env.VITE_BRAND_MENDOZA_ON_LIGHT,
      [MENDOZA_DEFAULT_ASSET],
    ),
  },
  {
    key: "health",
    label: "Salud",
    onLight: configuredSources(import.meta.env.VITE_BRAND_HEALTH_ON_LIGHT, []),
    onBlue: blueSurfaceSources(
      import.meta.env.VITE_BRAND_HEALTH_ON_BLUE,
      import.meta.env.VITE_BRAND_HEALTH_ON_LIGHT,
      [],
    ),
  },
  {
    key: "dge",
    label: "Dirección General de Escuelas",
    onLight: configuredSources(import.meta.env.VITE_BRAND_DGE_ON_LIGHT, []),
    onBlue: blueSurfaceSources(
      import.meta.env.VITE_BRAND_DGE_ON_BLUE,
      import.meta.env.VITE_BRAND_DGE_ON_LIGHT,
      [],
    ),
  },
  {
    key: "ops",
    label: "Organización Panamericana de la Salud",
    onLight: configuredSources(
      import.meta.env.VITE_BRAND_OPS_ON_LIGHT,
      OPS_DEFAULT_ASSETS,
    ),
    onBlue: blueSurfaceSources(
      import.meta.env.VITE_BRAND_OPS_ON_BLUE,
      import.meta.env.VITE_BRAND_OPS_ON_LIGHT,
      OPS_DEFAULT_ASSETS,
    ),
  },
] as const;

/**
 * Muestra los assets institucionales provisorios o sus reemplazos configurados.
 * Cada archivo ausente o inválido conserva la identificación textual del
 * organismo correspondiente.
 */
export function InstitutionalBrand({
  className = "",
  compact = false,
  organizationKeys,
  surface = "light",
}: InstitutionalBrandProps) {
  const [failedAssets, setFailedAssets] = useState<Set<string>>(new Set());
  const [sourceIndexes, setSourceIndexes] = useState<Record<string, number>>({});
  const textColor = surface === "blue" ? "text-white/85" : "text-mendoza-muted";
  const visibleOrganizations = organizationKeys
    ? organizations.filter((organization) =>
        organizationKeys.includes(organization.key),
      )
    : organizations;

  return (
    <div
      aria-label="Organismos participantes"
      className={`flex flex-wrap items-center ${compact ? "gap-x-3 gap-y-2" : "gap-x-5 gap-y-3"} ${className}`}
    >
      {visibleOrganizations.map((organization) => {
        const sources =
          surface === "blue" ? organization.onBlue : organization.onLight;
        const assetKey = `${organization.key}:${surface}`;
        const sourceIndex = sourceIndexes[assetKey] ?? 0;
        const source = sources[sourceIndex];
        const showImage = Boolean(source) && !failedAssets.has(assetKey);
        return showImage ? (
          <span
            className={`inline-flex max-w-full shrink-0 items-center justify-center ${
              surface === "blue"
                ? "rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-white/25"
                : ""
            }`}
            key={organization.key}
          >
            <img
              alt={organization.label}
              className={
                organization.key === "ops"
                  ? compact
                    ? "h-14 w-44 max-w-full object-contain"
                    : "h-20 w-56 max-w-full object-contain"
                  : compact
                    ? "h-auto max-h-7 max-w-full object-contain sm:max-w-28"
                    : "h-auto max-h-10 max-w-full object-contain sm:max-w-40"
              }
              onError={() => {
                if (sourceIndex + 1 < sources.length) {
                  setSourceIndexes((current) => ({
                    ...current,
                    [assetKey]: sourceIndex + 1,
                  }));
                  return;
                }

                setFailedAssets((current) => {
                  const next = new Set(current);
                  next.add(assetKey);
                  return next;
                });
              }}
              src={source}
            />
          </span>
        ) : (
          <span
            className={`${compact ? "text-[11px]" : "text-xs"} font-semibold ${textColor}`}
            key={organization.key}
          >
            {organization.label}
          </span>
        );
      })}
    </div>
  );
}

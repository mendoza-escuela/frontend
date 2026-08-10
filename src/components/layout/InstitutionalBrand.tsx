import { useState } from "react";

type BrandSurface = "light" | "blue";

type InstitutionalBrandProps = {
  className?: string;
  compact?: boolean;
  surface?: BrandSurface;
};

const organizations = [
  {
    key: "mendoza",
    label: "Gobierno de Mendoza",
    onLight: import.meta.env.VITE_BRAND_MENDOZA_ON_LIGHT,
    onBlue: import.meta.env.VITE_BRAND_MENDOZA_ON_BLUE,
  },
  {
    key: "health",
    label: "Salud",
    onLight: import.meta.env.VITE_BRAND_HEALTH_ON_LIGHT,
    onBlue: import.meta.env.VITE_BRAND_HEALTH_ON_BLUE,
  },
  {
    key: "dge",
    label: "Dirección General de Escuelas",
    onLight: import.meta.env.VITE_BRAND_DGE_ON_LIGHT,
    onBlue: import.meta.env.VITE_BRAND_DGE_ON_BLUE,
  },
  {
    key: "ops",
    label: "Organización Panamericana de la Salud",
    onLight: import.meta.env.VITE_BRAND_OPS_ON_LIGHT,
    onBlue: import.meta.env.VITE_BRAND_OPS_ON_BLUE,
  },
] as const;

/**
 * Muestra únicamente archivos oficiales configurados. Cada archivo ausente o
 * inválido conserva la identificación textual del organismo correspondiente.
 */
export function InstitutionalBrand({
  className = "",
  compact = false,
  surface = "light",
}: InstitutionalBrandProps) {
  const [failedAssets, setFailedAssets] = useState<Set<string>>(new Set());
  const textColor = surface === "blue" ? "text-white/85" : "text-mendoza-muted";

  return (
    <div
      aria-label="Organismos participantes"
      className={`flex flex-wrap items-center ${compact ? "gap-x-3 gap-y-2" : "gap-x-5 gap-y-3"} ${className}`}
    >
      {organizations.map((organization) => {
        const source = surface === "blue" ? organization.onBlue : organization.onLight;
        const showImage = Boolean(source) && !failedAssets.has(organization.key);
        return showImage ? (
          <img
            alt={organization.label}
            className={compact ? "max-h-7 max-w-28 object-contain" : "max-h-10 max-w-40 object-contain"}
            key={organization.key}
            onError={() =>
              setFailedAssets((current) => {
                const next = new Set(current);
                next.add(organization.key);
                return next;
              })
            }
            src={source}
          />
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

import type { SelectHTMLAttributes } from "react";
import type { SchoolNamedCatalogOption } from "../../types/admin-school";

type OfficialCatalogSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  legacyValue?: string | null;
  options: SchoolNamedCatalogOption[];
  placeholder: string;
  unresolvedLegacy?: boolean;
};

/**
 * Conserva visible un valor histórico que no pertenece al catálogo vigente.
 * La opción histórica queda deshabilitada para que nunca se confunda con una
 * equivalencia oficial ni pueda volver a seleccionarse.
 */
export function OfficialCatalogSelect({
  legacyValue,
  options,
  placeholder,
  unresolvedLegacy = false,
  ...selectProps
}: OfficialCatalogSelectProps) {
  return (
    <>
      <select {...selectProps}>
        <option value="">{placeholder}</option>
        {legacyValue && (
          <option disabled value={legacyValue}>
            Valor anterior sin correspondencia: {legacyValue}
          </option>
        )}
        {options.map((option) => (
          <option key={option.code} value={option.label}>
            {option.label}
          </option>
        ))}
      </select>
      {legacyValue && (
        <span
          className={`mt-2 block rounded-lg border p-3 text-sm font-normal leading-5 ${
            unresolvedLegacy
              ? "border-amber-300 bg-amber-50 text-amber-950"
              : "border-mendoza-sky/50 bg-mendoza-blue-soft text-mendoza-blue"
          }`}
          role={unresolvedLegacy ? "alert" : "status"}
        >
          <strong>Valor anterior sin correspondencia: {legacyValue}.</strong> No
          equivale automáticamente a un tipo de educación. Los niveles
          educativos se informan por separado.{" "}
          {unresolvedLegacy
            ? "Elegí una opción del catálogo oficial antes de guardar."
            : "La opción oficial seleccionada se aplicará al guardar."}
        </span>
      )}
    </>
  );
}

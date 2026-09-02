export function LegacyCatalogNotice({
  legacyValue,
  unresolved,
}: {
  legacyValue: string;
  unresolved: boolean;
}) {
  return (
    <span
      className={`mt-2 block rounded-lg border p-3 text-sm font-normal leading-5 ${
        unresolved
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-mendoza-sky/50 bg-mendoza-blue-soft text-mendoza-blue"
      }`}
      role={unresolved ? "alert" : "status"}
    >
      <strong>Valor anterior sin correspondencia: {legacyValue}.</strong> No
      equivale automáticamente a un tipo de educación. Los niveles educativos
      se informan por separado.{" "}
      {unresolved
        ? "Elegí una opción del catálogo oficial antes de guardar."
        : "La opción oficial seleccionada se aplicará al guardar."}
    </span>
  );
}

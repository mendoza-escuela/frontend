import escuelaLogo from "../../assets/imagenEscuela.png";
import { InstitutionalBrand } from "../layout/InstitutionalBrand";

export function AuthBrandMarks() {
  return (
    <div
      aria-label="Identidad institucional"
      className="grid w-full grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] items-center gap-4"
    >
      <div className="flex min-w-0 items-center justify-center border-r border-mendoza-border pr-4">
        <img
          alt="Escuelas Promotoras de Salud"
          className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          src={escuelaLogo}
        />
      </div>
      <InstitutionalBrand
        className="min-w-0 justify-center"
        compact
        organizationKeys={["mendoza"]}
      />
    </div>
  );
}

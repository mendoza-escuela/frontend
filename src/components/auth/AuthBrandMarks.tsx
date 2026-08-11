import epsLogoHorizontal from "../../assets/eps-logo-horizontal.svg";
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
          className="h-11 max-w-full object-contain sm:h-12"
          src={epsLogoHorizontal}
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

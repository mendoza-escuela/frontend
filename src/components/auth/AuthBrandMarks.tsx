import { InstitutionalBrand } from "../layout/InstitutionalBrand";

export function AuthBrandMarks() {
  return (
    <div
      aria-label="Identidad institucional"
      className="grid w-full min-w-0 grid-cols-1 items-center gap-3 sm:grid-cols-[1.3fr_1fr_0.9fr] sm:gap-4"
    >
      <div className="flex min-h-16 min-w-0 items-center justify-center">
        <InstitutionalBrand
          className="w-full min-w-0 justify-center"
          compact
          organizationKeys={["ops"]}
        />
      </div>
      <div className="flex min-h-16 min-w-0 items-center justify-center">
        <InstitutionalBrand
          className="w-full min-w-0 justify-center"
          compact
          organizationKeys={["eps"]}
        />
      </div>
      <div className="flex min-h-16 min-w-0 items-center justify-center">
        <InstitutionalBrand
          className="w-full min-w-0 justify-center"
          organizationKeys={["mendoza"]}
        />
      </div>
    </div>
  );
}

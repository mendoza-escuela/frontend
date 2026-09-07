import { InstitutionalBrand } from "../layout/InstitutionalBrand";

export function AuthBrandMarks() {
  return (
    <div
      aria-label="Identidad institucional"
      className="flex w-full min-w-0 justify-center"
    >
      <InstitutionalBrand
        className="min-w-0 max-w-full justify-center"
        organizationKeys={["eps", "mendoza"]}
      />
    </div>
  );
}

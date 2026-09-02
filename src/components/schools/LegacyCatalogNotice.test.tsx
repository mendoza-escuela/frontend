// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegacyCatalogNotice } from "./LegacyCatalogNotice";

describe("LegacyCatalogNotice", () => {
  it("alerta mientras el valor legado sigue sin resolver", () => {
    render(<LegacyCatalogNotice legacyValue="Primario" unresolved />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Elegí una opción del catálogo oficial antes de guardar.",
    );
  });

  it("informa cuando ya se eligió un valor oficial", () => {
    render(
      <LegacyCatalogNotice legacyValue="Primario" unresolved={false} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "La opción oficial seleccionada se aplicará al guardar.",
    );
  });
});

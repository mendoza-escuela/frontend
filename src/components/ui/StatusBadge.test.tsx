// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ActiveStatusBadge,
  CampaignStatusBadge,
  VersionStatusBadge,
} from "./StatusBadge";

describe("StatusBadge", () => {
  afterEach(cleanup);

  it("usa el mismo estilo de éxito con contraste accesible", () => {
    render(
      <>
        <ActiveStatusBadge isActive />
        <VersionStatusBadge status="published" />
        <CampaignStatusBadge status="active" />
      </>,
    );

    for (const label of ["Activo", "Publicada", "Activa"]) {
      expect(screen.getByText(label)).toHaveClass(
        "bg-green-100",
        "text-green-800",
      );
    }
  });
});

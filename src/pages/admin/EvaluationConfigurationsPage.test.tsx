// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { evaluationConfigurationsService } from "../../services/evaluation-configurations.service";
import { EvaluationConfigurationsPage } from "./EvaluationConfigurationsPage";

vi.mock("../../services/evaluation-configurations.service", () => ({
  evaluationConfigurationsService: {
    list: vi.fn(), create: vi.fn(), update: vi.fn(), clone: vi.fn(), validate: vi.fn(), activate: vi.fn(), archive: vi.fn(),
  },
}));

const activeConfiguration = {
  id: "configuration-1", versionCode: "v1.0.0", name: "Inicial", description: null, status: "active" as const,
  mentalHealthCriticalThreshold: "33", mentalHealthMaxStars: 4, metadata: {}, createdAt: "2026-07-31T12:00:00Z", activatedAt: "2026-07-31T12:05:00Z", archivedAt: null,
  createdBy: null, activatedBy: null,
  starRanges: [1,2,3,4,5].map((stars,index)=>({ id:`range-${stars}`, stars, lowerBound:index*20, upperBound:stars*20, lowerInclusive:stars===1, upperInclusive:true, order:stars })),
};

describe("EvaluationConfigurationsPage", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(evaluationConfigurationsService.list).mockResolvedValue([activeConfiguration]); });
  it("shows history, active status and only the permitted actions", async () => {
    render(<EvaluationConfigurationsPage />);
    expect(await screen.findByText(/v1.0.0 · Inicial/)).toBeVisible();
    expect(screen.getByText("Activa")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clonar" })).toBeVisible();
  });
  it("renders five explicit editable ranges in a new draft", async () => {
    render(<EvaluationConfigurationsPage />);
    await screen.findByText(/v1.0.0 · Inicial/);
    expect(screen.getAllByLabelText(/Límite inferior/i)).toHaveLength(5);
    expect(screen.getAllByLabelText(/Límite superior/i)).toHaveLength(5);
  });

  it("muestra las validaciones finales del formulario en español", async () => {
    render(<EvaluationConfigurationsPage />);
    await screen.findByText(/v1.0.0 · Inicial/);
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(
      await screen.findByText("Ingresá el código de versión."),
    ).toBeVisible();
    expect(
      screen.getByText("Ingresá el nombre de la configuración."),
    ).toBeVisible();
    expect(screen.queryByText(/too small|expected string/i)).toBeNull();
  });
});

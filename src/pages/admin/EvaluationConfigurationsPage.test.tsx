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
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("opens the new configuration editor in a modal with five ranges", async () => {
    render(<EvaluationConfigurationsPage />);
    await screen.findByText(/v1.0.0 · Inicial/);
    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Nueva configuración" }),
    ).toBeVisible();
    expect(screen.getAllByLabelText(/Límite inferior/i)).toHaveLength(5);
    expect(screen.getAllByLabelText(/Límite superior/i)).toHaveLength(5);
  });

  it("muestra un resumen visual y campos claramente delimitados", async () => {
    render(<EvaluationConfigurationsPage />);
    expect(await screen.findByText("Versión activa")).toBeVisible();
    expect(screen.getByText("Borradores")).toBeVisible();
    expect(screen.queryByLabelText("Código de versión")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );
    expect(screen.getByLabelText("Código de versión")).toHaveClass("border");
    expect(screen.getByLabelText("Nombre")).toHaveAttribute(
      "placeholder",
      "Nombre descriptivo de la configuración",
    );
    expect(screen.getByText("Regla de criticidad")).toBeVisible();
  });

  it("rechaza límites decimales en los rangos de estrellas", async () => {
    render(<EvaluationConfigurationsPage />);
    await screen.findByText("Versión activa");
    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );
    const decimalInput = screen.getAllByLabelText(/Límite inferior/i)[1];
    fireEvent.change(decimalInput, {
      target: { value: "20.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(decimalInput).toBeInvalid();
    expect(evaluationConfigurationsService.create).not.toHaveBeenCalled();
  });

  it("muestra las validaciones finales del formulario en español", async () => {
    render(<EvaluationConfigurationsPage />);
    await screen.findByText(/v1.0.0 · Inicial/);
    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(
      await screen.findByText("Ingresá el código de versión."),
    ).toBeVisible();
    expect(
      screen.getByText("Ingresá el nombre de la configuración."),
    ).toBeVisible();
    expect(screen.queryByText(/too small|expected string/i)).toBeNull();
  });

  it("confirma antes de cerrar el modal si hay cambios sin guardar", async () => {
    render(<EvaluationConfigurationsPage />);
    await screen.findByText(/v1.0.0 · Inicial/);
    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Configuración de prueba" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.getByRole("dialog", { name: "Descartar cambios" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

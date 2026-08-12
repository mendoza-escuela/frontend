// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const archivedConfiguration = {
  ...activeConfiguration,
  id: "configuration-archived",
  versionCode: "v0.9.0",
  name: "Anterior",
  status: "archived" as const,
  archivedAt: "2026-07-30T12:00:00Z",
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

  it("oculta las archivadas por defecto y permite incluirlas con el switch", async () => {
    vi.mocked(evaluationConfigurationsService.list).mockResolvedValue([
      activeConfiguration,
      archivedConfiguration,
    ]);

    render(<EvaluationConfigurationsPage />);

    expect(await screen.findByText(/v1.0.0 · Inicial/)).toBeVisible();
    expect(screen.queryByText(/v0.9.0 · Anterior/)).not.toBeInTheDocument();
    const filter = screen.getByRole("switch", {
      name: "Mostrar solo configuraciones activas y borradores",
    });
    expect(filter).toHaveAttribute("aria-checked", "true");

    fireEvent.click(filter);

    expect(screen.getByText(/v0.9.0 · Anterior/)).toBeVisible();
    expect(filter).toHaveAttribute("aria-checked", "false");
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

  it("limita los puntajes a enteros no negativos y permite elegir el máximo con estrellas", async () => {
    render(<EvaluationConfigurationsPage />);
    await screen.findByText("Versión activa");
    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );

    const threshold = screen.getByLabelText(/Umbral Salud Mental/);
    expect(threshold).toHaveAttribute("min", "0");
    expect(threshold).toHaveAttribute("max", "100");
    expect(threshold).toHaveAttribute("step", "1");
    expect(fireEvent.keyDown(threshold, { key: "-" })).toBe(false);
    expect(fireEvent.keyDown(threshold, { key: "." })).toBe(false);

    const lowerBounds = screen.getAllByLabelText(/Límite inferior/i);
    expect(lowerBounds[0]).toHaveAttribute("min", "0");
    expect(lowerBounds[0]).toHaveAttribute("max", "100");
    expect(lowerBounds[0]).toHaveAttribute("step", "1");

    const fiveStars = screen.getByRole("radio", { name: "5 estrellas" });
    fireEvent.click(fiveStars);
    expect(fiveStars).toBeChecked();
    expect(screen.getByText("5 de 5 estrellas")).toBeVisible();
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
    expect(document.body.style.overflow).not.toBe("hidden");

    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Nueva configuración" }),
    ).toBeVisible();
  });

  it("muestra y enfoca el código cuando ya existe otra configuración", async () => {
    vi.mocked(evaluationConfigurationsService.create).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          code: "EVALUATION_VERSION_CODE_CONFLICT",
          field: "versionCode",
          message: "Ya existe una configuración con ese código de versión.",
        },
      },
    });
    render(<EvaluationConfigurationsPage />);
    await screen.findByText("Versión activa");
    fireEvent.click(
      screen.getByRole("button", { name: "Nueva configuración" }),
    );
    const versionCode = screen.getByLabelText("Código de versión");
    fireEvent.change(versionCode, { target: { value: "v1.0.0" } });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Duplicada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect(
      await screen.findByText(
        "Ya existe una configuración con ese código de versión.",
      ),
    ).toBeVisible();
    await waitFor(() => expect(versionCode).toHaveFocus());
    expect(versionCode).toHaveValue("v1.0.0");
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});

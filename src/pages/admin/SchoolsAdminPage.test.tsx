// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSchoolsService } from "../../services/admin-schools.service";
import { SchoolsAdminPage } from "./SchoolsAdminPage";

vi.mock("../../services/admin-schools.service", () => ({ adminSchoolsService: { list: vi.fn(), filters: vi.fn(), setStatus: vi.fn(), export: vi.fn() } }));

describe("SchoolsAdminPage", () => {
  beforeEach(() => {
    vi.mocked(adminSchoolsService.list).mockResolvedValue({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    vi.mocked(adminSchoolsService.filters).mockResolvedValue({ departments: ["Capital", "Godoy Cruz"], localities: ["Centro"], educationLevels: ["Primario"], managementTypes: ["Estatal"], scopes: ["Urbano"], shifts: [] });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("permite buscar dentro de los filtros desplegables", async () => {
    render(<MemoryRouter><SchoolsAdminPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Departamento" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Buscar en Departamento" }), { target: { value: "Godoy" } });
    expect(screen.queryByRole("option", { name: "Capital" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Godoy Cruz" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(adminSchoolsService.list).toHaveBeenLastCalledWith(expect.objectContaining({ department: "Godoy Cruz" }), expect.any(AbortSignal)));
  });

  it("convierte el filtro de estado a booleano", async () => {
    render(<MemoryRouter><SchoolsAdminPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Estado" }));
    fireEvent.click(screen.getByRole("option", { name: "Inactivos" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(adminSchoolsService.list).toHaveBeenLastCalledWith(expect.objectContaining({ isActive: false }), expect.any(AbortSignal)));
  });
});

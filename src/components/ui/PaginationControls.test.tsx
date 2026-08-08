// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PaginationControls } from "./PaginationControls";

describe("PaginationControls", () => {
  afterEach(cleanup);

  it("muestra el rango y navega dentro de los límites", () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        onPageChange={onPageChange}
        pagination={{ page: 2, limit: 20, total: 45, totalPages: 3 }}
      />,
    );

    expect(screen.getByText(/Mostrando 21-40 de 45/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("bloquea la navegación cuando no hay resultados", () => {
    render(
      <PaginationControls
        onPageChange={vi.fn()}
        pagination={{ page: 1, limit: 20, total: 0, totalPages: 1 }}
      />,
    );

    expect(screen.getByText(/Mostrando 0-0 de 0/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});

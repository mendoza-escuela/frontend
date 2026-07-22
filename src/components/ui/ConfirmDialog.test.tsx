// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  afterEach(cleanup);

  it("no renderiza contenido cuando está cerrado", () => {
    render(
      <ConfirmDialog
        description="Acción irreversible"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open={false}
        title="Eliminar versión"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite confirmar o cancelar la acción", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        confirmLabel="Eliminar"
        description="Acción irreversible"
        destructive
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Eliminar versión"
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Eliminar versión",
    );
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("bloquea las acciones mientras procesa", () => {
    render(
      <ConfirmDialog
        description="Publicando"
        isProcessing
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        title="Publicar versión"
      />,
    );

    expect(screen.getByRole("button", { name: "Procesando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});

import { describe, expect, it } from "vitest";
import { getHttpErrorMessage } from "./http-error";

const axiosError = (message: unknown, withResponse = true, status = 400) => ({
  isAxiosError: true,
  response: withResponse ? { data: { message }, status } : undefined,
});

describe("getHttpErrorMessage", () => {
  it("conserva mensajes funcionales en español", () => {
    expect(
      getHttpErrorMessage(axiosError("La configuración ya está activa.")),
    ).toBe("La configuración ya está activa.");
  });

  it("no expone mensajes técnicos o en inglés", () => {
    expect(
      getHttpErrorMessage(
        axiosError("Too small: expected string to have >=1 characters"),
      ),
    ).toBe("No pudimos completar la operación. Intentá nuevamente.");
    expect(getHttpErrorMessage(axiosError("Internal server error"))).toBe(
      "Ocurrió un error interno. Intentá nuevamente más tarde.",
    );
  });

  it("explica en español los problemas de conexión", () => {
    expect(getHttpErrorMessage(axiosError(null, false))).toMatch(
      /comunicarnos con el servidor/i,
    );
  });

  it("traduce el límite de solicitudes sin exponer la excepción técnica", () => {
    expect(
      getHttpErrorMessage(
        axiosError("ThrottlerException: Too Many Requests", true, 429),
      ),
    ).toMatch(/demasiadas solicitudes/i);
  });
});

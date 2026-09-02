// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicRuntimeConfig } from "./runtime-config";

afterEach(() => {
  delete window.__APP_CONFIG__;
  vi.unstubAllEnvs();
});

describe("getPublicRuntimeConfig", () => {
  it("prioriza la configuración entregada al iniciar el contenedor", () => {
    vi.stubEnv("VITE_API_URL", "/api");
    window.__APP_CONFIG__ = {
      VITE_API_URL: "https://api.example.org/api",
    };

    expect(getPublicRuntimeConfig("VITE_API_URL")).toBe(
      "https://api.example.org/api",
    );
  });

  it("usa import.meta.env durante el desarrollo local", () => {
    expect(getPublicRuntimeConfig("VITE_API_URL")).toBe(
      import.meta.env.VITE_API_URL,
    );
  });
});

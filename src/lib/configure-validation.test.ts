import { describe, expect, it } from "vitest";
import { z } from "zod";
import { configureValidationMessages } from "./configure-validation";

describe("configureValidationMessages", () => {
  it("configura los mensajes predeterminados de Zod en español", () => {
    configureValidationMessages();
    const result = z.string().min(1).safeParse("");
    expect(result.error?.issues[0]?.message).toMatch(/demasiado pequeño/i);
    expect(result.error?.issues[0]?.message).not.toMatch(/too small|expected/i);
  });
});

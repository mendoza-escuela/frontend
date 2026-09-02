import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

describe("formatNumber", () => {
  it("usa la convención es-AR y hasta dos decimales", () => {
    expect(formatNumber(1234.5)).toBe("1.234,5");
    expect(formatNumber(98.126)).toBe("98,13");
    expect(formatNumber(42)).toBe("42");
  });
});

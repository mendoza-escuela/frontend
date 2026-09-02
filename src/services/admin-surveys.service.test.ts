import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import type { ApplicabilityRule } from "../types/admin-survey";
import { adminSurveysService } from "./admin-surveys.service";

vi.mock("../lib/api", () => ({
  api: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../lib/download", () => ({ downloadBlob: vi.fn() }));

const expectedUpdatedAt = "2026-08-01T00:00:00.000Z";
const versionUpdatedAt = "2026-08-01T00:00:00.001Z";
const responseHeaders = {
  "x-survey-version-updated-at": versionUpdatedAt,
};
const rule: ApplicabilityRule = {
  id: "rule-1",
  questionId: "question-1",
  groupOperator: "all",
  action: "omit",
  defaultAction: "show",
  order: 0,
  conditions: [
    {
      feature: "has_kiosk",
      operator: "equals",
      expectedValue: true,
      order: 0,
    },
  ],
};
const writeInput = {
  groupOperator: rule.groupOperator,
  action: rule.action,
  defaultAction: rule.defaultAction,
  order: rule.order,
  conditions: rule.conditions,
};

describe("adminSurveysService applicability revision contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.post).mockResolvedValue({
      data: rule,
      headers: responseHeaders,
    });
    vi.mocked(api.put).mockResolvedValue({
      data: rule,
      headers: responseHeaders,
    });
    vi.mocked(api.delete).mockResolvedValue({
      data: undefined,
      headers: responseHeaders,
    });
    vi.mocked(api.get).mockResolvedValue({
      data: [rule],
      headers: responseHeaders,
    });
  });

  it("adopta reglas y revisión del mismo snapshot de lectura", async () => {
    await expect(
      adminSurveysService.listApplicabilityRules(
        "survey-1",
        "version-1",
        "question-1",
      ),
    ).resolves.toEqual({ rules: [rule], versionUpdatedAt });
  });

  it("envía la revisión y recupera la nueva en altas y ediciones", async () => {
    const created = await adminSurveysService.createApplicabilityRule(
      "survey-1",
      "version-1",
      "question-1",
      writeInput,
      expectedUpdatedAt,
    );
    const updated = await adminSurveysService.updateApplicabilityRule(
      "survey-1",
      "version-1",
      "question-1",
      "rule-1",
      writeInput,
      expectedUpdatedAt,
    );

    expect(api.post).toHaveBeenCalledWith(expect.any(String), {
      ...writeInput,
      expectedUpdatedAt,
    });
    expect(api.put).toHaveBeenCalledWith(expect.any(String), {
      ...writeInput,
      expectedUpdatedAt,
    });
    expect(created).toEqual({ rule, versionUpdatedAt });
    expect(updated).toEqual({ rule, versionUpdatedAt });
  });

  it("envía la revisión en alta múltiple, borrado y reordenamiento", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: [rule],
      headers: responseHeaders,
    });
    vi.mocked(api.put).mockResolvedValueOnce({
      data: [rule],
      headers: responseHeaders,
    });

    const bulk = await adminSurveysService.createApplicabilityRuleBulk(
      "survey-1",
      "version-1",
      ["question-1", "question-2"],
      writeInput,
      expectedUpdatedAt,
    );
    const removed = await adminSurveysService.removeApplicabilityRule(
      "survey-1",
      "version-1",
      "question-1",
      "rule-1",
      expectedUpdatedAt,
    );
    const reordered = await adminSurveysService.reorderApplicabilityRules(
      "survey-1",
      "version-1",
      "question-1",
      ["rule-1"],
      expectedUpdatedAt,
    );

    expect(api.post).toHaveBeenCalledWith(expect.any(String), {
      questionIds: ["question-1", "question-2"],
      rule: writeInput,
      expectedUpdatedAt,
    });
    expect(api.delete).toHaveBeenCalledWith(expect.any(String), {
      params: { expectedUpdatedAt },
    });
    expect(api.put).toHaveBeenCalledWith(expect.any(String), {
      ruleIds: ["rule-1"],
      expectedUpdatedAt,
    });
    expect(bulk).toEqual({ rules: [rule], versionUpdatedAt });
    expect(removed).toEqual({ versionUpdatedAt });
    expect(reordered).toEqual({ rules: [rule], versionUpdatedAt });
  });
});

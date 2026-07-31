// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminSchoolResultDetailService } from "../../services/admin-school-result-detail.service";
import type { AdminSchoolResultDetail } from "../../types/admin-school-result-detail";
import { AdminSchoolResultDetailPage } from "./AdminSchoolResultDetailPage";

vi.mock("../../services/admin-school-result-detail.service", () => ({ adminSchoolResultDetailService: { get: vi.fn() } }));
vi.mock("../../components/results/PreliminaryResultRadar", () => ({ PreliminaryResultRadar: () => <div>Radar histórico</div> }));

describe("AdminSchoolResultDetailPage", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("muestra resultado, snapshot y trazabilidad persistidos", async () => {
    vi.mocked(adminSchoolResultDetailService.get).mockResolvedValue(fullDetail);
    renderPage();
    expect(await screen.findByRole("heading", { name: "Escuela Histórica" })).toBeVisible();
    expect(screen.getByText("82,5 / 100")).toBeVisible();
    expect(screen.getByText("Radar histórico")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ficha histórica" }));
    expect(screen.getByText("Directora Original")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Historial" }));
    expect(screen.getAllByText("Persona Original").length).toBeGreaterThan(0);
  });

  it("explica un borrador sin inventar un resultado", async () => {
    vi.mocked(adminSchoolResultDetailService.get).mockResolvedValue({ ...fullDetail, participationStatus: "draft", result: null, submission: { ...fullDetail.submission!, status: "draft", submittedAt: null } });
    renderPage();
    expect(await screen.findByRole("heading", { name: "Presentación en borrador" })).toBeVisible();
    expect(screen.queryByText("Radar histórico")).not.toBeInTheDocument();
  });
});

function renderPage() { return render(<MemoryRouter initialEntries={["/admin/campanas/campaign-1/colegios/school-1/resultado"]}><Routes><Route path="/admin/campanas/:campaignId/colegios/:schoolId/resultado" element={<AdminSchoolResultDetailPage />} /></Routes></MemoryRouter>); }

const fullDetail: AdminSchoolResultDetail = {
  campaign: { id: "campaign-1", name: "Campaña 2026", type: "annual", status: "active", startsAt: "2026-01-01T00:00:00Z", endsAt: "2026-12-31T00:00:00Z" },
  school: { id: "school-1", cue: "50001", name: "Escuela Histórica", schoolNumber: "1-001", department: "Godoy Cruz", locality: "Centro", managementType: "Estatal", scope: "Urbano", educationLevel: "Primario", isActive: false },
  participationStatus: "submitted",
  submission: { id: "submission-1", status: "submitted", startedAt: "2026-06-01T10:00:00Z", lastSavedAt: "2026-06-02T10:00:00Z", submittedAt: "2026-06-03T10:00:00Z", originalRespondent: { id: "user-1", firstName: "Persona", lastName: "Original", email: "original@example.com", isActive: false } },
  historicalSchoolProfile: { name: "Escuela Histórica", directorName: "Directora Original" },
  result: { id: "result-1", generalScore: 82.5, numerator: 825, denominator: 10, stars: { base: 5, final: 4, blockingReasons: ["Área crítica"], configurationVersion: "v1" }, alerts: [], dimensions: Array.from({ length: 6 }, (_, index) => ({ id: `d-${index}`, code: `D${index}`, title: `Dimensión ${index + 1}`, order: index, score: 80, available: true, isCritical: false, criticalValue: null, criticalThreshold: null })), answers: [], excludedQuestions: [], survey: { id: "survey-1", code: "EPS", name: "Cuestionario", version: { id: "version-1", number: 2, title: "Versión 2", publishedAt: "2026-01-01T00:00:00Z" } }, calculation: { calculatedAt: "2026-06-03T10:01:00Z", algorithmVersion: "2.0", snapshotSchemaVersion: 1, source: "submission", calculatedBy: null } },
  history: [{ type: "submitted", label: "Presentación enviada", at: "2026-06-03T10:00:00Z" }],
  dataQuality: { historicalProfileAvailable: true, resultSnapshotAvailable: true },
};

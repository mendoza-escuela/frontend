// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminCampaignTrackingService } from "../../services/admin-campaign-tracking.service";
import type {
  CampaignTrackingList,
  CampaignTrackingSummary,
} from "../../types/admin-campaign-tracking";
import type { AdminCampaign } from "../../types/admin-campaign";
import { CampaignTrackingPage } from "./CampaignTrackingPage";

vi.mock("../../services/admin-campaign-tracking.service", () => ({
  adminCampaignTrackingService: {
    campaigns: vi.fn(),
    summary: vi.fn(),
    list: vi.fn(),
  },
}));

describe("CampaignTrackingPage", () => {
  beforeEach(() => {
    vi.mocked(adminCampaignTrackingService.campaigns).mockResolvedValue([
      campaign,
    ]);
    vi.mocked(adminCampaignTrackingService.summary).mockResolvedValue(summary);
    vi.mocked(adminCampaignTrackingService.list).mockResolvedValue(tracking);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows three exclusive states, percentages and inactive historical records", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Seguimiento de presentaciones",
      }),
    ).toBeVisible();
    expect(await screen.findByText("Avance general de envíos")).toBeVisible();
    expect(
      screen.getByRole("progressbar", {
        name: "33,33% de presentaciones enviadas",
      }),
    ).toHaveAttribute("aria-valuenow", "33.33");
    expect(screen.getAllByText("No iniciada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Borrador").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enviada").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Escuela inactiva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ana Pérez").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactivo").length).toBeGreaterThan(0);
    expect(screen.queryByText(/certific/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/revisi[oó]n/i)).not.toBeInTheDocument();
  });

  it("sends state, search, ordering and pagination to the backend", async () => {
    renderPage();
    await screen.findByText("Avance general de envíos");

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "submitted" },
    });
    await waitFor(() =>
      expect(adminCampaignTrackingService.list).toHaveBeenLastCalledWith(
        campaign.id,
        expect.objectContaining({ status: "submitted", page: 1 }),
        expect.any(AbortSignal),
      ),
    );

    fireEvent.change(screen.getByLabelText("Buscar escuela"), {
      target: { value: "50002" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() =>
      expect(adminCampaignTrackingService.list).toHaveBeenLastCalledWith(
        campaign.id,
        expect.objectContaining({
          search: "50002",
          status: "submitted",
        }),
        expect.any(AbortSignal),
      ),
    );

    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "submitted_at" },
    });
    fireEvent.change(screen.getByLabelText("Dirección"), {
      target: { value: "desc" },
    });
    await waitFor(() =>
      expect(adminCampaignTrackingService.list).toHaveBeenLastCalledWith(
        campaign.id,
        expect.objectContaining({
          sortBy: "submitted_at",
          sortDirection: "desc",
        }),
        expect.any(AbortSignal),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() =>
      expect(adminCampaignTrackingService.list).toHaveBeenLastCalledWith(
        campaign.id,
        expect.objectContaining({ page: 2 }),
        expect.any(AbortSignal),
      ),
    );
  });

  it("handles a campaign without included schools without dividing by zero", async () => {
    vi.mocked(adminCampaignTrackingService.summary).mockResolvedValue({
      ...summary,
      totalSchools: 0,
      submittedPercentage: 0,
      states: {
        not_started: { count: 0, percentage: 0 },
        draft: { count: 0, percentage: 0 },
        submitted: { count: 0, percentage: 0 },
      },
    });
    vi.mocked(adminCampaignTrackingService.list).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Campaña sin escuelas" }),
    ).toBeVisible();
    expect(
      screen.getByRole("progressbar", {
        name: "0% de presentaciones enviadas",
      }),
    ).toHaveAttribute("aria-valuenow", "0");
  });
});

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[`/admin/seguimiento?campania=${campaign.id}`]}
    >
      <CampaignTrackingPage />
    </MemoryRouter>,
  );
}

const campaign: AdminCampaign = {
  id: "campaign-1",
  name: "Campaña 2026",
  description: null,
  type: "annual",
  status: "active",
  startDate: "2026-07-01",
  endDate: "2026-07-31",
  startsAt: "2026-07-01T03:00:00.000Z",
  endsAt: "2026-08-01T02:59:59.999Z",
  activatedAt: "2026-07-01T12:00:00.000Z",
  closedAt: null,
  archivedAt: null,
  createdAt: "2026-06-20T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
  surveyVersion: {
    id: "version-1",
    versionNumber: 1,
    title: "Versión publicada",
    publishedAt: "2026-06-15T12:00:00.000Z",
    survey: {
      id: "survey-1",
      code: "institucional",
      name: "Cuestionario institucional",
    },
  },
};

const summary: CampaignTrackingSummary = {
  campaign: {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    inclusionCutoff: campaign.endsAt,
  },
  totalSchools: 3,
  submittedPercentage: 33.33,
  states: {
    not_started: { count: 1, percentage: 33.33 },
    draft: { count: 1, percentage: 33.33 },
    submitted: { count: 1, percentage: 33.33 },
  },
};

const tracking: CampaignTrackingList = {
  items: [
    {
      school: {
        id: "school-1",
        cue: "50001",
        name: "Escuela inactiva",
        isActive: false,
      },
      status: "not_started",
      progress: { answered: 0, applicable: 0, percentage: 0 },
      submission: null,
      originalRespondent: null,
      historicalDataComplete: true,
    },
    {
      school: {
        id: "school-2",
        cue: "50002",
        name: "Escuela borrador",
        isActive: true,
      },
      status: "draft",
      progress: { answered: 3, applicable: 6, percentage: 50 },
      submission: {
        id: "submission-2",
        startedAt: "2026-07-10T12:00:00.000Z",
        lastSavedAt: "2026-07-11T12:00:00.000Z",
        submittedAt: null,
      },
      originalRespondent: {
        id: "user-2",
        firstName: "Ana",
        lastName: "Pérez",
        email: "ana@example.com",
        isActive: false,
        historicalDataComplete: true,
      },
      historicalDataComplete: true,
    },
    {
      school: {
        id: "school-3",
        cue: "50003",
        name: "Escuela enviada",
        isActive: true,
      },
      status: "submitted",
      progress: { answered: 6, applicable: 6, percentage: 100 },
      submission: {
        id: "submission-3",
        startedAt: "2026-07-09T12:00:00.000Z",
        lastSavedAt: "2026-07-12T12:00:00.000Z",
        submittedAt: "2026-07-12T12:05:00.000Z",
      },
      originalRespondent: {
        id: "user-3",
        firstName: "Luis",
        lastName: "Gómez",
        email: "luis@example.com",
        isActive: true,
        historicalDataComplete: true,
      },
      historicalDataComplete: true,
    },
  ],
  pagination: { page: 1, limit: 20, total: 40, totalPages: 2 },
};

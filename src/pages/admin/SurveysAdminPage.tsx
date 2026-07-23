import { ClipboardList, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PaginationControls } from "../../components/ui/PaginationControls";
import {
  ActiveStatusBadge,
  VersionStatusBadge,
} from "../../components/ui/StatusBadge";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type {
  AdminSurveyListItem,
  AdminSurveyListResponse,
} from "../../types/admin-survey";

const emptyList: AdminSurveyListResponse = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

export function SurveysAdminPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState(emptyList);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [surveyToDelete, setSurveyToDelete] =
    useState<AdminSurveyListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const listRequest = useRef<AbortController | null>(null);

  const load = useCallback(async (page = 1, query = appliedSearch) => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setIsLoading(true);
    setError("");
    try {
      setSurveys(
        await adminSurveysService.list(
          { search: query || undefined, page, limit: 20 },
          controller.signal,
        ),
      );
    } catch (loadError) {
      if (!controller.signal.aborted) setError(getHttpErrorMessage(loadError));
    } finally {
      if (listRequest.current === controller) setIsLoading(false);
    }
  }, [appliedSearch]);

  useEffect(() => {
    void load();
    return () => listRequest.current?.abort();
  }, [load]);

  const removeSurvey = async () => {
    if (!surveyToDelete) return;
    setIsDeleting(true);
    try {
      await adminSurveysService.remove(surveyToDelete.id);
      showSuccess("El cuestionario fue eliminado.");
      setSurveyToDelete(null);
      await load(
        surveys.items.length === 1 && surveys.pagination.page > 1
          ? surveys.pagination.page - 1
          : surveys.pagination.page,
      );
    } catch (removeError) {
      showError(getHttpErrorMessage(removeError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          actions={
            <Button
              icon={<Plus aria-hidden="true" size={18} />}
              onClick={() => navigate("/admin/cuestionarios/nuevo")}
            >
              Nuevo cuestionario
            </Button>
          }
          description="Administrá definiciones, borradores y versiones publicadas sin configurar reglas de evaluación."
          eyebrow="Administración"
          title="Cuestionarios"
        />

        <form
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-mendoza-border bg-white p-4 shadow-sm sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const nextSearch = search.trim();
            if (nextSearch === appliedSearch) void load(1, nextSearch);
            else setAppliedSearch(nextSearch);
          }}
        >
          <label className="min-w-0 flex-1 text-sm font-semibold">
            Buscar cuestionario
            <input
              className="mt-1 w-full rounded-lg border border-mendoza-border px-3 py-2.5 outline-none focus:border-mendoza-sky"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Código o nombre"
              value={search}
            />
          </label>
          <Button
            className="self-end"
            icon={<Search aria-hidden="true" size={17} />}
            type="submit"
          >
            Buscar
          </Button>
        </form>

        <div className="mt-8">
          {isLoading ? (
            <LoadingState label="Cargando cuestionarios…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : surveys.items.length === 0 ? (
            <EmptyState
              action={
                <Button
                  icon={<Plus aria-hidden="true" size={18} />}
                  onClick={() => navigate("/admin/cuestionarios/nuevo")}
                >
                  Crear cuestionario
                </Button>
              }
              description="Creá la definición general y luego agregá una primera versión borrador."
              icon={ClipboardList}
              title="Todavía no hay cuestionarios"
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {surveys.items.map((survey) => {
                const latest = survey.versions[0];
                return (
                  <Card as="article" key={survey.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <ActiveStatusBadge isActive={survey.isActive} />
                          {latest && <VersionStatusBadge status={latest.status} />}
                        </div>
                        <h2 className="mt-3 text-xl font-bold text-mendoza-text">
                          {survey.name}
                        </h2>
                        <p className="mt-1 font-mono text-xs text-mendoza-muted">
                          {survey.code}
                        </p>
                      </div>
                      <ClipboardList
                        aria-hidden="true"
                        className="shrink-0 text-mendoza-blue"
                      />
                    </div>
                    <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-mendoza-muted">
                      {survey.description ?? "Sin descripción."}
                    </p>
                    <p className="mt-4 text-sm text-mendoza-text">
                      <strong>{survey.versions.length}</strong> versión
                      {survey.versions.length === 1 ? "" : "es"}
                      {latest ? ` · última: v${latest.versionNumber}` : ""}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-mendoza-border pt-4">
                      <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
                        to={`/admin/cuestionarios/${survey.id}`}
                      >
                        <Eye aria-hidden="true" size={16} /> Ver detalle
                      </Link>
                      <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
                        to={`/admin/cuestionarios/${survey.id}/editar`}
                      >
                        <Pencil aria-hidden="true" size={16} /> Editar
                      </Link>
                      <button
                        aria-label={`Eliminar ${survey.name}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-error hover:bg-red-50"
                        onClick={() => setSurveyToDelete(survey)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={16} /> Eliminar
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        {!error && (
          <PaginationControls
            loading={isLoading}
            onPageChange={(page) => void load(page)}
            pagination={surveys.pagination}
          />
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Eliminar cuestionario"
        description="Sólo se eliminará si todas sus versiones son borradores. Las versiones publicadas o archivadas están protegidas."
        destructive
        isProcessing={isDeleting}
        onCancel={() => setSurveyToDelete(null)}
        onConfirm={removeSurvey}
        open={Boolean(surveyToDelete)}
        title="¿Eliminar cuestionario?"
      />
    </main>
  );
}

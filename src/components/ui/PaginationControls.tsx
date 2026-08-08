import { Button } from "./Button";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PaginationControlsProps = {
  loading?: boolean;
  onPageChange: (page: number) => void;
  pagination: Pagination;
};

export function PaginationControls({
  loading = false,
  onPageChange,
  pagination,
}: PaginationControlsProps) {
  const first = pagination.total
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const last = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p aria-live="polite" className="text-sm text-mendoza-muted">
        Mostrando {first}-{last} de {pagination.total} · Página{" "}
        {pagination.page} de {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={pagination.page <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          variant="outline"
        >
          Anterior
        </Button>
        <Button
          disabled={
            pagination.page >= pagination.totalPages ||
            pagination.total === 0 ||
            loading
          }
          onClick={() =>
            onPageChange(
              Math.min(pagination.totalPages, pagination.page + 1),
            )
          }
          variant="outline"
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}

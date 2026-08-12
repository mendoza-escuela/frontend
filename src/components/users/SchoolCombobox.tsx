import { Check, ChevronsUpDown, LoaderCircle, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { adminUsersService } from "../../services/admin-users.service";
import type { SchoolOption } from "../../types/admin-user";

const PAGE_SIZE = 20;

type SchoolComboboxProps = {
  allowClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  disableInactive?: boolean;
  error?: string;
  label?: string;
  onChange: (school: SchoolOption | null) => void;
  placeholder?: string;
  selectedSchool: SchoolOption | null;
};

export function SchoolCombobox({
  allowClear = false,
  clearLabel = "Todos los colegios",
  disabled = false,
  disableInactive = true,
  error,
  label = "Colegio asociado",
  onChange,
  placeholder = "Seleccionar colegio…",
  selectedSchool,
}: SchoolComboboxProps) {
  const labelId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentQueryRef = useRef("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  currentQueryRef.current = query;

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    const timeout = window.setTimeout(
      async () => {
        setLoadError(false);
        try {
          const response = await adminUsersService.schools(
            {
              search: query.trim() || undefined,
              page: 1,
              limit: PAGE_SIZE,
            },
            controller.signal,
          );
          setSchools(response.items);
          setPage(response.pagination.page);
          setTotalPages(response.pagination.totalPages);
        } catch {
          if (!controller.signal.aborted) {
            setSchools([]);
            setLoadError(true);
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query, retryKey]);

  const openOptions = () => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const selectSchool = (school: SchoolOption) => {
    if (
      disableInactive &&
      school.isActive === false &&
      school.id !== selectedSchool?.id
    )
      return;
    onChange(school);
    setOpen(false);
    setQuery("");
  };

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    const requestedQuery = query.trim();
    setLoadingMore(true);
    setLoadError(false);
    try {
      const response = await adminUsersService.schools({
        search: requestedQuery || undefined,
        page: page + 1,
        limit: PAGE_SIZE,
      });
      if (currentQueryRef.current.trim() !== requestedQuery) return;
      setSchools((current) => {
        const existingIds = new Set(current.map((school) => school.id));
        return [
          ...current,
          ...response.items.filter((school) => !existingIds.has(school.id)),
        ];
      });
      setPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="text-sm font-semibold text-mendoza-text" ref={rootRef}>
      <span id={labelId}>{label}</span>
      <div className="relative mt-2">
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={labelId}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-mendoza-border px-3 py-2.5 text-left outline-none hover:border-mendoza-sky focus-visible:border-mendoza-sky focus-visible:ring-2 focus-visible:ring-mendoza-sky/25 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-mendoza-muted"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openOptions())}
          type="button"
        >
          <span className="min-w-0 truncate">
            {selectedSchool
              ? `${selectedSchool.cue} - ${selectedSchool.name}${selectedSchool.isActive === false ? " (inactivo)" : ""}`
              : placeholder}
          </span>
          <ChevronsUpDown
            aria-hidden="true"
            className="shrink-0 text-mendoza-muted"
            size={17}
          />
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-mendoza-border bg-white shadow-lg">
            <div className="relative border-b border-mendoza-border">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-mendoza-muted"
                size={17}
              />
              <input
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded="true"
                aria-label="Buscar colegio por CUE, número o nombre"
                className="w-full py-2.5 pl-10 pr-3 font-normal outline-none focus:ring-2 focus:ring-inset focus:ring-mendoza-sky"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setOpen(false);
                }}
                placeholder="Buscar por CUE, número o nombre…"
                ref={searchInputRef}
                role="combobox"
                value={query}
              />
            </div>

            <div
              className="max-h-64 overflow-y-auto p-1"
              id={listboxId}
              role="listbox"
            >
              {allowClear && !loading && (
                <button
                  aria-selected={!selectedSchool}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-mendoza-sky/10"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <Check
                    aria-hidden="true"
                    className={`shrink-0 text-mendoza-blue ${selectedSchool ? "opacity-0" : "opacity-100"}`}
                    size={16}
                  />
                  {clearLabel}
                </button>
              )}
              {loading ? (
                <div
                  className="flex items-center justify-center gap-2 px-3 py-5 font-normal text-mendoza-muted"
                  role="status"
                >
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                    size={18}
                  />
                  Buscando colegios…
                </div>
              ) : loadError && schools.length === 0 ? (
                <div className="px-3 py-4 text-center font-normal text-mendoza-muted">
                  <p>No se pudieron cargar los colegios.</p>
                  <button
                    className="mt-2 font-semibold text-mendoza-blue hover:underline"
                    onClick={() => setRetryKey((current) => current + 1)}
                    type="button"
                  >
                    Reintentar
                  </button>
                </div>
              ) : schools.length === 0 ? (
                <p className="px-3 py-5 text-center font-normal text-mendoza-muted">
                  No se encontraron colegios.
                </p>
              ) : (
                <>
                  {schools.map((school) => {
                    const selected = school.id === selectedSchool?.id;
                    const inactive =
                      disableInactive && school.isActive === false && !selected;
                    return (
                      <button
                        aria-disabled={inactive}
                        aria-selected={selected}
                        className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-mendoza-sky/10 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                        key={school.id}
                        onClick={() => selectSchool(school)}
                        role="option"
                        type="button"
                      >
                        <Check
                          aria-hidden="true"
                          className={`mt-0.5 shrink-0 text-mendoza-blue ${selected ? "opacity-100" : "opacity-0"}`}
                          size={16}
                        />
                        <span className="min-w-0">
                          <span className="block truncate">
                            {school.cue} - {school.name}
                          </span>
                          {school.isActive === false && (
                            <span className="block text-xs font-normal text-mendoza-muted">
                              Colegio inactivo
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {page < totalPages && (
                    <button
                      className="mt-1 w-full rounded-md px-3 py-2 text-center text-mendoza-blue hover:bg-mendoza-sky/10 disabled:opacity-60"
                      disabled={loadingMore}
                      onClick={() => void loadMore()}
                      type="button"
                    >
                      {loadingMore ? "Cargando…" : "Ver más resultados"}
                    </button>
                  )}
                  {loadError && (
                    <p className="px-3 py-2 text-center text-xs font-normal text-mendoza-error">
                      No se pudieron cargar más resultados.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <span className="mt-1 block text-sm font-normal text-mendoza-error">
          {error}
        </span>
      )}
    </div>
  );
}

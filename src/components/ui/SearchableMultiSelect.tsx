import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeSearchText } from "../../lib/text";
import type { SearchableSelectOption } from "./SearchableSelect";

export type SearchableMultiSelectOption = SearchableSelectOption & {
  badge?: string;
  highlighted?: boolean;
};

type SearchableMultiSelectProps = {
  label: string;
  values?: readonly string[];
  options: SearchableMultiSelectOption[];
  onChange: (values: string[]) => void;
  allLabel?: string;
  disabled?: boolean;
  maxSelections?: number;
  onMaxSelectionsReached?: () => void;
};

/**
 * Selector múltiple buscable para catálogos administrativos.
 *
 * Mantiene el panel abierto al alternar opciones para permitir combinaciones
 * rápidas y expone un listbox multiselección navegable con teclado.
 */
export function SearchableMultiSelect({
  label,
  values = [],
  options,
  onChange,
  allLabel = "Todos",
  disabled = false,
  maxSelections,
  onMaxSelectionsReached,
}: SearchableMultiSelectProps) {
  const labelId = useId();
  const summaryId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedValues = useMemo(() => new Set(values), [values]);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    return normalizedQuery
      ? options.filter(({ label: optionLabel }) =>
          normalizeSearchText(optionLabel).includes(normalizedQuery),
        )
      : options;
  }, [options, query]);
  const summary = selectionSummary(values, options, allLabel);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => setActiveIndex(0), [options, query]);

  const show = () => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };
  const closeAndRestoreFocus = () => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };
  const toggle = (value: string) => {
    if (
      !selectedValues.has(value) &&
      maxSelections !== undefined &&
      values.length >= maxSelections
    ) {
      onMaxSelectionsReached?.();
      return;
    }
    onChange(
      selectedValues.has(value)
        ? values.filter((selected) => selected !== value)
        : [...values, value],
    );
  };

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <span
        className="mb-2 block text-sm font-semibold text-mendoza-text"
        id={labelId}
      >
        {label}
      </span>
      <button
        aria-describedby={summaryId}
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-mendoza-border bg-white px-3.5 text-left text-sm shadow-sm outline-none transition hover:border-mendoza-sky focus-visible:border-mendoza-sky focus-visible:ring-4 focus-visible:ring-mendoza-sky/15 disabled:cursor-not-allowed disabled:bg-slate-100"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        ref={triggerRef}
        type="button"
      >
        <span
          className={`truncate ${values.length ? "font-semibold text-mendoza-text" : "text-mendoza-muted"}`}
          id={summaryId}
        >
          {summary}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {values.length > 0 && (
            <span className="rounded-full bg-mendoza-sky/20 px-2 py-0.5 text-xs font-bold text-mendoza-blue">
              {values.length}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={`text-mendoza-blue transition-transform ${open ? "rotate-180" : ""}`}
            size={18}
          />
        </span>
      </button>
      {open && (
        <div className="absolute z-40 mt-2 w-full min-w-64 overflow-hidden rounded-xl border border-mendoza-border bg-white shadow-xl shadow-slate-900/10">
          <div className="relative border-b border-mendoza-border bg-mendoza-background/60">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-mendoza-blue"
              size={17}
            />
            <input
              aria-activedescendant={
                visibleOptions[activeIndex]
                  ? `${listboxId}-${activeIndex}`
                  : undefined
              }
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded="true"
              aria-label={`Buscar en ${label}`}
              className="w-full bg-transparent py-3 pl-10 pr-9 text-sm font-normal outline-none focus:ring-2 focus:ring-inset focus:ring-mendoza-sky"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeAndRestoreFocus();
                  return;
                }
                if (event.key === "Tab") {
                  setOpen(false);
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  if (!visibleOptions.length) return;
                  setActiveIndex((current) =>
                    Math.min(current + 1, visibleOptions.length - 1),
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  if (!visibleOptions.length) return;
                  setActiveIndex((current) => Math.max(current - 1, 0));
                }
                if (event.key === "Enter" && visibleOptions[activeIndex]) {
                  event.preventDefault();
                  toggle(visibleOptions[activeIndex].value);
                }
              }}
              placeholder={`Buscar ${label.toLocaleLowerCase("es-AR")}…`}
              ref={inputRef}
              role="combobox"
              value={query}
            />
            {query && (
              <button
                aria-label={`Limpiar búsqueda de ${label}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-mendoza-muted hover:bg-white"
                onClick={() => setQuery("")}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            )}
          </div>
          {values.length > 0 && (
            <div className="flex justify-end border-b border-mendoza-border px-2 py-1.5">
              <button
                className="min-h-9 rounded-lg px-2 text-xs font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-mendoza-blue"
                onClick={() => onChange([])}
                type="button"
              >
                Limpiar selección
              </button>
            </div>
          )}
          <div
            aria-labelledby={labelId}
            aria-multiselectable="true"
            className="max-h-64 overflow-y-auto p-1.5"
            id={listboxId}
            role="listbox"
          >
            {visibleOptions.length ? (
              visibleOptions.map((option, index) => {
                const isSelected = selectedValues.has(option.value);
                const isAtLimit =
                  !isSelected &&
                  maxSelections !== undefined &&
                  values.length >= maxSelections;
                return (
                  <button
                    aria-disabled={isAtLimit}
                    aria-label={
                      option.badge
                        ? `${option.label} · ${option.badge}`
                        : option.label
                    }
                    aria-selected={isSelected}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition ${isAtLimit ? "cursor-not-allowed border-transparent text-mendoza-muted opacity-60" : isSelected ? "border-mendoza-sky/40 bg-mendoza-blue-soft" : index === activeIndex ? "border-mendoza-sky/30 bg-mendoza-sky/15" : option.highlighted ? "border-mendoza-gold/50 bg-amber-50 hover:bg-amber-100/70" : "border-transparent hover:bg-mendoza-background"}`}
                    data-highlighted={option.highlighted || undefined}
                    id={`${listboxId}-${index}`}
                    key={option.value}
                    onClick={() => toggle(option.value)}
                    onPointerMove={() => setActiveIndex(index)}
                    role="option"
                    tabIndex={-1}
                    type="button"
                  >
                    <Check
                      aria-hidden="true"
                      className={`shrink-0 text-mendoza-blue ${isSelected ? "opacity-100" : "opacity-0"}`}
                      size={16}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {option.badge && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${option.highlighted ? "bg-mendoza-gold/25 text-amber-950" : "bg-mendoza-background text-mendoza-muted"}`}
                      >
                        {option.badge}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-6 text-center text-sm text-mendoza-muted">
                No se encontraron opciones.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-mendoza-border px-3 py-2">
            <p aria-live="polite" className="text-xs text-mendoza-muted">
              {values.length} seleccionadas de {options.length}
              {maxSelections !== undefined && ` · máximo ${maxSelections}`}
            </p>
            <button
              className="min-h-9 rounded-lg px-3 text-xs font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-mendoza-blue"
              onClick={closeAndRestoreFocus}
              type="button"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function selectionSummary(
  values: readonly string[],
  options: SearchableMultiSelectOption[],
  allLabel: string,
) {
  if (!values.length) return allLabel;
  if (values.length > 1) return `${values.length} seleccionados`;
  return (
    options.find((option) => option.value === values[0])?.label ?? values[0]
  );
}

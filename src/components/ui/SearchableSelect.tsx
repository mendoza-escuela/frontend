import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = { value: string; label: string };

type SearchableSelectProps = {
  label: string;
  value?: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  allLabel?: string;
  disabled?: boolean;
};

export function SearchableSelect({ label, value, options, onChange, allLabel = "Todos", disabled = false }: SearchableSelectProps) {
  const labelId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    const available = [{ value: "", label: allLabel }, ...options];
    return normalizedQuery
      ? available.filter(({ label }) => normalize(label).includes(normalizedQuery))
      : available;
  }, [allLabel, options, query]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const show = () => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };
  const choose = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  };

  return <div className="relative min-w-0" ref={rootRef}>
    <span className="mb-2 block text-sm font-semibold text-mendoza-text" id={labelId}>{label}</span>
    <button aria-expanded={open} aria-haspopup="listbox" aria-labelledby={labelId} className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-mendoza-border bg-white px-3.5 text-left text-sm shadow-sm outline-none transition hover:border-mendoza-sky focus-visible:border-mendoza-sky focus-visible:ring-4 focus-visible:ring-mendoza-sky/15 disabled:cursor-not-allowed disabled:bg-slate-100" disabled={disabled} onClick={() => open ? setOpen(false) : show()} type="button">
      <span className={`truncate ${selected ? "font-semibold text-mendoza-text" : "text-mendoza-muted"}`}>{selected?.label ?? allLabel}</span>
      <span className="flex shrink-0 items-center gap-1">
        {value && <X aria-hidden="true" className="text-mendoza-muted opacity-0 transition group-hover:opacity-100" size={15} />}
        <ChevronDown aria-hidden="true" className={`text-mendoza-blue transition-transform ${open ? "rotate-180" : ""}`} size={18} />
      </span>
    </button>
    {open && <div className="absolute z-40 mt-2 w-full min-w-64 overflow-hidden rounded-xl border border-mendoza-border bg-white shadow-xl shadow-slate-900/10">
      <div className="relative border-b border-mendoza-border bg-mendoza-background/60">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-mendoza-blue" size={17} />
        <input aria-activedescendant={visibleOptions[activeIndex] ? `${listboxId}-${activeIndex}` : undefined} aria-autocomplete="list" aria-controls={listboxId} aria-expanded="true" aria-label={`Buscar en ${label}`} className="w-full bg-transparent py-3 pl-10 pr-9 text-sm font-normal outline-none focus:ring-2 focus:ring-inset focus:ring-mendoza-sky" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); return; }
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((current) => Math.min(current + 1, visibleOptions.length - 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(current - 1, 0)); }
          if (event.key === "Enter" && visibleOptions[activeIndex]) { event.preventDefault(); choose(visibleOptions[activeIndex].value); }
        }} placeholder={`Buscar ${label.toLocaleLowerCase("es-AR")}…`} ref={inputRef} role="combobox" value={query} />
        {query && <button aria-label={`Limpiar búsqueda de ${label}`} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-mendoza-muted hover:bg-white" onClick={() => setQuery("")} type="button"><X aria-hidden="true" size={16} /></button>}
      </div>
      <div className="max-h-64 overflow-y-auto p-1.5" id={listboxId} role="listbox">
        {visibleOptions.length ? visibleOptions.map((option, index) => {
          const isSelected = (value ?? "") === option.value;
          return <button aria-selected={isSelected} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${index === activeIndex ? "bg-mendoza-sky/15" : "hover:bg-mendoza-background"}`} id={`${listboxId}-${index}`} key={option.value || "all"} onClick={() => choose(option.value)} onPointerMove={() => setActiveIndex(index)} role="option" type="button"><Check aria-hidden="true" className={`shrink-0 text-mendoza-blue ${isSelected ? "opacity-100" : "opacity-0"}`} size={16} /><span className="truncate">{option.label}</span></button>;
        }) : <p className="px-3 py-6 text-center text-sm text-mendoza-muted">No se encontraron opciones.</p>}
      </div>
      <p className="border-t border-mendoza-border px-3 py-2 text-xs text-mendoza-muted">{visibleOptions.length} {visibleOptions.length === 1 ? "opción" : "opciones"}</p>
    </div>}
  </div>;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR");
}

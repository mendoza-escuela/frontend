import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { normalizeSearchText } from "../../lib/text";

const PANEL_MAX_HEIGHT = 448;
const PANEL_MIN_USEFUL_SPACE = 320;
const VIEWPORT_PADDING = 16;
const PANEL_GAP = 8;

export type QuestionComboboxOption = {
  value: string;
  code: string;
  prompt: string;
  groupLabel: string;
  ruleCount: number;
};

type QuestionComboboxProps = {
  label: string;
  options: QuestionComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

type GroupedOption = {
  label: string;
  options: Array<{
    index: number;
    option: QuestionComboboxOption;
  }>;
};

/**
 * Selector buscable para preguntas extensas.
 *
 * Mantiene el enunciado fuera del control nativo, agrupa las preguntas por su
 * contexto y adapta la apertura al espacio disponible en la ventana.
 */
export function QuestionCombobox({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: QuestionComboboxProps) {
  const labelId = useId();
  const summaryId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [opensUpward, setOpensUpward] = useState(false);
  const [panelMaxHeight, setPanelMaxHeight] = useState(PANEL_MAX_HEIGHT);

  const selectedOption = options.find((option) => option.value === value);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      normalizeSearchText(
        `${option.code} ${option.prompt} ${option.groupLabel}`,
      ).includes(normalizedQuery),
    );
  }, [options, query]);
  const groupedOptions = useMemo(
    () => groupOptions(visibleOptions),
    [visibleOptions],
  );

  const updatePanelPlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = Math.max(
      0,
      window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_PADDING,
    );
    const spaceAbove = Math.max(
      0,
      rect.top - PANEL_GAP - VIEWPORT_PADDING,
    );
    const shouldOpenUpward =
      spaceBelow < PANEL_MIN_USEFUL_SPACE && spaceAbove > spaceBelow;
    const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;

    setOpensUpward(shouldOpenUpward);
    setPanelMaxHeight(Math.min(PANEL_MAX_HEIGHT, availableSpace));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    updatePanelPlacement();
    window.addEventListener("resize", updatePanelPlacement);
    window.addEventListener("scroll", updatePanelPlacement, true);
    return () => {
      window.removeEventListener("resize", updatePanelPlacement);
      window.removeEventListener("scroll", updatePanelPlacement, true);
    };
  }, [open, updatePanelPlacement]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const activeOption = document.getElementById(
      `${listboxId}-option-${activeIndex}`,
    );
    if (typeof activeOption?.scrollIntoView === "function") {
      activeOption.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, listboxId, open]);

  useEffect(() => {
    if (activeIndex < visibleOptions.length) return;
    setActiveIndex(Math.max(0, visibleOptions.length - 1));
  }, [activeIndex, visibleOptions.length]);

  useEffect(() => {
    if (!disabled) return;
    setOpen(false);
    setQuery("");
  }, [disabled]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setQuery("");
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const showOptions = () => {
    if (disabled) return;

    const selectedIndex = options.findIndex((option) => option.value === value);
    setQuery("");
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeOptions = (restoreTriggerFocus: boolean) => {
    setOpen(false);
    setQuery("");
    if (restoreTriggerFocus) triggerRef.current?.focus();
  };

  const choose = (option: QuestionComboboxOption) => {
    onChange(option.value);
    closeOptions(true);
  };

  const moveActiveOption = (direction: -1 | 1) => {
    if (!visibleOptions.length) return;
    setActiveIndex((current) =>
      Math.min(Math.max(current + direction, 0), visibleOptions.length - 1),
    );
  };

  return (
    <div className="min-w-0" ref={rootRef}>
      <span
        className="mb-2 block text-sm font-semibold text-mendoza-text"
        id={labelId}
      >
        {label}
      </span>
      <div className="relative">
        <button
          aria-controls={open ? listboxId : undefined}
          aria-describedby={summaryId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={labelId}
          className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-mendoza-border bg-white px-3.5 text-left text-sm shadow-sm outline-none transition hover:border-mendoza-sky focus-visible:border-mendoza-sky focus-visible:ring-4 focus-visible:ring-mendoza-sky/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-mendoza-muted"
          disabled={disabled}
          onClick={() => (open ? closeOptions(false) : showOptions())}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            if (!open) showOptions();
          }}
          ref={triggerRef}
          type="button"
        >
          {selectedOption ? (
            <span
              className="flex min-w-0 items-center gap-2"
              id={summaryId}
            >
              <span className="shrink-0 rounded-md bg-mendoza-blue-soft px-2 py-1 text-xs font-bold text-mendoza-blue">
                {selectedOption.code}
              </span>
              <span className="truncate font-semibold text-mendoza-text">
                {shortTitle(selectedOption.prompt)}
              </span>
            </span>
          ) : (
            <span className="truncate text-mendoza-muted" id={summaryId}>
              Seleccionar pregunta…
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={`shrink-0 text-mendoza-blue transition-transform ${open ? "rotate-180" : ""}`}
            size={18}
          />
        </button>

        {open && (
          <div
            className={`absolute left-0 z-50 flex w-full max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-mendoza-border bg-white shadow-xl shadow-slate-900/10 ${opensUpward ? "bottom-full mb-2" : "top-full mt-2"}`}
            style={{ maxHeight: panelMaxHeight }}
          >
            <div className="relative shrink-0 border-b border-mendoza-border bg-mendoza-background/60">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-mendoza-blue"
                size={17}
              />
              <input
                aria-activedescendant={
                  visibleOptions[activeIndex]
                    ? `${listboxId}-option-${activeIndex}`
                    : undefined
                }
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded="true"
                aria-label={`Buscar en ${label}`}
                className="w-full bg-transparent py-3 pl-10 pr-10 text-sm font-normal text-mendoza-text outline-none placeholder:text-mendoza-muted focus:ring-2 focus:ring-inset focus:ring-mendoza-sky"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeOptions(true);
                    return;
                  }
                  if (event.key === "Tab") {
                    setOpen(false);
                    setQuery("");
                    return;
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveActiveOption(1);
                    return;
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveActiveOption(-1);
                    return;
                  }
                  if (event.key === "Home") {
                    event.preventDefault();
                    setActiveIndex(0);
                    return;
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    setActiveIndex(Math.max(0, visibleOptions.length - 1));
                    return;
                  }
                  if (event.key === "Enter" && visibleOptions[activeIndex]) {
                    event.preventDefault();
                    choose(visibleOptions[activeIndex]);
                  }
                }}
                placeholder="Buscar por código, pregunta o grupo…"
                ref={inputRef}
                role="combobox"
                value={query}
              />
              {query && (
                <button
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 rounded-md p-1 text-mendoza-muted transition -translate-y-1/2 hover:bg-white hover:text-mendoza-blue"
                  onClick={() => {
                    setQuery("");
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  type="button"
                >
                  <X aria-hidden="true" size={16} />
                </button>
              )}
            </div>

            <div
              aria-labelledby={labelId}
              className="min-h-0 flex-1 overflow-y-auto p-1.5"
              id={listboxId}
              role="listbox"
            >
              {groupedOptions.length ? (
                groupedOptions.map((group, groupIndex) => {
                  const groupId = `${listboxId}-group-${groupIndex}`;
                  return (
                    <div
                      aria-labelledby={groupId}
                      className="not-last:mb-1.5"
                      key={group.label}
                      role="group"
                    >
                      <p
                        className="sticky top-0 z-10 bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-wide text-mendoza-muted backdrop-blur-sm"
                        id={groupId}
                      >
                        {group.label}
                      </p>
                      {group.options.map(({ index, option }) => {
                        const isSelected = option.value === value;
                        const isActive = index === activeIndex;
                        return (
                          <button
                            aria-selected={isSelected}
                            className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                              isSelected
                                ? "bg-mendoza-blue-soft ring-1 ring-inset ring-mendoza-blue/15"
                                : isActive
                                  ? "bg-mendoza-sky/15"
                                  : "hover:bg-mendoza-background"
                            }`}
                            id={`${listboxId}-option-${index}`}
                            key={option.value}
                            onClick={() => choose(option)}
                            onPointerMove={() => setActiveIndex(index)}
                            role="option"
                            tabIndex={-1}
                            type="button"
                          >
                            <Check
                              aria-hidden="true"
                              className={`mt-1 shrink-0 text-mendoza-blue ${isSelected ? "opacity-100" : "opacity-0"}`}
                              size={16}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-mendoza-blue-soft px-1.5 py-0.5 text-xs font-bold text-mendoza-blue">
                                  {option.code}
                                </span>
                                <span className="text-xs font-semibold text-mendoza-muted">
                                  {formatRuleCount(option.ruleCount)}
                                </span>
                              </span>
                              <span className="line-clamp-2 block whitespace-normal break-words font-medium leading-5 text-mendoza-text">
                                {option.prompt}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <p
                  className="px-3 py-8 text-center text-sm text-mendoza-muted"
                  role="status"
                >
                  No se encontraron preguntas.
                </p>
              )}
            </div>

            <p
              aria-live="polite"
              className="shrink-0 border-t border-mendoza-border bg-white px-3 py-2 text-xs text-mendoza-muted"
            >
              {query
                ? `${visibleOptions.length} de ${options.length} preguntas`
                : formatQuestionCount(options.length)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function groupOptions(options: QuestionComboboxOption[]): GroupedOption[] {
  const groups = new Map<string, GroupedOption>();

  options.forEach((option, index) => {
    const label = option.groupLabel.trim() || "Otras preguntas";
    const group = groups.get(label);
    if (group) {
      group.options.push({ index, option });
      return;
    }
    groups.set(label, { label, options: [{ index, option }] });
  });

  return [...groups.values()];
}

function shortTitle(prompt: string) {
  const separatorIndex = prompt.indexOf(":");
  return separatorIndex > 0 ? prompt.slice(0, separatorIndex) : prompt;
}

function formatRuleCount(count: number) {
  return `${count} ${count === 1 ? "regla" : "reglas"}`;
}

function formatQuestionCount(count: number) {
  return `${count} ${count === 1 ? "pregunta" : "preguntas"}`;
}

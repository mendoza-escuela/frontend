import { useCallback, useLayoutEffect, useRef, useState } from "react";

const VIEWPORT_MARGIN = 16;
const DEFAULT_MAX_HEIGHT = 320;
const MIN_PANEL_HEIGHT = 160;

/** Ubica un desplegable en el lado con más espacio y limita su altura al viewport. */
export function useAdaptiveDropdown<T extends HTMLElement>(open: boolean) {
  const triggerRef = useRef<T>(null);
  const [opensUpward, setOpensUpward] = useState(false);
  const [panelMaxHeight, setPanelMaxHeight] = useState(DEFAULT_MAX_HEIGHT);

  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = Math.max(
      0,
      window.innerHeight - rect.bottom - VIEWPORT_MARGIN,
    );
    const spaceAbove = Math.max(0, rect.top - VIEWPORT_MARGIN);
    const shouldOpenUpward =
      spaceBelow < DEFAULT_MAX_HEIGHT && spaceAbove > spaceBelow;
    const availableSpace = shouldOpenUpward ? spaceAbove : spaceBelow;

    setOpensUpward(shouldOpenUpward);
    setPanelMaxHeight(
      Math.max(MIN_PANEL_HEIGHT, Math.min(DEFAULT_MAX_HEIGHT, availableSpace)),
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, updatePlacement]);

  return { triggerRef, opensUpward, panelMaxHeight, updatePlacement };
}

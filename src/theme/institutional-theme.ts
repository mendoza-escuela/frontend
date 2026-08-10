/**
 * Fuente única para colores usados desde TypeScript (Recharts, SVG y canvas).
 * Los mismos valores se exponen como tokens Tailwind en styles/index.css.
 */
export const INSTITUTIONAL_COLORS = Object.freeze({
  blue: "#000F9F",
  blueDark: "#000C80",
  blueSoft: "#EEF0FF",
  sky: "#3CB4E5",
  skyDark: "#2DA4D5",
  skySoft: "#E8F7FC",
  gold: "#C8A977",
  background: "#F7F4EF",
  surface: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
});

export const INSTITUTIONAL_CHART_COLORS = Object.freeze({
  primary: INSTITUTIONAL_COLORS.blue,
  secondary: INSTITUTIONAL_COLORS.sky,
  accent: INSTITUTIONAL_COLORS.gold,
  grid: INSTITUTIONAL_COLORS.border,
  axis: INSTITUTIONAL_COLORS.muted,
  label: INSTITUTIONAL_COLORS.text,
  critical: INSTITUTIONAL_COLORS.error,
  positive: INSTITUTIONAL_COLORS.success,
});

type PublicRuntimeConfigKey =
  | "VITE_API_URL"
  | "VITE_BRAND_MENDOZA_ON_LIGHT"
  | "VITE_BRAND_MENDOZA_ON_BLUE"
  | "VITE_BRAND_OPS_ON_LIGHT"
  | "VITE_BRAND_OPS_ON_BLUE";

const buildConfig: Record<PublicRuntimeConfigKey, string | undefined> = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_BRAND_MENDOZA_ON_LIGHT:
    import.meta.env.VITE_BRAND_MENDOZA_ON_LIGHT,
  VITE_BRAND_MENDOZA_ON_BLUE: import.meta.env.VITE_BRAND_MENDOZA_ON_BLUE,
  VITE_BRAND_OPS_ON_LIGHT: import.meta.env.VITE_BRAND_OPS_ON_LIGHT,
  VITE_BRAND_OPS_ON_BLUE: import.meta.env.VITE_BRAND_OPS_ON_BLUE,
};

/**
 * Lee primero la configuración generada al iniciar el contenedor y conserva
 * import.meta.env como fallback para desarrollo local y builds no Docker.
 * Estas variables son públicas y nunca deben contener secretos.
 */
export function getPublicRuntimeConfig(key: PublicRuntimeConfigKey) {
  return window.__APP_CONFIG__?.[key] ?? buildConfig[key];
}

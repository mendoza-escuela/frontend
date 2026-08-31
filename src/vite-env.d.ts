/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BRAND_MENDOZA_ON_LIGHT?: string;
  readonly VITE_BRAND_MENDOZA_ON_BLUE?: string;
  readonly VITE_BRAND_OPS_ON_LIGHT?: string;
  readonly VITE_BRAND_OPS_ON_BLUE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

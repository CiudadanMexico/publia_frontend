/// <reference types="astro/client" />

/**
 * Variables de entorno públicas del frontend.
 * Ninguna contiene secretos: el frontend es estático y no habla con APIs
 * privadas en tiempo de ejecución.
 */
interface ImportMetaEnv {
  /** URL base del WordPress headless (opcional en compilación). */
  readonly PUBLIC_WP_BASE_URL?: string;
  /** Endpoint de analítica (opcional; sin él no sale ningún evento). */
  readonly PUBLIC_ANALYTICS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Publia 6.0 — configuración del frontend narrativo.
 *
 * - Salida estática: el sitio se pre-renderiza para carga rápida y SEO.
 * - React entra únicamente como isla para interacciones con estado complejo.
 * - Three.js y GSAP se separan en chunks propios para no penalizar el primer
 *   render del texto.
 */
export default defineConfig({
  site: 'https://publia.mx',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  // La integración de React se activa en la Fase 4, cuando exista la primera
  // isla con estado complejo. Mantenerla antes descargaría el runtime de
  // React (224 kB) en cada página sin ningún uso.
  integrations: [sitemap()],
  vite: {
    // El preview se publica detrás de un túnel de Cloudflare: la petición
    // llega con el Host público (p. ej. *.trycloudflare.com) y Vite lo
    // rechazaría por defecto con un 403. Sólo afecta a `astro preview` y
    // `astro dev`; la salida de producción es estática y no valida Host.
    server: { allowedHosts: true },
    preview: { allowedHosts: true },
    build: {
      target: 'es2022',
      cssTarget: 'chrome100',
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            gsap: ['gsap'],
          },
        },
      },
    },
  },
});

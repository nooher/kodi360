import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// https://vite.dev/config/
export default defineConfig({
  server: { port: 5203 },
  preview: { port: 5203 },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'KODI360 — Msaidizi wa Kodi',
        short_name: 'KODI360',
        description:
          'Jukwaa la kodi la KODI360: usajili, makadirio ya haki, risiti nafuu, ' +
          'msaidizi wa AI wa nje ya mtandao, na ufuatiliaji wa migogoro ya kodi.',
        theme_color: '#0B6E4F',
        background_color: '#F7F5EF',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'kodi360-pages' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// L'app est servie sous https://<utilisateur>.github.io/projet-financia/ en
// production (GitHub Pages) et à la racine en développement.
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/projet-financia/' : '/'
  return {
    base,
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Financia — Finances personnelles',
          short_name: 'Financia',
          description: 'Gère ton budget simplement, en ligne comme hors ligne.',
          lang: 'fr',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#0f172a',
          theme_color: '#0f172a',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        }
      })
    ]
  }
})

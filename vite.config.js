import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FinanceFlow',
        short_name: 'FinanceFlow',
        description: 'Gestion intelligente de vos finances personnelles',
        theme_color: '#059669',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ttf,woff,woff2,mp3}']
      }
    })
  ],
})


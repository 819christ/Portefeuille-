import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/Portefeuille-/',
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Portefeuille',
        short_name: 'Portefeuille',
        description: 'Gestion intelligente de vos finances personnelles',
        theme_color: '#10b981',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/Portefeuille-/',
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


import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Z-Rush',
        short_name: 'Z-Rush',
        description: 'Zombie survival shooting defense game',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,glb,mp3,ogg}']
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser'
  }
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  plugins: [
    react(),
    // Compresses image assets during `vite build` (not in dev). Puppy photos
    // come straight from a phone camera, so this keeps the production bundle
    // a fraction of the source size without a manual export step.
    ViteImageOptimizer({
      jpg: { quality: 75, mozjpeg: true },
      jpeg: { quality: 75, mozjpeg: true },
      png: { quality: 75 },
      webp: { lossless: false, quality: 75 },
    }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

import { puppyDataPlugin } from './scripts/puppyDataPlugin.js'

const fromRoot = (path) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    puppyDataPlugin({
      dataFile: fromRoot('./src/data/litters.json'),
      schemaFile: fromRoot('./src/data/litters.schema.json'),
      imagesDir: fromRoot('./src/images'),
    }),
    // Makes the photo sizes src/data/imageLoader.jsx asks for (320, 1280, 1920 px WebP).
    // The originals stay untouched in the repo.
    imagetools(),
    // SVGs only: the photos are already sized and compressed by imagetools, and a
    // second lossy pass would only cost quality and build time.
    ViteImageOptimizer({ test: /\.svg$/i }),
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})

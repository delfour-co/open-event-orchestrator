import { resolve } from 'node:path'
import { defineConfig } from 'vite'

/**
 * Vite configuration for building embeddable widgets
 *
 * Build with: pnpm build:widgets
 * Output: dist/widgets/
 *
 * Usage:
 * - oeo-widgets.js - ES module containing all widgets (for modern browsers)
 * - Use with: <script type="module" src="oeo-widgets.js"></script>
 */
export default defineConfig({
  build: {
    outDir: 'dist/widgets',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/widgets/index.ts'),
      formats: ['es', 'iife'],
      name: 'OEOWidgets',
      fileName: (format) => `oeo-widgets.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: '[name][extname]'
      }
    },
    minify: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib')
    }
  }
})

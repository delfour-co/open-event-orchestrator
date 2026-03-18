import { readFileSync } from 'node:fs'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vitest/config'

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    tailwindcss(),
    sveltekit(),
    svelteTesting(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['cookie', 'navigatorLanguage', 'baseLocale']
    })
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    alias: {
      $lib: '/src/lib',
      '$env/dynamic/public': '/src/lib/server/__mocks__/env-public.ts'
    },
    setupFiles: ['./src/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/lib/**/*.test.ts',
        'src/lib/**/*.spec.ts',
        'src/lib/**/index.ts',
        'src/lib/**/infra/**',
        'src/lib/**/usecases/**',
        'src/lib/**/services/**',
        'src/lib/server/**',
        'src/lib/stores/**',
        'src/lib/utils.ts',
        'src/lib/components/**'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 60,
        statements: 80
      }
    }
  }
})

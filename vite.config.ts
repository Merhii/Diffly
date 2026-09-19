/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Two real entry points, not one app with a route: index.html is the public
// marketing site (no diff-parsing/rendering code in its dependency graph at
// all), viewer.html is the review app the CLI serves locally. Vite builds
// each into its own bundle based on what it actually imports.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        viewer: fileURLToPath(new URL('./viewer.html', import.meta.url)),
      },
    },
  },
  test: {
    environment: 'node',
  },
})

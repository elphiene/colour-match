import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5174,
    proxy: { '/api': 'http://localhost:8082' }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev server is wired straight to the API:
 *   - `/api/*` is proxied to the backend, so the browser sees one origin and
 *     CORS never enters the picture (the app calls a relative `/api` path).
 *   - `strictPort` makes a busy 5173 fail loudly instead of silently drifting
 *     to another port, which would leave the frontend on an origin the backend
 *     does not allow.
 *
 * `VITE_API_URL` overrides the base entirely (see .env.production for the
 * deployed API); leaving it unset is what enables the proxy path above.
 */
const API_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:4000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})

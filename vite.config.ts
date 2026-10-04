import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Absolute base so assets load correctly on nested URLs like /dashboard/events
  base: "/",
  plugins: [react()],
  server: {
    port: 5173,
    // In development, forward API and uploaded-file requests to the Express backend.
    // The browser only ever talks to localhost:5173, so there are no CORS issues.
    proxy: {
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
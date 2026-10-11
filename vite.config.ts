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
  build: {
    // The only bigger file is three.js for the home page waves, which loads after the page is shown.
    chunkSizeWarningLimit: 520,
    rollupOptions: {
      output: {
        // Pages are lazy-loaded (App.tsx). Group the libraries into a few long-cached files
        // instead of dozens of tiny ones, and merge any chunk under ~20 kB into a neighbour.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return "react"
          if (id.includes("lucide-react")) return "icons"
          // Small helpers used everywhere live with the UI kit (else they can land inside "charts" and drag it into every page)
          if (/node_modules\/(@radix-ui|@floating-ui|clsx|tailwind-merge|class-variance-authority|sonner)\//.test(id)) return "ui"
          if (id.includes("recharts") || /node_modules\/(d3-|victory-vendor)/.test(id)) return "charts"
          if (/node_modules\/(react-hook-form|@hookform|zod)\//.test(id)) return "forms"
          return undefined
        },
        experimentalMinChunkSize: 20_000,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
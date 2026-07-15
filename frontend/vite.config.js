import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration for the Airbnb capstone frontend.
 * - Uses the official @vitejs/plugin-react for JSX/Fast-Refresh support.
 * - Dev-server proxy forwards /api/* to the backend so the frontend never
 *   needs a hard-coded port when both services run locally.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the Express backend during development
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    // Generate source maps for easier debugging in production
    sourcemap: false
  }
});

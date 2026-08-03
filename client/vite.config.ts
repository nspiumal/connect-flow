/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    hmr: {
      host: "localhost",
      port: 3000,
      protocol: "ws",
    },
    middlewareMode: false,
  },
  preview: {
    allowedHosts: ["empowering-liberation-production-0f11.up.railway.app"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // `node_modules` is a load path so the vendored Facit SCSS can import
        // Bootstrap/animate.css as plain package paths (`bootstrap/scss/root`).
        // Upstream Facit wrote these as `node_modules/bootstrap/scss/root`,
        // which only resolves under Sass's legacy `render()` — it breaks as soon
        // as `sass-embedded` is present (an optional peer of Vite, so it lands
        // on a fresh `npm install`) because Vite then uses the modern compiler.
        includePaths: [path.resolve(__dirname), path.resolve(__dirname, "node_modules")],
        quietDeps: true,
        silenceDeprecations: ["import", "global-builtin", "color-functions", "mixed-decls"],
      },
    },
  },
  optimizeDeps: {
    exclude: [
      "@vitejs/plugin-react-swc",
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
}));

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import version from "vite-plugin-package-version";

// Docker development configuration
export default defineConfig({
  base: "",
  plugins: [vue(), version()],
  resolve: {
    alias: {
      "@": resolve(dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      // In Docker, proxy to the recorder service
      '/api': {
        target: 'http://recorder:8083',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'http://recorder:8083',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  test: {
    environment: "jsdom",
  },
});

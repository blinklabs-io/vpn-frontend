/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    topLevelAwait(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|svg)$/i,
      svg: { multipass: true },
      png: { quality: 80, compressionLevel: 9 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "https://preprod-api.b7s.services",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14.1"],
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/",
      ],
    },
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  cacheDir: "../.tmp/vite",
  server: {
    proxy: Object.fromEntries([
      "runtime-models", "benchmark-jobs", "internal/benchmark-jobs", "model-scores", "health", "ready", "scientific-records", "dashboard-summary", "datasets",
      "dataset-versions", "models", "benchmark-runs", "evaluations",
      "layer1-results", "layer2-results", "scientific-reviews",
    ].map(name => [`/${name}`, {
      target: "http://127.0.0.1:8000",
      bypass: (request: { headers: { accept?: string }; url?: string }) =>
        request.headers.accept?.includes("text/html") ? request.url : undefined,
    }]))
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  }
});

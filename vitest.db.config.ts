import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globals: true,
    setupFiles: ["./tests/setup/vitest.db.setup.ts"],
    include: ["tests/database/**/*.{test,spec}.ts"],
    hookTimeout: 30_000,
    maxWorkers: 1,
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});

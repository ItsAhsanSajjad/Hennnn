import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**", "tests/database/**", "node_modules/**", ".next/**"],
    coverage: {
      reporter: ["text", "html"],
      exclude: ["tests/**", "src/app/**/page.tsx", "src/app/**/layout.tsx"],
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});

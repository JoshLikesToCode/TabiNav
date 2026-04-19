import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  // @vitejs/plugin-react transforms JSX before vite:import-analysis runs.
  // tsconfig.json sets jsx: "preserve" for Next.js and must not be changed.
  // Vitest 4 uses oxc by default; adding this plugin is the correct override.
  plugins: [react()],

  test: {
    // jsdom gives us window, document, and location — required by useTripLoader
    // and createPortal in integration tests.
    environment: "jsdom",

    // Inject globals (describe, it, expect, vi) so tests don't need explicit
    // imports. Mirrors the Vitest default when globals: true.
    globals: true,

    // Run the setup file before every test file to:
    //   • extend expect with @testing-library/jest-dom matchers
    setupFiles: ["./tests/setup.ts"],

    // Include both unit and integration test files
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    // Mirror tsconfig paths so @/lib/... imports work inside tests
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

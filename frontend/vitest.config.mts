import { defineConfig } from "vitest/config";

export default defineConfig({
  // `.mts` so the ESM config is not loaded as CommonJS. Path aliases come from
  // tsconfig.json natively; JSX is handled by Vite's own transform.
  resolve: { tsconfigPaths: true },
  test: {
    // The tests cover pure functions and PDF generation, both of which run in
    // plain Node — @react-pdf/renderer renders without a browser. No jsdom.
    environment: "node",
    include: ["tests/**/*.test.ts?(x)"],
  },
});

import { defineConfig } from "vitest/config";

// Path aliases come from tsconfig.json natively; JSX is handled by Vite's own
// transform. Repeated per project because `projects` entries do not inherit
// the root `resolve` block.
const resolve = { tsconfigPaths: true } as const;

export default defineConfig({
  test: {
    projects: [
      {
        resolve,
        test: {
          // Pure functions and PDF generation, both of which run in plain
          // Node — @react-pdf/renderer renders without a browser.
          name: "node",
          environment: "node",
          // Everything outside `tests/ui`, rather than a single level, so a
          // test added in a new subdirectory cannot fall between the two
          // projects and be silently skipped.
          include: ["tests/**/*.test.ts?(x)"],
          exclude: ["tests/ui/**"],
        },
      },
      {
        resolve,
        test: {
          // The React app itself: form input through to the download call.
          name: "ui",
          environment: "jsdom",
          include: ["tests/ui/**/*.test.ts?(x)"],
          setupFiles: ["./tests/ui/setup.ts"],
        },
      },
    ],
  },
});

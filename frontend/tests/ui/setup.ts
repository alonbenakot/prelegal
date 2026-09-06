import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Registered by hand rather than by Testing Library's auto-cleanup, which only
// installs itself when Vitest runs with `globals: true`.
afterEach(cleanup);

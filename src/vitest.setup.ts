// initial setup for Vitest + Testing Library
// imports all the testing functions like toBeInTheDocument(), etc...
import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver for tests => needed for Calendar component since it's using HeadlessUI
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// To clean up after each test
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Automatically unmount and cleanup DOM after the test is finished.
afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.resetAllMocks();
});

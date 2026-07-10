import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's auto-cleanup detection isn't reliable in every vitest config;
// register it explicitly so each test unmounts its render before the next
// one runs (otherwise DOM from prior tests in the same file accumulates
// and duplicate-testid/text queries start failing with "found multiple").
afterEach(() => {
  cleanup();
});

// Radix UI primitives (Select, Dialog) touch these APIs which jsdom doesn't
// implement; stub them so interaction tests don't throw.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (typeof (globalThis as any).ResizeObserver === "undefined") {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

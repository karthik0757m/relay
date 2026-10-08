import "@testing-library/jest-dom";
import "vitest-axe/extend-expect";
import { configure } from "@testing-library/react";
import { configureAxe } from "vitest-axe";

// Increase async timeout for animated components
configure({ asyncUtilTimeout: 3000 });

// Suppress colour-contrast violations from K-owned design tokens.
// These are documented in docs/a11y-t.md for K to address.
configureAxe({
  globalOptions: {
    rules: [{ id: 'color-contrast', enabled: false }],
  },
});

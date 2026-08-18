// Shared next-themes mock. Import for its side effect:
//
//   import "@/test/theme";
//
// Control the theme via themeState (set resolvedTheme, assert setTheme calls).
import { vi } from "vitest";

import { themeState } from "./theme-state";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: themeState.resolvedTheme,
    setTheme: themeState.setTheme,
  }),
}));

export { resetTheme, themeState } from "./theme-state";

// Shared next-themes mock. Import for its side effect:
//
//   import "@/test/theme";
//
// Control the theme via themeState (set resolvedTheme, assert setTheme calls).
import { vi } from "vitest";

export const themeState = vi.hoisted(() => ({
  resolvedTheme: "light" as string | undefined,
  setTheme: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: themeState.resolvedTheme,
    setTheme: themeState.setTheme,
  }),
}));

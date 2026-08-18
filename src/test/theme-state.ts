// Mutable next-themes mock state. Kept in its own module (no vi.mock here);
// theme.ts registers the next-themes mock against this state.
import { vi } from "vitest";

export const themeState = {
  resolvedTheme: "light" as string | undefined,
  setTheme: vi.fn(),
};

export function resetTheme(): void {
  themeState.resolvedTheme = "light";
  themeState.setTheme.mockClear();
}

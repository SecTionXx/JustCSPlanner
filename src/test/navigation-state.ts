// Mutable router/navigation mock state. Kept in its own module (no vi.mock
// here) so test files can import it directly; navigation.ts registers the
// next/navigation mock against this state.
import { vi } from "vitest";

export const navState = {
  pathname: "/",
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
};

/** Point the mock at a route; call in beforeEach or per-test. */
export function setNavigation(opts: {
  pathname?: string;
  searchParams?: URLSearchParams;
}): void {
  if (opts.pathname !== undefined) navState.pathname = opts.pathname;
  if (opts.searchParams !== undefined) navState.searchParams = opts.searchParams;
}

/** Clear call history and restore defaults. */
export function resetNavigation(): void {
  navState.pathname = "/";
  navState.searchParams = new URLSearchParams();
  for (const fn of [
    navState.push,
    navState.replace,
    navState.refresh,
    navState.back,
    navState.prefetch,
  ]) {
    fn.mockClear();
  }
}

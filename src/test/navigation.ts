// Shared next/navigation mock. Import this module for its side effect in any
// test file whose component uses usePathname/useRouter/useSearchParams:
//
//   import "@/test/navigation";
//
// The mock state is module-level and mutable via setNavigation()/resetNavigation().
import { vi } from "vitest";

export const navState = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({
    push: navState.push,
    replace: navState.replace,
    refresh: navState.refresh,
    back: navState.back,
    prefetch: navState.prefetch,
  }),
  useSearchParams: () => navState.searchParams,
  useParams: () => ({}),
  redirect: vi.fn(),
}));

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

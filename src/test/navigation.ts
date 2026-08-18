// Shared next/navigation mock. Import this module for its side effect in any
// test file whose component uses usePathname/useRouter/useSearchParams:
//
//   import "@/test/navigation";
//
// State lives in navigation-state.ts (import it for assertions).
import { vi } from "vitest";

import { navState } from "./navigation-state";

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

export { navState, resetNavigation, setNavigation } from "./navigation-state";

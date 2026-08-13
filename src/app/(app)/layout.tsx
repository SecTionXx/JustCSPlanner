import type { ReactNode } from "react";

import { AppShell } from "@/components/shell";

// Mock data uses `new Date()` for relative deadlines, so pages must render at
// request time — never statically cached.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

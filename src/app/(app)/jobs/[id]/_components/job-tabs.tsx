"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Tabs } from "@/components/ui/tabs";

export const JOB_TAB_VALUES = ["overview", "todos", "docs", "activity"] as const;
export type JobTabValue = (typeof JOB_TAB_VALUES)[number];

export interface JobTabsProps {
  tab: JobTabValue;
  children: React.ReactNode;
}

/**
 * Controlled Tabs bound to the ?tab= query param. Tab clicks replace the URL
 * (shareable deep links without polluting history), and navigating to the same
 * route with a different ?tab= re-renders the page with the new value — an
 * uncontrolled Tabs would ignore that after first mount.
 */
export function JobTabs({ tab, children }: JobTabsProps): React.ReactElement {
  const router = useRouter();

  const handleValueChange = (value: string): void => {
    const sp = new URLSearchParams(globalThis.location?.search ?? "");
    sp.set("tab", value);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={handleValueChange}>
      {children}
    </Tabs>
  );
}

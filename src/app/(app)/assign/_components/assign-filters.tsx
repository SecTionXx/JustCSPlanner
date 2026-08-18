"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface AssignFiltersProps {
  team: TeamMember[];
}

/**
 * Client-side filter bar that mirrors owner / overdue / near-deadline state
 * into URL searchParams. The server re-renders the job list from the updated
 * searchParams.
 */
export function AssignFilters({ team }: AssignFiltersProps): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();

  const currentOwner = params.get("owner") ?? "";
  const overdueActive = params.get("overdue") === "1";
  const nearActive = params.get("near") === "1";

  function navigate(next: {
    owner?: string;
    overdue?: boolean;
    near?: boolean;
  }): void {
    const sp = new URLSearchParams(params.toString());
    if (next.owner !== undefined) {
      if (next.owner === "") sp.delete("owner");
      else sp.set("owner", next.owner);
    }
    if (next.overdue !== undefined) {
      if (next.overdue) sp.set("overdue", "1");
      else sp.delete("overdue");
    }
    if (next.near !== undefined) {
      if (next.near) sp.set("near", "1");
      else sp.delete("near");
    }
    const qs = sp.toString();
    router.push(qs ? `/assign?${qs}` : "/assign");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={currentOwner}
        onChange={(e) => navigate({ owner: e.target.value })}
        className="h-8 rounded-md border bg-card px-2 text-[13px]"
        aria-label="กรองตามเจ้าของงาน"
      >
        <option value="">เจ้าของ: ทั้งหมด</option>
        {team.map((m) => (
          <option key={m.csId} value={m.csId}>
            {m.displayName}
          </option>
        ))}
      </select>

      <FilterChip
        active={overdueActive}
        onClick={() => navigate({ overdue: !overdueActive })}
      >
        เกินกำหนด
      </FilterChip>
      <FilterChip
        active={nearActive}
        onClick={() => navigate({ near: !nearActive })}
      >
        ใกล้ Deadline
      </FilterChip>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "bg-primary font-bold text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

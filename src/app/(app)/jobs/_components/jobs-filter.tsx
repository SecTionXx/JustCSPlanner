"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { JOB_STATUSES } from "@/lib/enums";
import { cn } from "@/lib/utils";

const STATUS_ALL = "all";

/**
 * Client-side filter bar that mirrors state into URL searchParams (status, q).
 * Server re-renders the job list from the updated searchParams.
 */
export function JobsFilter(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") ?? STATUS_ALL;

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = React.useCallback(
    (next: { status?: string; q?: string }) => {
      const sp = new URLSearchParams(params.toString());
      if (next.status !== undefined) {
        if (next.status === STATUS_ALL) sp.delete("status");
        else sp.set("status", next.status);
      }
      if (next.q !== undefined) {
        if (next.q === "") sp.delete("q");
        else sp.set("q", next.q);
      }
      const qs = sp.toString();
      router.push(qs ? `/jobs?${qs}` : "/jobs");
    },
    [params, router],
  );

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => navigate({ q: val }), 350);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="⌕ ค้นหาชื่อลูกค้า, Booking, Job ID..."
        className="h-9 max-w-md text-sm"
        onChange={onSearch}
      />
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={currentStatus === STATUS_ALL}
          onClick={() => navigate({ status: STATUS_ALL })}
        >
          ทั้งหมด
        </FilterChip>
        {JOB_STATUSES.map((status) => (
          <FilterChip
            key={status}
            active={currentStatus === status}
            onClick={() => navigate({ status })}
          >
            {status}
          </FilterChip>
        ))}
      </div>
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
        active ? "font-bold" : "text-[#657085] hover:bg-[#f5f3fb]",
      )}
      style={
        active
          ? { backgroundColor: "#eeeaff", color: "#5b21b6" }
          : { backgroundColor: "#f5f3fb" }
      }
    >
      {children}
    </button>
  );
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, LayoutGrid, List, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JOB_STATUSES } from "@/lib/enums";
import { JOB_STATUS_TH } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STATUS_ALL = "all";
const SORTS = [
  { value: "deadline", label: "Deadline ใกล้สุด" },
  { value: "priority", label: "ความสำคัญ" },
  { value: "created", label: "สร้างล่าสุด" },
  { value: "customer", label: "ลูกค้า A-Z" },
] as const;

/**
 * Client-side filter bar that mirrors state into URL searchParams
 * (status, q, sort, view). Server re-renders the job list from the
 * updated searchParams.
 */
export function JobsFilter(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") ?? STATUS_ALL;
  const currentQ = params.get("q") ?? "";
  const currentSort = params.get("sort") ?? "deadline";
  const currentView = params.get("view") === "list" ? "list" : "grid";
  const hasFilters =
    currentStatus !== STATUS_ALL || currentQ !== "" || params.get("sort") !== null;

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = React.useCallback(
    (next: { status?: string; q?: string; sort?: string; view?: string }) => {
      const sp = new URLSearchParams(params.toString());
      if (next.status !== undefined) {
        if (next.status === STATUS_ALL) sp.delete("status");
        else sp.set("status", next.status);
      }
      if (next.q !== undefined) {
        if (next.q === "") sp.delete("q");
        else sp.set("q", next.q);
      }
      if (next.sort !== undefined) {
        if (next.sort === "deadline") sp.delete("sort");
        else sp.set("sort", next.sort);
      }
      if (next.view !== undefined) {
        if (next.view === "grid") sp.delete("view");
        else sp.set("view", next.view);
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            defaultValue={currentQ}
            placeholder="ค้นหาชื่อลูกค้า, Booking, Job ID..."
            className="h-9 pl-8 text-sm"
            onChange={onSearch}
          />
        </div>

        <Select value={currentSort} onValueChange={(v) => navigate({ sort: v as string })}>
          <SelectTrigger className="h-9 w-[170px] text-xs">
            <ArrowUpDown className="size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1 rounded-[9px] border border-border p-0.5">
          <ViewButton
            active={currentView === "grid"}
            label="มุมมองการ์ด"
            onClick={() => navigate({ view: "grid" })}
          >
            <LayoutGrid className="size-3.5" />
          </ViewButton>
          <ViewButton
            active={currentView === "list"}
            label="มุมมองรายการ"
            onClick={() => navigate({ view: "list" })}
          >
            <List className="size-3.5" />
          </ViewButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
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
            {JOB_STATUS_TH[status]}
          </FilterChip>
        ))}
        {hasFilters ? (
          <button
            type="button"
            onClick={() => router.push("/jobs")}
            className="ml-1 inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3" />
            ล้างตัวกรอง
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-[7px] transition-colors",
        active
          ? "bg-secondary font-bold text-secondary-foreground"
          : "text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
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
          : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
      )}
    >
      {children}
    </button>
  );
}

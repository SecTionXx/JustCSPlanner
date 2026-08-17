import { KpiSkeleton, Skeleton } from "@/components/shell"

export default function TeamLoading(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <KpiSkeleton />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-[14px]" />
        ))}
      </div>
    </div>
  )
}

import { KpiSkeleton, Skeleton } from "@/components/shell"

export default function ReportsLoading(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <KpiSkeleton count={6} />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-[14px]" />
        <Skeleton className="h-64 rounded-[14px]" />
      </div>
    </div>
  )
}

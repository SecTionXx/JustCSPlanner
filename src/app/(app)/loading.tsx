import { KpiSkeleton, Skeleton } from "@/components/shell"

export default function AppLoading(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <KpiSkeleton />
      <Skeleton className="h-48 rounded-[14px]" />
    </div>
  )
}

import { Skeleton } from "@/components/shell"

export default function JobDetailLoading(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-2/3 rounded-[14px]" />
      <Skeleton className="h-10 w-full rounded-[10px]" />
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-[14px] lg:col-span-2" />
        <Skeleton className="h-72 rounded-[14px]" />
      </div>
    </div>
  )
}

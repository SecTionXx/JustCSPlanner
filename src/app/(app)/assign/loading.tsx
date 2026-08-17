import { Skeleton } from "@/components/shell"

export default function AssignLoading(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full rounded-[10px]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-[12px]" />
      ))}
    </div>
  )
}

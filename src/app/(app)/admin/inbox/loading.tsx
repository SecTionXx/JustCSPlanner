import { Skeleton } from "@/components/shell"

export default function InboxLoading(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-[12px]" />
      ))}
    </div>
  )
}

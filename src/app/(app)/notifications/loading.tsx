import { Skeleton } from "@/components/shell"

export default function NotificationsLoading(): React.ReactElement {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-[12px]" />
      ))}
    </div>
  )
}

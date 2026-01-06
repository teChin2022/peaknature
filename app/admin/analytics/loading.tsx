import { Skeleton } from '@/components/ui/skeleton'

export default function AdminAnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-24 mb-1.5 bg-gray-100" />
        <Skeleton className="h-4 w-48 bg-gray-100" />
      </div>

      {/* Section Title */}
      <Skeleton className="h-3 w-36 bg-gray-100" />

      {/* Current Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 bg-gray-100" />
                <Skeleton className="h-7 w-16 bg-gray-100" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg bg-gray-100" />
            </div>
            <Skeleton className="h-3 w-28 mt-4 bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Section Title */}
      <Skeleton className="h-3 w-28 bg-gray-100" />

      {/* All Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-gray-100" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20 bg-gray-100" />
                <Skeleton className="h-6 w-14 bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <Skeleton className="h-4 w-28 bg-gray-100" />
        </div>
        <div className="p-5">
          <Skeleton className="h-56 w-full rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

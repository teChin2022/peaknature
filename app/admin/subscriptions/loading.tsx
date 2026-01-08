import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSubscriptionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-32 mb-1.5 bg-gray-100" />
        <Skeleton className="h-4 w-64 bg-gray-100" />
      </div>

      {/* Stats Grid - 5 cards to match actual page */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 bg-gray-100" />
                <Skeleton className="h-7 w-14 bg-gray-100" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg bg-gray-100" />
            </div>
            <Skeleton className="h-3 w-28 mt-4 bg-gray-100" />
          </div>
        ))}
      </div>

      {/* All Subscriptions Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <Skeleton className="h-4 w-32 bg-gray-100" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-12 rounded-lg bg-gray-100" />
            <Skeleton className="h-8 w-14 rounded-lg bg-gray-100" />
            <Skeleton className="h-8 w-16 rounded-lg bg-gray-100" />
            <Skeleton className="h-8 w-16 rounded-lg bg-gray-100" />
          </div>
        </div>
        
        {/* Table Header */}
        <div className="flex items-center gap-4 px-5 py-3 bg-gray-50/50 border-b border-gray-50">
          <Skeleton className="w-1/5 h-3 bg-gray-100" />
          <Skeleton className="w-1/12 h-3 bg-gray-100" />
          <Skeleton className="w-1/12 h-3 bg-gray-100" />
          <Skeleton className="w-1/6 h-3 bg-gray-100" />
          <Skeleton className="w-1/12 h-3 bg-gray-100" />
          <Skeleton className="w-1/12 h-3 bg-gray-100 ml-auto" />
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50">
            <div className="w-1/5 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg bg-gray-100" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24 bg-gray-100" />
                <Skeleton className="h-3 w-16 bg-gray-100" />
              </div>
            </div>
            <Skeleton className="w-1/12 h-5 rounded bg-gray-100" />
            <Skeleton className="w-1/12 h-5 rounded bg-gray-100" />
            <Skeleton className="w-1/6 h-4 bg-gray-100" />
            <Skeleton className="w-1/12 h-4 bg-gray-100" />
            <Skeleton className="w-1/12 h-7 rounded bg-gray-100 ml-auto" />
          </div>
        ))}
        
        {/* Pagination */}
        <div className="px-5 py-4 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40 bg-gray-100" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded bg-gray-100" />
              <Skeleton className="h-8 w-8 rounded bg-gray-100" />
              <Skeleton className="h-8 w-8 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

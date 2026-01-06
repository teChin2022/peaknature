import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSubscriptionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-32 mb-1.5 bg-gray-100" />
        <Skeleton className="h-4 w-56 bg-gray-100" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <Skeleton className="h-4 w-32 bg-gray-100" />
        </div>
        
        {/* Table Header */}
        <div className="flex items-center gap-4 px-5 py-3 bg-gray-50/50 border-b border-gray-50">
          <Skeleton className="w-1/4 h-3 bg-gray-100" />
          <Skeleton className="w-1/8 h-3 bg-gray-100" />
          <Skeleton className="w-1/8 h-3 bg-gray-100" />
          <Skeleton className="w-1/8 h-3 bg-gray-100" />
          <Skeleton className="w-1/6 h-3 bg-gray-100" />
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50">
            <div className="w-1/4 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg bg-gray-100" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24 bg-gray-100" />
                <Skeleton className="h-3 w-16 bg-gray-100" />
              </div>
            </div>
            <Skeleton className="w-1/8 h-5 rounded bg-gray-100" />
            <Skeleton className="w-1/8 h-4 bg-gray-100" />
            <Skeleton className="w-1/8 h-5 rounded bg-gray-100" />
            <Skeleton className="w-1/6 h-4 bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUsersLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-20 mb-1.5 bg-gray-100" />
        <Skeleton className="h-4 w-48 bg-gray-100" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-3 flex-wrap">
          <Skeleton className="flex-1 min-w-48 h-9 rounded-lg bg-gray-100" />
          <Skeleton className="w-[130px] h-9 rounded-lg bg-gray-100" />
          <Skeleton className="w-20 h-9 rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center gap-4 px-5 py-3 bg-gray-50/50 border-b border-gray-50">
          <Skeleton className="w-1/4 h-3 bg-gray-100" />
          <Skeleton className="w-1/8 h-3 bg-gray-100" />
          <Skeleton className="w-1/6 h-3 bg-gray-100" />
          <Skeleton className="w-1/8 h-3 bg-gray-100" />
          <Skeleton className="w-1/6 h-3 bg-gray-100" />
          <Skeleton className="w-1/12 h-3 bg-gray-100" />
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50">
            <div className="w-1/4 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full bg-gray-100" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24 bg-gray-100" />
                <Skeleton className="h-3 w-32 bg-gray-100" />
              </div>
            </div>
            <Skeleton className="w-1/8 h-5 rounded bg-gray-100" />
            <Skeleton className="w-1/6 h-4 bg-gray-100" />
            <Skeleton className="w-1/8 h-5 rounded bg-gray-100" />
            <Skeleton className="w-1/6 h-4 bg-gray-100" />
            <Skeleton className="w-1/12 h-7 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

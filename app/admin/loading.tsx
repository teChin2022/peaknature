import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardLoading() {
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
                <Skeleton className="h-3 w-20 bg-gray-100" />
                <Skeleton className="h-7 w-14 bg-gray-100" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg bg-gray-100" />
            </div>
            <Skeleton className="h-3 w-24 mt-4 bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <Skeleton className="h-4 w-28 bg-gray-100" />
          <Skeleton className="h-8 w-20 bg-gray-100 rounded" />
        </div>
        <div className="p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-gray-100" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 bg-gray-100" />
                  <Skeleton className="h-3 w-20 bg-gray-100" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-12 rounded bg-gray-100" />
                <Skeleton className="h-5 w-14 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


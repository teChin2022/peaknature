import { Skeleton } from '@/components/ui/skeleton'

export default function ConsentLogsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-40 mb-1.5 bg-gray-100" />
        <Skeleton className="h-4 w-64 bg-gray-100" />
      </div>

      {/* Stats Cards */}
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

      {/* Consent Records Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <Skeleton className="h-5 w-32 bg-gray-100" />
          <Skeleton className="h-4 w-24 bg-gray-100" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded bg-gray-100" />
                    <Skeleton className="h-4 w-32 bg-gray-100" />
                  </div>
                  <Skeleton className="h-3 w-48 bg-gray-100" />
                  <div className="flex items-center gap-4 mt-2">
                    <Skeleton className="h-3 w-24 bg-gray-100" />
                    <Skeleton className="h-3 w-32 bg-gray-100" />
                    <Skeleton className="h-3 w-40 bg-gray-100" />
                  </div>
                </div>
                <Skeleton className="h-4 w-28 bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="px-5 py-4 border-t border-gray-50 flex justify-between items-center">
          <Skeleton className="h-4 w-40 bg-gray-100" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded bg-gray-100" />
            <Skeleton className="h-8 w-8 rounded bg-gray-100" />
            <Skeleton className="h-8 w-8 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  )
}


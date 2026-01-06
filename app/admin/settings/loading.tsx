import { Skeleton } from '@/components/ui/skeleton'

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-24 mb-1.5 bg-gray-100" />
          <Skeleton className="h-4 w-48 bg-gray-100" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg bg-gray-100" />
      </div>

      {/* Settings Cards */}
      <div className="grid gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-gray-100" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 bg-gray-100" />
                <Skeleton className="h-3 w-48 bg-gray-100" />
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <Skeleton className="h-3 w-24 bg-gray-100" />
                    <Skeleton className="h-9 w-full rounded-lg bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

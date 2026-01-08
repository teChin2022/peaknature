import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function MyBookingsLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header - matches MyBookingsContent header */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Booking Cards */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-stone-200 !p-0">
              <div className="flex flex-col md:flex-row">
                {/* Image skeleton */}
                <div className="relative w-full md:w-56 lg:w-64 flex-shrink-0">
                  <Skeleton className="w-full h-48 md:h-full md:min-h-[200px]" />
                  {/* Status badge */}
                  <Skeleton className="absolute top-3 left-3 h-5 w-20 rounded-full" />
                </div>
                {/* Content skeleton */}
                <CardContent className="flex-1 p-5 md:p-6 !px-5 md:!px-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-40" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="text-right space-y-1">
                          <Skeleton className="h-6 w-24 ml-auto" />
                          <Skeleton className="h-3 w-12 ml-auto" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

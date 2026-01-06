import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function BookingConfirmationLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Back navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        {/* Success Message Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        {/* Booking Details Card Skeleton */}
        <Card className="border-stone-200 overflow-hidden !p-0 max-w-2xl mx-auto">
          <Skeleton className="w-full aspect-[21/9]" />
          <CardContent className="p-6 space-y-6">
            {/* Room info */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Booking details grid */}
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-7 w-28" />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


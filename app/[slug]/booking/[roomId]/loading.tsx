import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function BookingPageLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-5xl px-6 py-4 lg:px-8">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <Skeleton className="h-9 w-56 mb-8" />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Booking Form Side */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Trip Details Card */}
            <Card className="border-stone-200">
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card className="border-stone-200">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Transport options skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                  </div>
                </div>
                {/* QR Code skeleton */}
                <div className="flex justify-center py-4">
                  <Skeleton className="h-48 w-48" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>

            {/* Upload Section */}
            <Card className="border-stone-200">
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>

            {/* Policy */}
            <div className="flex items-start gap-3 p-4 bg-stone-100 rounded-lg">
              <Skeleton className="h-5 w-5 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>

          {/* Booking Summary Side */}
          <div className="order-1 lg:order-2">
            <Card className="border-stone-200 sticky top-24 overflow-hidden !p-0">
              <Skeleton className="aspect-[16/9] w-full" />
              <CardContent className="p-6 space-y-4">
                {/* Room Info */}
                <div className="pb-6 border-b border-stone-200">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-32 mb-3" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                {/* Check-in/out times */}
                <div className="grid grid-cols-2 gap-4 py-4 border-b border-stone-200">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="py-4 border-b border-stone-200 space-y-3">
                  <Skeleton className="h-5 w-28" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 flex justify-between items-center">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

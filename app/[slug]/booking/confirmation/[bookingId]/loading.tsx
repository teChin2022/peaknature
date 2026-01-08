import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function BookingConfirmationLoading() {
  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-10">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-6" />
          <Skeleton className="h-9 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        {/* Booking Details Card */}
        <Card className="border-stone-200 shadow-lg mb-8 overflow-hidden !p-0">
          <CardContent className="p-0">
            {/* Room Preview Header */}
            <div className="relative">
              <Skeleton className="h-48 w-full" />
            </div>

            {/* Booking Reference */}
            <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
              <Skeleton className="h-3 w-28 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>

            {/* Stay Details */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Check-in */}
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                {/* Check-out */}
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>

              <Skeleton className="h-px w-full my-6" />

              {/* Guest Info */}
              <div className="flex items-center gap-3 mb-6">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-32" />
              </div>

              <Skeleton className="h-px w-full my-6" />

              {/* Price Summary */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card className="border-stone-200 mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  )
}

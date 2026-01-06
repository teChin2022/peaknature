import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// ============================================
// COMMON SKELETONS
// ============================================

export function PageHeaderSkeleton() {
  return (
    <div className="bg-white border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="border-stone-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-28 mt-4" />
      </CardContent>
    </Card>
  )
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {Array.from({ length: columns - 2 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
    </div>
  )
}

// ============================================
// ROOM SKELETONS
// ============================================

export function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden border-stone-200 !p-0">
      <div className="flex flex-col md:flex-row">
        {/* Image skeleton */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <Skeleton className="w-full h-48 md:h-full md:min-h-[240px]" />
        </div>
        {/* Content skeleton */}
        <CardContent className="flex-1 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <Skeleton className="h-6 w-48" />
            <div className="text-right space-y-1">
              <Skeleton className="h-7 w-24 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export function RoomCardVerticalSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-6">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// BOOKING SKELETONS
// ============================================

export function BookingCardSkeleton() {
  return (
    <Card className="overflow-hidden border-stone-200 !p-0">
      <div className="flex flex-col md:flex-row">
        {/* Image skeleton */}
        <div className="relative w-full md:w-56 lg:w-64 flex-shrink-0">
          <Skeleton className="w-full h-48 md:h-full md:min-h-[200px]" />
        </div>
        {/* Content skeleton */}
        <CardContent className="flex-1 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-6 w-20 ml-auto" />
              <Skeleton className="h-3 w-12 ml-auto" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

// ============================================
// DASHBOARD SKELETONS
// ============================================

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DashboardRecentBookingsSkeleton() {
  return (
    <Card className="border-stone-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} columns={3} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// HERO SKELETON
// ============================================

export function HeroSkeleton() {
  return (
    <section className="relative min-h-[80vh] sm:min-h-[85vh] lg:min-h-[90vh] flex items-center bg-gradient-to-br from-stone-50 via-white to-amber-50/30">
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <Skeleton className="h-8 w-48 mx-auto lg:mx-0 mb-6 rounded-full" />
            <Skeleton className="h-12 w-full max-w-md mx-auto lg:mx-0 mb-3" />
            <Skeleton className="h-12 w-3/4 max-w-sm mx-auto lg:mx-0 mb-6" />
            <Skeleton className="h-5 w-full max-w-xl mx-auto lg:mx-0 mb-2" />
            <Skeleton className="h-5 w-4/5 max-w-lg mx-auto lg:mx-0 mb-8" />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Skeleton className="h-14 w-40" />
              <Skeleton className="h-14 w-40" />
            </div>
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-stone-200">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center lg:text-left">
                  <Skeleton className="h-8 w-16 mx-auto lg:mx-0 mb-1" />
                  <Skeleton className="h-4 w-20 mx-auto lg:mx-0" />
                </div>
              ))}
            </div>
          </div>
          {/* Image Grid */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Skeleton className="aspect-[3/4] rounded-2xl" />
                <Skeleton className="aspect-[4/3] rounded-2xl" />
              </div>
              <div className="space-y-4 pt-8">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="aspect-[3/4] rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// AMENITIES SKELETON
// ============================================

export function AmenitiesSkeleton() {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="h-9 w-56 mx-auto mb-4" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i}
              className="flex flex-col items-center p-6 bg-white rounded-2xl"
            >
              <Skeleton className="h-16 w-16 rounded-full mb-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FILTERS SKELETON
// ============================================

export function FiltersSkeleton() {
  return (
    <Card className="border-stone-200 sticky top-24">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

// ============================================
// TABS SKELETON
// ============================================

export function TabsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// ============================================
// TABLE SKELETON
// ============================================

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Card className="border-stone-200">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// REVIEW SKELETON
// ============================================

export function ReviewCardSkeleton() {
  return (
    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mt-3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-24 mt-2" />
        </div>
      </div>
    </div>
  )
}

// ============================================
// ROOM DETAIL SKELETON
// ============================================

export function RoomDetailSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Back navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Image Gallery */}
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-stone-200 sticky top-24">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// BOOKING CONFIRMATION SKELETON
// ============================================

export function BookingConfirmationSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Back navigation */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <Skeleton className="h-9 w-64 mb-8" />
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form side */}
          <div className="space-y-6 order-2 lg:order-1">
            <Card className="border-stone-200">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-48 w-48 mx-auto" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          {/* Summary side */}
          <div className="order-1 lg:order-2">
            <Card className="border-stone-200 sticky top-24 overflow-hidden !p-0">
              <Skeleton className="aspect-[16/9] w-full" />
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4 pb-6 border-b">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-3 py-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// CALENDAR SKELETON
// ============================================

export function CalendarSkeleton() {
  return (
    <Card className="border-stone-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-8 w-full" />
          ))}
          {/* Calendar days */}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={`day-${i}`} className="aspect-square rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


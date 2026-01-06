import { HeroSkeleton, RoomCardVerticalSkeleton, AmenitiesSkeleton } from '@/components/skeletons'

export default function TenantPageLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero Skeleton */}
      <HeroSkeleton />

      {/* Featured Rooms Skeleton */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="h-9 w-56 bg-stone-200 animate-pulse rounded mx-auto mb-4" />
            <div className="h-5 w-96 max-w-full bg-stone-200 animate-pulse rounded mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <RoomCardVerticalSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Skeleton */}
      <AmenitiesSkeleton />

      {/* Location Skeleton */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="h-9 w-48 bg-stone-200 animate-pulse rounded mb-4" />
              <div className="h-5 w-full bg-stone-200 animate-pulse rounded mb-2" />
              <div className="h-5 w-3/4 bg-stone-200 animate-pulse rounded mb-8" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-stone-200 animate-pulse rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-stone-200 animate-pulse rounded" />
                      <div className="h-4 w-48 bg-stone-200 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 aspect-[4/3] bg-stone-200 animate-pulse rounded-2xl" />
          </div>
        </div>
      </section>

      {/* CTA Skeleton */}
      <section className="py-16 sm:py-20 md:py-24 bg-stone-300 animate-pulse">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-12 w-96 max-w-full bg-stone-400 rounded mx-auto mb-6" />
          <div className="h-5 w-80 max-w-full bg-stone-400 rounded mx-auto mb-10" />
          <div className="h-14 w-40 bg-white rounded mx-auto" />
        </div>
      </section>
    </div>
  )
}


import { PageHeaderSkeleton, RoomCardSkeleton, FiltersSkeleton } from '@/components/skeletons'

export default function RoomsPageLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeaderSkeleton />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar Skeleton */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <FiltersSkeleton />
          </aside>

          {/* Room List Skeleton */}
          <div className="flex-1 space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


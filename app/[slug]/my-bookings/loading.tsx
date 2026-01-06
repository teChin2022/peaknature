import { PageHeaderSkeleton, TabsSkeleton } from '@/components/skeletons'

export default function MyBookingsLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeaderSkeleton />
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <TabsSkeleton />
      </div>
    </div>
  )
}


import { Skeleton } from '@/components/ui/skeleton'

export default function LoginLoading() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Skeleton className="h-14 w-14 rounded-xl mx-auto mb-4" />
          <Skeleton className="h-8 w-40 mx-auto mb-2" />
          <Skeleton className="h-5 w-52 mx-auto" />
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Submit Button */}
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        {/* Register Link */}
        <Skeleton className="h-4 w-56 mx-auto mt-6" />
      </div>
    </div>
  )
}

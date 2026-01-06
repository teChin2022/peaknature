import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SubscriptionLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-6 w-40 mb-1.5" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Trial/Status Banner */}
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card - 2 columns */}
        <Card className="lg:col-span-2 bg-white">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Plan info */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-9 w-28" />
            </div>

            {/* Feature Comparison Table */}
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-gray-50 border-b">
                <div className="p-3"><Skeleton className="h-4 w-16" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-4 w-12" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-4 w-10" /></div>
              </div>
              {/* Rows */}
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 border-b last:border-b-0">
                  <div className="p-3 flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="p-3 flex justify-center">
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="p-3 flex justify-center bg-indigo-50/50">
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan Card - 1 column */}
        <Card className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex items-baseline gap-1">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="bg-white">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

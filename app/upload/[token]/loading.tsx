import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function MobileUploadLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-6">
            <Skeleton className="h-16 w-16 mx-auto rounded-full mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded" />
            <Skeleton className="h-14 w-full rounded" />
          </div>

          <div className="mt-6 p-4 bg-stone-50 rounded-lg">
            <Skeleton className="h-3 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


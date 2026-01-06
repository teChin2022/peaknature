'use client'

import { formatDistanceToNow } from 'date-fns'
import { User } from 'lucide-react'
import Image from 'next/image'
import { StarRating } from './star-rating'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    comment: string | null
    created_at: string
    user?: {
      full_name: string | null
      avatar_url: string | null
    }
  }
  primaryColor?: string
}

export function ReviewCard({ review, primaryColor = '#f59e0b' }: ReviewCardProps) {
  const displayName = review.user?.full_name || 'Anonymous Guest'
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true })

  return (
    <div className="p-4 bg-white border border-stone-200 rounded-xl">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.user?.avatar_url ? (
            <Image
              src={review.user.avatar_url}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
              <User className="h-5 w-5 text-stone-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <h4 className="font-medium text-stone-900 text-sm">
                {displayName}
              </h4>
              <p className="text-xs text-stone-500">{timeAgo}</p>
            </div>
            <StarRating
              rating={review.rating}
              size="sm"
              primaryColor={primaryColor}
            />
          </div>
          
          {review.comment && (
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


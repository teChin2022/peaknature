import { Star } from 'lucide-react'
import { ReviewCard } from './review-card'
import { StarRatingCompact } from './star-rating'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user?: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
  primaryColor?: string
}

export function ReviewsSection({
  reviews,
  averageRating,
  totalReviews,
  primaryColor = '#f59e0b',
}: ReviewsSectionProps) {
  if (totalReviews === 0) {
    return (
      <div className="py-8 text-center">
        <Star className="h-12 w-12 mx-auto text-stone-300 mb-3" />
        <h3 className="font-medium text-stone-900 mb-1">No reviews yet</h3>
        <p className="text-sm text-stone-500">
          Be the first to share your experience!
        </p>
      </div>
    )
  }

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => r.rating === rating).length
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { rating, count, percentage }
  })

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 pb-6 border-b border-stone-200">
        {/* Average Rating */}
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-stone-900 mb-2">
            {averageRating.toFixed(1)}
          </div>
          <StarRatingCompact
            rating={averageRating}
            reviewCount={totalReviews}
            size="md"
            primaryColor={primaryColor}
          />
          <p className="text-sm text-stone-500 mt-1">
            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm text-stone-600 w-12">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
              <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: primaryColor,
                  }}
                />
              </div>
              <span className="text-sm text-stone-500 w-8 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            primaryColor={primaryColor}
          />
        ))}
      </div>
    </div>
  )
}


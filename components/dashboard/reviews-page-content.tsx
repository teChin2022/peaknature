'use client'

import { Star, MessageSquare, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import Image from 'next/image'
import { StarRating, StarRatingCompact } from '@/components/review/star-rating'
import { Pagination } from '@/components/ui/pagination'
import { useTranslations } from 'next-intl'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  booking_id: string
  user?: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  booking?: {
    check_in: string
    check_out: string
    room?: {
      name: string
    }
  }
}

interface ReviewsPageContentProps {
  slug: string
  tenant: {
    name: string
    primary_color: string
  }
  reviews: Review[]
  stats: {
    total: number
    average: number
    distribution: Record<number, number>
  }
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export function ReviewsPageContent({
  slug,
  tenant,
  reviews,
  stats,
  pagination,
}: ReviewsPageContentProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{t('reviews.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('reviews.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('reviews.averageRating')}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.average > 0 ? stats.average.toFixed(1) : '-'}
                </p>
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tenant.primary_color}15` }}
            >
              <Star className="h-5 w-5" style={{ color: tenant.primary_color }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('reviews.totalReviews')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tenant.primary_color}15` }}
            >
              <MessageSquare className="h-5 w-5" style={{ color: tenant.primary_color }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{t('reviews.distribution')}</p>
              <div className="flex items-center gap-1 mt-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div 
                    key={star} 
                    className="h-6 w-3 rounded-sm"
                    style={{ 
                      backgroundColor: stats.distribution[star] > 0 
                        ? tenant.primary_color 
                        : '#e5e7eb',
                      opacity: stats.distribution[star] > 0 
                        ? 0.3 + (stats.distribution[star] / stats.total) * 0.7
                        : 1
                    }}
                  />
                ))}
              </div>
            </div>
            <div 
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tenant.primary_color}15` }}
            >
              <TrendingUp className="h-5 w-5" style={{ color: tenant.primary_color }} />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {review.user?.avatar_url ? (
                    <Image
                      src={review.user.avatar_url}
                      alt={review.user.full_name || 'Guest'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: tenant.primary_color }}
                    >
                      {(review.user?.full_name || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {review.user?.full_name || 'Guest'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {review.booking?.room?.name} • {format(parseISO(review.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <StarRatingCompact rating={review.rating} />
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-center py-16">
            <div 
              className="h-14 w-14 mx-auto rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${tenant.primary_color}15` }}
            >
              <Star className="h-7 w-7" style={{ color: tenant.primary_color }} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t('reviews.noReviews')}</h3>
            <p className="text-sm text-gray-500">{t('reviews.noReviewsDesc')}</p>
          </div>
        </div>
      )}
    </div>
  )
}


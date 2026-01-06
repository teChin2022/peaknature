'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
  showValue?: boolean
  primaryColor?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const gapClasses = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className,
  showValue = false,
  primaryColor = '#f59e0b',
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1)
    }
  }

  return (
    <div className={cn('flex items-center', gapClasses[size], className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFilled = index < rating

        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(index)}
            className={cn(
              'relative transition-transform',
              interactive && 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-400 rounded',
              !interactive && 'cursor-default'
            )}
            aria-label={`${index + 1} star${index !== 0 ? 's' : ''}`}
          >
            <Star
              className={cn(sizeClasses[size])}
              fill={isFilled ? primaryColor : 'transparent'}
              style={{ color: isFilled ? primaryColor : '#d1d5db' }}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-stone-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Compact display version for cards
export function StarRatingCompact({
  rating,
  reviewCount,
  size = 'sm',
  primaryColor = '#f59e0b',
}: {
  rating: number
  reviewCount?: number
  size?: 'sm' | 'md'
  primaryColor?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Star
        className={cn(sizeClasses[size])}
        fill={primaryColor}
        style={{ color: primaryColor }}
      />
      <span className="text-sm font-medium text-stone-900">
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-sm text-stone-500">
          ({reviewCount})
        </span>
      )}
    </div>
  )
}


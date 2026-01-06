'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StarRating } from './star-rating'
import { createClient } from '@/lib/supabase/client'
import type { ExistingReview } from './review-dialog'

interface ReviewFormProps {
  bookingId: string
  roomName: string
  tenantSlug: string
  primaryColor: string
  onSuccess?: (review: ExistingReview) => void
  onCancel?: () => void
}

export function ReviewForm({
  bookingId,
  roomName,
  tenantSlug,
  primaryColor,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Please login to submit a review')
        return
      }

      // Check if review already exists
      const { data: existingCheck } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .single()

      if (existingCheck) {
        setError('You have already reviewed this booking')
        return
      }

      // Submit new review
      const { data: newReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        })
        .select('id, rating, comment, created_at')
        .single()

      if (insertError) {
        console.error('Error submitting review:', insertError)
        // Check for RLS policy error
        if (insertError.code === '42501' || insertError.message?.includes('policy')) {
          setError('Cannot submit review. Your booking must be completed or checked out first.')
        } else {
          setError('Failed to submit review. Please try again.')
        }
        return
      }

      // Success
      if (onSuccess && newReview) {
        onSuccess(newReview)
      } else {
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center pb-4 border-b border-stone-200">
        <h3 className="font-semibold text-stone-900 text-lg">
          How was your stay?
        </h3>
        <p className="text-sm text-stone-600 mt-1">
          Rate your experience at {roomName}
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex flex-col items-center gap-3">
        <Label className="text-sm font-medium text-stone-700">
          Your Rating
        </Label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
          primaryColor={primaryColor}
        />
        <p className="text-sm text-stone-500">
          {rating === 0 && 'Tap a star to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent'}
        </p>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment" className="text-sm font-medium text-stone-700">
          Your Review (Optional)
        </Label>
        <Textarea
          id="comment"
          placeholder="Share your experience with other guests..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
          className="resize-none"
        />
        <p className="text-xs text-stone-500 text-right">
          {comment.length}/500 characters
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 text-white"
          style={{ backgroundColor: primaryColor }}
          disabled={isSubmitting || rating === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Review
            </>
          )}
        </Button>
      </div>
    </form>
  )
}


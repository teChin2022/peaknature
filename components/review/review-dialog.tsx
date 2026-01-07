'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquarePlus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ReviewForm } from './review-form'
import { StarRating } from './star-rating'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'

export interface ExistingReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

interface ReviewDialogProps {
  bookingId: string
  roomName: string
  tenantSlug: string
  primaryColor: string
  hasReview?: boolean
  existingReview?: ExistingReview | null
}

export function ReviewDialog({
  bookingId,
  roomName,
  tenantSlug,
  primaryColor,
  hasReview = false,
  existingReview = null,
}: ReviewDialogProps) {
  const router = useRouter()
  const t = useTranslations('review')
  const tCommon = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [currentReview, setCurrentReview] = useState<ExistingReview | null>(existingReview)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Sync currentReview with existingReview prop when it changes
  useEffect(() => {
    if (existingReview) {
      setCurrentReview(existingReview)
    }
  }, [existingReview])

  // If just submitted, show "Reviewed" immediately (while page refreshes)
  if (hasSubmitted) {
    return (
      <span className="text-sm text-green-600 flex items-center gap-1">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        {t('reviewSubmitted')}
      </span>
    )
  }

  // If has review but no data passed, show simple "Reviewed" text
  if (hasReview && !currentReview) {
    return (
      <span className="text-sm text-stone-500 flex items-center gap-1">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        {t('reviewed')}
      </span>
    )
  }

  // If we have review data, show view-only dialog
  if (currentReview) {
    const ratingLabels: Record<number, string> = {
      1: t('ratingPoor'),
      2: t('ratingFair'),
      3: t('ratingGood'),
      4: t('ratingVeryGood'),
      5: t('ratingExcellent'),
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {t('viewReview')}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">{t('yourReview')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-stone-200">
              <h3 className="font-semibold text-stone-900 text-lg">
                {t('yourReview')}
              </h3>
              <p className="text-sm text-stone-600 mt-1">
                {roomName}
              </p>
            </div>

            {/* Rating Display */}
            <div className="flex flex-col items-center gap-3">
              <StarRating
                rating={currentReview.rating}
                size="lg"
                primaryColor={primaryColor}
              />
              <p className="text-sm text-stone-600">
                {ratingLabels[currentReview.rating]}
              </p>
            </div>

            {/* Comment Display */}
            {currentReview.comment && (
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="text-stone-700 italic">
                  &ldquo;{currentReview.comment}&rdquo;
                </p>
              </div>
            )}

            {/* Date */}
            <p className="text-center text-xs text-stone-500">
              {t('reviewedOn')} {format(new Date(currentReview.created_at), 'MMMM d, yyyy')}
            </p>

            {/* Close Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              {tCommon('close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // No review yet - show write review dialog
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {t('writeReview')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{t('writeReview')}</DialogTitle>
        </DialogHeader>
        <ReviewForm
          bookingId={bookingId}
          roomName={roomName}
          tenantSlug={tenantSlug}
          primaryColor={primaryColor}
          onSuccess={(newReview) => {
            setCurrentReview(newReview)
            setHasSubmitted(true)
            setIsOpen(false)
            router.refresh() // Refresh server data
          }}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}


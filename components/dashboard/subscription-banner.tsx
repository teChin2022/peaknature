'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Clock, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubscriptionStatus } from '@/lib/subscription'

interface SubscriptionBannerProps {
  subscriptionData: {
    status: SubscriptionStatus
    daysRemaining: number
    trialEndsAt: string | null
    subscriptionEndsAt: string | null
  } | null
  slug: string
  primaryColor?: string
}

export function SubscriptionBanner({ subscriptionData, slug, primaryColor }: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if banner was dismissed in this session
    const dismissedKey = `subscription-banner-dismissed-${subscriptionData?.status}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(dismissedKey)) {
      setDismissed(true)
    }
  }, [subscriptionData?.status])

  if (!subscriptionData || !mounted || dismissed) return null

  const handleDismiss = () => {
    const dismissedKey = `subscription-banner-dismissed-${subscriptionData.status}`
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(dismissedKey, 'true')
    }
    setDismissed(true)
  }

  // Show banner for expired subscriptions
  if (subscriptionData.status === 'expired') {
    return (
      <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
        <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm sm:text-base">
                Your trial has expired
              </p>
              <p className="text-xs sm:text-sm text-white/80">
                Upgrade to Pro to continue using all features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/dashboard/subscription`}>
              <Button 
                size="sm"
                className="bg-white text-red-600 hover:bg-white/90 font-medium"
              >
                <Crown className="h-4 w-4 mr-1.5" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Show banner for trial users with less than 14 days remaining
  if (subscriptionData.status === 'trial' && subscriptionData.daysRemaining <= 14) {
    const isUrgent = subscriptionData.daysRemaining <= 7

    return (
      <div className={`${isUrgent ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} text-white`}>
        <div className="px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm sm:text-base">
                {subscriptionData.daysRemaining === 0 
                  ? 'Your trial ends today!'
                  : subscriptionData.daysRemaining === 1
                    ? 'Your trial ends tomorrow!'
                    : `${subscriptionData.daysRemaining} days left in your trial`
                }
              </p>
              <p className="text-xs sm:text-sm text-white/80">
                Upgrade to Pro to keep all features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/${slug}/dashboard/subscription`}>
              <Button 
                size="sm"
                className={`font-medium ${isUrgent ? 'bg-white text-amber-600 hover:bg-white/90' : 'bg-white text-blue-600 hover:bg-white/90'}`}
              >
                <Crown className="h-4 w-4 mr-1.5" />
                Upgrade
              </Button>
            </Link>
            <button 
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}


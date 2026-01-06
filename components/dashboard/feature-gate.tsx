'use client'

import { Crown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FeatureKey, DEFAULT_FEATURES, SubscriptionInfo } from '@/lib/subscription'

interface FeatureGateProps {
  feature: FeatureKey
  subscriptionInfo: SubscriptionInfo | null
  slug: string
  children: React.ReactNode
  showUpgrade?: boolean
}

export function FeatureGate({ 
  feature, 
  subscriptionInfo, 
  slug, 
  children,
  showUpgrade = true 
}: FeatureGateProps) {
  // If no subscription info, allow access (fail open for better UX)
  if (!subscriptionInfo) {
    return <>{children}</>
  }

  // Check if feature is accessible
  const canAccess = subscriptionInfo.canAccessFeature(feature)
  
  if (canAccess) {
    return <>{children}</>
  }

  // Feature is restricted
  if (!showUpgrade) {
    return null
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
        <div className="text-center p-6">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro Feature</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upgrade to Pro to unlock this feature
          </p>
          <Link href={`/${slug}/dashboard/subscription`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  )
}

interface FeatureLimitBannerProps {
  feature: FeatureKey
  subscriptionInfo: SubscriptionInfo | null
  currentCount: number
  slug: string
}

export function FeatureLimitBanner({
  feature,
  subscriptionInfo,
  currentCount,
  slug,
}: FeatureLimitBannerProps) {
  if (!subscriptionInfo) return null

  const limit = subscriptionInfo.getFeatureLimit(feature)
  if (limit === null) return null // Unlimited

  const isNearLimit = currentCount >= limit * 0.8
  const isAtLimit = currentCount >= limit

  if (!isNearLimit) return null

  return (
    <div className={`p-4 rounded-lg mb-4 ${
      isAtLimit 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-amber-50 border border-amber-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-medium ${isAtLimit ? 'text-red-800' : 'text-amber-800'}`}>
            {isAtLimit 
              ? `You've reached the limit of ${limit} ${feature.replace('_', ' ')}`
              : `You're using ${currentCount} of ${limit} ${feature.replace('_', ' ')}`
            }
          </p>
          <p className={`text-sm ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`}>
            {isAtLimit 
              ? 'Upgrade to Pro for unlimited access'
              : 'Consider upgrading to Pro for unlimited access'
            }
          </p>
        </div>
        <Link href={`/${slug}/dashboard/subscription`}>
          <Button 
            size="sm"
            className={isAtLimit 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-amber-600 hover:bg-amber-700'
            }
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade
          </Button>
        </Link>
      </div>
    </div>
  )
}

interface ExpiredBannerProps {
  subscriptionInfo: SubscriptionInfo | null
  slug: string
  primaryColor?: string
}

export function ExpiredBanner({ subscriptionInfo, slug, primaryColor }: ExpiredBannerProps) {
  if (!subscriptionInfo || subscriptionInfo.status !== 'expired') return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Lock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">Your trial has expired</p>
            <p className="text-sm text-red-600">
              Some features are restricted. Upgrade to Pro to continue using all features.
            </p>
          </div>
        </div>
        <Link href={`/${slug}/dashboard/subscription`}>
          <Button 
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </Link>
      </div>
    </div>
  )
}

interface TrialBannerProps {
  subscriptionInfo: SubscriptionInfo | null
  slug: string
  primaryColor?: string
}

export function TrialBanner({ subscriptionInfo, slug, primaryColor }: TrialBannerProps) {
  if (!subscriptionInfo || subscriptionInfo.status !== 'trial') return null
  
  // Only show if less than 14 days remaining
  if (subscriptionInfo.daysRemaining > 14) return null

  const isUrgent = subscriptionInfo.daysRemaining <= 7

  return (
    <div className={`border rounded-xl p-4 mb-6 ${
      isUrgent 
        ? 'bg-amber-50 border-amber-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            isUrgent ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <Crown className={`h-5 w-5 ${isUrgent ? 'text-amber-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <p className={`font-medium ${isUrgent ? 'text-amber-800' : 'text-blue-800'}`}>
              {subscriptionInfo.daysRemaining} days left in your trial
            </p>
            <p className={`text-sm ${isUrgent ? 'text-amber-600' : 'text-blue-600'}`}>
              Upgrade to Pro to keep all features after your trial ends
            </p>
          </div>
        </div>
        <Link href={`/${slug}/dashboard/subscription`}>
          <Button 
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            Upgrade Now
          </Button>
        </Link>
      </div>
    </div>
  )
}


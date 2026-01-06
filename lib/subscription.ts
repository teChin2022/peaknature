// Plan feature keys
export type FeatureKey = 
  | 'rooms'
  | 'bookings_per_month'
  | 'analytics'
  | 'custom_branding'
  | 'online_payments'
  | 'email_notifications'
  | 'line_notifications'
  | 'priority_support'
  | 'api_access'

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export interface PlanFeature {
  feature_key: FeatureKey
  feature_name: string
  description: string | null
  limit_value: number | null
  is_enabled: boolean
}

export interface SubscriptionInfo {
  plan: 'free' | 'pro'
  status: SubscriptionStatus
  trialStartedAt: Date | null
  trialEndsAt: Date | null
  subscriptionStartedAt: Date | null
  subscriptionEndsAt: Date | null
  daysRemaining: number
  isTrialActive: boolean
  isSubscriptionActive: boolean
  canAccessFeature: (feature: FeatureKey) => boolean
  getFeatureLimit: (feature: FeatureKey) => number | null
}

// Default feature configuration (used when DB is not available)
// Free plan (trial) has all the same features as Pro - difference is trial period vs paid
export const DEFAULT_FEATURES: Record<string, Record<FeatureKey, { enabled: boolean; limit: number | null }>> = {
  free: {
    rooms: { enabled: true, limit: null },
    bookings_per_month: { enabled: true, limit: null },
    analytics: { enabled: true, limit: null },
    custom_branding: { enabled: true, limit: null },
    online_payments: { enabled: true, limit: null },
    email_notifications: { enabled: true, limit: null },
    line_notifications: { enabled: true, limit: null },
    priority_support: { enabled: true, limit: null },
    api_access: { enabled: true, limit: null },
  },
  pro: {
    rooms: { enabled: true, limit: null },
    bookings_per_month: { enabled: true, limit: null },
    analytics: { enabled: true, limit: null },
    custom_branding: { enabled: true, limit: null },
    online_payments: { enabled: true, limit: null },
    email_notifications: { enabled: true, limit: null },
    line_notifications: { enabled: true, limit: null },
    priority_support: { enabled: true, limit: null },
    api_access: { enabled: true, limit: null },
  },
}

// Pro plan price
export const PRO_PLAN_PRICE = 699 // THB per month

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  switch (status) {
    case 'trial':
      return 'Free Trial'
    case 'active':
      return 'Active'
    case 'expired':
      return 'Expired'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

/**
 * Get status color class
 */
export function getStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'trial':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'expired':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'cancelled':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

/**
 * Create subscription info from tenant data (client-safe)
 */
export function createSubscriptionInfo(tenant: {
  plan: string
  subscription_status: string
  trial_started_at: string | null
  trial_ends_at: string | null
  subscription_started_at: string | null
  subscription_ends_at: string | null
}): SubscriptionInfo {
  const now = new Date()
  const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const subscriptionEndsAt = tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null
  
  let daysRemaining = 0
  if (tenant.subscription_status === 'trial' && trialEndsAt) {
    daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  } else if (tenant.subscription_status === 'active' && subscriptionEndsAt) {
    daysRemaining = Math.max(0, Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const isTrialActive = tenant.subscription_status === 'trial' && trialEndsAt && trialEndsAt > now
  const isSubscriptionActive = tenant.subscription_status === 'active' || isTrialActive

  return {
    plan: tenant.plan as 'free' | 'pro',
    status: tenant.subscription_status as SubscriptionStatus,
    trialStartedAt: tenant.trial_started_at ? new Date(tenant.trial_started_at) : null,
    trialEndsAt,
    subscriptionStartedAt: tenant.subscription_started_at ? new Date(tenant.subscription_started_at) : null,
    subscriptionEndsAt,
    daysRemaining,
    isTrialActive,
    isSubscriptionActive,
    canAccessFeature: (feature: FeatureKey) => {
      if (isTrialActive) {
        return DEFAULT_FEATURES.pro[feature]?.enabled ?? false
      }
      return DEFAULT_FEATURES[tenant.plan]?.[feature]?.enabled ?? false
    },
    getFeatureLimit: (feature: FeatureKey) => {
      if (isTrialActive) {
        return DEFAULT_FEATURES.pro[feature]?.limit ?? null
      }
      return DEFAULT_FEATURES[tenant.plan]?.[feature]?.limit ?? null
    },
  }
}

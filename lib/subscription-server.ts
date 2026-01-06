import { createClient } from '@/lib/supabase/server'
import { 
  FeatureKey, 
  SubscriptionInfo, 
  PlanFeature,
  DEFAULT_FEATURES,
  createSubscriptionInfo 
} from './subscription'

/**
 * Get subscription info for a tenant (Server-side)
 */
export async function getSubscriptionInfo(tenantId: string): Promise<SubscriptionInfo | null> {
  const supabase = await createClient()
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('plan, subscription_status, trial_started_at, trial_ends_at, subscription_started_at, subscription_ends_at')
    .eq('id', tenantId)
    .single()
  
  if (error || !tenant) {
    return null
  }

  return createSubscriptionInfo(tenant)
}

/**
 * Check if a tenant can access a specific feature
 */
export async function canAccessFeature(tenantId: string, feature: FeatureKey): Promise<boolean> {
  const info = await getSubscriptionInfo(tenantId)
  if (!info) return false
  return info.canAccessFeature(feature)
}

/**
 * Get the limit for a specific feature
 */
export async function getFeatureLimit(tenantId: string, feature: FeatureKey): Promise<number | null> {
  const info = await getSubscriptionInfo(tenantId)
  if (!info) return 0
  return info.getFeatureLimit(feature)
}

/**
 * Check if tenant has reached the room limit
 */
export async function hasReachedRoomLimit(tenantId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const limit = await getFeatureLimit(tenantId, 'rooms')
  if (limit === null) return false // Unlimited
  
  const { count } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
  
  return (count || 0) >= limit
}

/**
 * Check if tenant has reached monthly booking limit
 */
export async function hasReachedBookingLimit(tenantId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const limit = await getFeatureLimit(tenantId, 'bookings_per_month')
  if (limit === null) return false // Unlimited
  
  // Count bookings created this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth.toISOString())
  
  return (count || 0) >= limit
}

/**
 * Get plan features from database
 */
export async function getPlanFeatures(plan: string): Promise<PlanFeature[]> {
  const supabase = await createClient()
  
  const { data: features } = await supabase
    .from('plan_features')
    .select('*')
    .eq('plan', plan)
  
  return features || []
}


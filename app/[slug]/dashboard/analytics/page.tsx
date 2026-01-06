import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Tenant, TenantSettings, defaultTenantSettings } from '@/types/database'
import { canAccessFeature } from '@/lib/subscription-server'
import { AnalyticsContent } from '@/components/dashboard/analytics-content'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>
}

async function getAnalytics(slug: string) {
  const supabase = await createClient()
  
  // Get tenant first - need ID for other queries
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single() as { data: Tenant | null }
  
  if (!tenantData) return null

  const tenantId = tenantData.id
  const now = new Date()
  const thisMonthStart = startOfMonth(now).toISOString()
  const thisMonthEnd = endOfMonth(now).toISOString()
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()

  // Run ALL queries in parallel for maximum performance
  const [
    thisMonthBookingsResult,
    lastMonthBookingsResult,
    totalBookingsResult,
    uniqueGuestsResult,
    roomCountResult,
    reviewsResult,
    hasAnalyticsAccess,
  ] = await Promise.all([
    supabase.from('bookings').select('total_price, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', thisMonthStart)
      .lte('created_at', thisMonthEnd),
    supabase.from('bookings').select('total_price, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase.from('bookings').select('user_id')
      .eq('tenant_id', tenantId),
    supabase.from('rooms').select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),
    supabase.from('reviews').select('rating').limit(100),
    canAccessFeature(tenantId, 'analytics'),
  ])

  const thisMonthBookings = thisMonthBookingsResult.data as { total_price: number; status: string }[] | null
  const lastMonthBookings = lastMonthBookingsResult.data as { total_price: number; status: string }[] | null
  const uniqueGuests = uniqueGuestsResult.data as { user_id: string }[] | null
  const reviews = reviewsResult.data as { rating: number }[] | null

  const thisMonthRevenue = thisMonthBookings
    ?.filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total_price, 0) || 0

  const lastMonthRevenue = lastMonthBookings
    ?.filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total_price, 0) || 0

  const revenueGrowth = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : '0'

  const uniqueGuestCount = new Set(uniqueGuests?.map(g => g.user_id)).size

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return {
    tenant: tenantData,
    thisMonthRevenue,
    lastMonthRevenue,
    revenueGrowth,
    totalBookings: totalBookingsResult.count || 0,
    thisMonthBookings: thisMonthBookings?.length || 0,
    uniqueGuests: uniqueGuestCount,
    roomCount: roomCountResult.count || 0,
    avgRating,
    reviewCount: reviews?.length || 0,
    hasAnalyticsAccess,
  }
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { slug } = await params
  const analytics = await getAnalytics(slug)

  if (!analytics) {
    return <div>Failed to load analytics</div>
  }

  const settings = (analytics.tenant.settings as TenantSettings) || defaultTenantSettings
  const currency = settings.currency || 'USD'

  return (
    <AnalyticsContent
      slug={slug}
      analytics={analytics}
      currency={currency}
      isLocked={!analytics.hasAnalyticsAccess}
    />
  )
}
